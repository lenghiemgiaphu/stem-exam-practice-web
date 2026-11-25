import { HttpError } from '@/lib/quiz/errors'

/** Ngữ cảnh câu hỏi — cùng cấu trúc với `chat.context` mà public/app.js gửi cho AITutor. */
export interface TutorContext {
  subjectLabel: string
  subjectKey: string
  grade: string
  topic: string
  questionText: string
  passageText: string
  optionsText: string
  correctAnswerText: string
  userAnswerText: string
  explanation: string
}

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export interface GeminiUsage {
  inputTokens: number
  outputTokens: number
  /** Token "suy nghĩ" của Gemini 2.5 — được tính tiền như token đầu ra nhưng nằm ngoài candidatesTokenCount. */
  thinkingTokens: number
}

export interface GeminiResult {
  text: string
  usage: GeminiUsage
  model: string
  latencyMs: number
  finishReason: string | null
}

/** Giữ nguyên nội dung prompt của public/ai.js để hành vi gia sư không đổi khi chuyển sang server. */
export function buildSystemPrompt(ctx: TutorContext) {
  return [
    'Bạn là gia sư Toán học, Vật lí, Hóa học, Sinh học, Tiếng Anh THPT thân thiện, trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu.',
    'Hãy giải thích từng bước, nêu rõ kiến thức/công thức liên quan, và chỉ ra lỗi sai thường gặp khi phù hợp.',
    'Không bịa đặt dữ kiện. Nếu chưa chắc chắn, hãy nói rõ.',
    'Mọi công thức toán học, ký hiệu và biểu thức phải viết bằng LaTeX: dùng $...$ cho công thức trên cùng dòng và $$...$$ cho công thức đứng riêng một dòng (ví dụ $x^2 - 4x + 3 = 0$, $\\int_0^1 f(x)\\,dx$). Không dùng ký tự Unicode thay cho công thức phức tạp.',
    ...(ctx.subjectKey === 'English'
      ? [
          'Với câu hỏi Tiếng Anh: khi học sinh nhờ giải thích câu hỏi, hãy trả lời theo 3 mục có tiêu đề in đậm: **Đáp án đúng**; **Dịch nghĩa** (dịch câu/ngữ cảnh liên quan sang tiếng Việt); **Giải thích ngữ pháp / từ vựng** (nêu cấu trúc, quy tắc, vì sao các đáp án khác sai và vài từ/cụm từ mở rộng). Giữ nguyên từ tiếng Anh, giải thích bằng tiếng Việt. Với câu hỏi phụ của học sinh thì trả lời trực tiếp, không cần đủ 3 mục.',
        ]
      : []),
    '',
    'BỐI CẢNH CÂU HỎI:',
    `Môn: ${ctx.subjectLabel}${ctx.grade ? ` - Lớp ${ctx.grade}` : ''} - Chuyên đề: ${ctx.topic}`,
    ctx.passageText ? `Đoạn văn dùng chung cho câu hỏi:\n${ctx.passageText}` : '',
    `Câu hỏi: ${ctx.questionText}`,
    ctx.optionsText ? `Các lựa chọn:\n${ctx.optionsText}` : '',
    `Đáp án đúng: ${ctx.correctAnswerText}`,
    `Học sinh đã trả lời: ${ctx.userAnswerText}`,
    `Giải thích có sẵn: ${ctx.explanation}`,
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Đơn giá USD / 1 triệu token (đã gồm thinking tokens ở phía đầu ra).
 * Nguồn: https://ai.google.dev/gemini-api/docs/pricing — kiểm tra lại khi đổi model.
 * Có thể ghi đè bằng GEMINI_PRICE_INPUT_PER_M / GEMINI_PRICE_OUTPUT_PER_M.
 */
const PRICING_PER_MILLION: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
}
const FALLBACK_PRICING = PRICING_PER_MILLION['gemini-2.5-flash']

function priceFor(model: string) {
  const envIn = Number(process.env.GEMINI_PRICE_INPUT_PER_M)
  const envOut = Number(process.env.GEMINI_PRICE_OUTPUT_PER_M)
  if (envIn > 0 && envOut > 0) return { input: envIn, output: envOut }
  const key = Object.keys(PRICING_PER_MILLION)
    .filter((k) => model.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return key ? PRICING_PER_MILLION[key] : FALLBACK_PRICING
}

export function estimateCostUsd(model: string, usage: GeminiUsage) {
  const price = priceFor(model)
  const cost = (usage.inputTokens * price.input + (usage.outputTokens + usage.thinkingTokens) * price.output) / 1_000_000
  return Math.round(cost * 1e6) / 1e6
}

export function resolveModel() {
  const model = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim()
  // Model được ghép vào URL → chỉ cho phép ký tự an toàn.
  return /^[A-Za-z0-9._-]+$/.test(model) ? model : 'gemini-2.5-flash'
}

export const hasGeminiKey = () => {
  const key = process.env.GEMINI_API_KEY?.trim()
  return !!key && !/YOUR_/i.test(key)
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number }
}

const REQUEST_TIMEOUT_MS = 50_000

export async function askGemini(ctx: TutorContext, history: ChatMessage[]): Promise<GeminiResult> {
  const model = resolveModel()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const startedAt = Date.now()

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY!.trim() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt(ctx) }] },
        contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError'
    throw new GeminiError(timedOut ? 504 : 502, timedOut ? 'ai/timeout' : 'ai/network', 'Không thể kết nối tới AI. Vui lòng thử lại.')
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    // Chỉ log mã trạng thái, không log nội dung (có thể chứa nội dung câu hỏi).
    console.error('[ai-explain] Gemini HTTP', response.status)
    throw new GeminiError(
      response.status === 429 ? 429 : 502,
      `ai/http-${response.status}`,
      response.status === 429
        ? 'AI đang quá tải hoặc đã vượt giới hạn yêu cầu. Vui lòng thử lại sau ít phút.'
        : 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.',
    )
  }

  const data = (await response.json()) as GeminiResponse
  const candidate = data.candidates?.[0]
  const text = (candidate?.content?.parts ?? []).map((p) => p.text || '').join('').trim()
  if (!text) throw new GeminiError(502, 'ai/empty', 'AI không trả về nội dung. Hãy thử đặt câu hỏi theo cách khác.')

  const meta = data.usageMetadata ?? {}
  if (candidate?.finishReason === 'MAX_TOKENS') console.warn('[ai-explain] câu trả lời bị cắt do chạm maxOutputTokens')

  return {
    text,
    model,
    latencyMs: Date.now() - startedAt,
    finishReason: candidate?.finishReason ?? null,
    usage: {
      inputTokens: meta.promptTokenCount ?? 0,
      outputTokens: meta.candidatesTokenCount ?? 0,
      thinkingTokens: meta.thoughtsTokenCount ?? 0,
    },
  }
}

/** Lỗi kèm `code` (ví dụ `ai/http-429`) để client ánh xạ sang thông báo, giống AITutor.errorMessage. */
export class GeminiError extends HttpError {
  constructor(
    status: number,
    public code: string,
    message: string,
  ) {
    super(status, message)
  }
}
