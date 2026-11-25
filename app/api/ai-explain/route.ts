import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { assertSameOrigin, failure, NO_STORE, readJson } from '@/lib/analytics/http'
import { enforceRateLimit } from '@/lib/analytics/rate-limit'
import { REQUERY_WINDOW_MINUTES } from '@/lib/analytics/constants'
import { idText, optionalText, sessionIdSchema, userIdSchema } from '@/lib/analytics/schemas'
import { HttpError } from '@/lib/quiz/errors'
import { askGemini, estimateCostUsd, GeminiError, hasGeminiKey, type ChatMessage, type TutorContext } from '@/lib/ai/gemini'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Chuỗi tùy chọn (null/undefined → ''), có giới hạn độ dài để chặn lạm dụng. */
const text = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => v ?? '')

const ctxSchema = z.object({
  subjectLabel: text(60),
  subjectKey: text(32),
  grade: z
    .union([z.string().max(8), z.number()])
    .nullish()
    .transform((v) => (v == null ? '' : String(v))),
  topic: text(200),
  questionText: text(6000),
  passageText: text(12000),
  optionsText: text(6000),
  correctAnswerText: text(3000),
  userAnswerText: text(3000),
  explanation: text(8000),
})

const bodySchema = z.object({
  /** Cùng định dạng với `ctx` và `history` mà public/ai.js đang gửi trực tiếp tới Gemini. */
  ctx: ctxSchema,
  history: z
    .array(z.object({ role: z.enum(['user', 'model']), text: z.string().min(1).max(4000) }))
    .min(1)
    .max(60),
  // Thông tin phục vụ thống kê.
  userId: userIdSchema,
  sessionId: sessionIdSchema.nullish(),
  questionId: idText.nullish(),
  questionType: optionalText(32),
  subject: optionalText(32),
  topicId: optionalText(128),
})

const MAX_HISTORY_MESSAGES = 20

/** Chỉ giữ các tin gần nhất, bắt đầu bằng tin của học sinh và kết thúc cũng bằng tin của học sinh. */
function prepareHistory(history: ChatMessage[]): ChatMessage[] {
  let trimmed = history.slice(-MAX_HISTORY_MESSAGES)
  while (trimmed.length && trimmed[0].role !== 'user') trimmed = trimmed.slice(1)
  return trimmed
}

/**
 * POST /api/ai-explain
 * Proxy gọi Gemini ở phía server (khóa GEMINI_API_KEY không còn lộ ra trình duyệt) và ghi
 * thống kê vào `ai_interactions`: token thực tế, chi phí ước tính, độ trễ, cờ hỏi lại.
 *
 * Phản hồi thành công: { answer, interactionId }  (interactionId = null nếu chưa cấu hình Supabase
 * hoặc lưu thống kê thất bại — gia sư AI vẫn hoạt động bình thường).
 * Phản hồi lỗi: { error, code } với code dạng `ai/http-429`, `ai/empty`, `ai/missing-key`...
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req)
    const body = bodySchema.parse(await readJson(req, 160 * 1024))

    if (!hasGeminiKey()) {
      return NextResponse.json(
        { error: 'Máy chủ chưa cấu hình GEMINI_API_KEY nên chưa thể bật Gia sư AI.', code: 'ai/missing-key' },
        { status: 503, headers: NO_STORE },
      )
    }
    enforceRateLimit(req, 'ai-explain', body.userId, { ip: 90, user: 12 })

    const history = prepareHistory(body.history)
    if (!history.length || history[history.length - 1].role !== 'user') {
      return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.', code: 'ai/bad-request' }, { status: 400, headers: NO_STORE })
    }

    const supabase = getSupabaseAdmin()
    const questionId = body.questionId ?? null

    // Kiểm tra "hỏi lại" chạy song song với lần gọi Gemini để không tăng độ trễ.
    const requeryCheck =
      supabase && questionId
        ? supabase
            .from('ai_interactions')
            .select('id')
            .eq('user_id', body.userId)
            .eq('question_id', questionId)
            .gte('created_at', new Date(Date.now() - REQUERY_WINDOW_MINUTES * 60_000).toISOString())
            .limit(1)
            .then(({ data, error }) => (error ? false : (data?.length ?? 0) > 0))
        : Promise.resolve(false)

    const [result, isRequery] = await Promise.all([askGemini(body.ctx as TutorContext, history), requeryCheck.catch(() => false)])

    let interactionId: string | null = null
    if (supabase) {
      const { data, error } = await supabase
        .from('ai_interactions')
        .insert({
          user_id: body.userId,
          session_id: body.sessionId ?? null,
          question_id: questionId,
          subject: body.subject || body.ctx.subjectKey || null,
          topic_id: body.topicId || null,
          question_type: body.questionType || null,
          model_name: result.model,
          input_tokens: result.usage.inputTokens,
          output_tokens: result.usage.outputTokens,
          estimated_cost_usd: estimateCostUsd(result.model, result.usage),
          is_requery: isRequery,
          latency_ms: result.latencyMs,
        })
        .select('id')
        .single()
      if (error) console.error('[ai-explain] không lưu được ai_interactions', error.code, error.message)
      else interactionId = data.id
    }

    return NextResponse.json({ answer: result.text, interactionId }, { headers: NO_STORE })
  } catch (error) {
    // Mọi lỗi của endpoint này đều kèm `code` để client hiển thị thông báo phù hợp.
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status, headers: NO_STORE })
    }
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message, code: error.status === 429 ? 'ai/http-429' : 'ai/rejected' },
        { status: error.status, headers: NO_STORE },
      )
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.', code: 'ai/bad-request' }, { status: 400, headers: NO_STORE })
    }
    return failure('ai-explain', error)
  }
}
