import { NextResponse } from 'next/server'
import { z } from 'zod'
import { HttpError } from '@/lib/quiz/errors'
import { createRoom, createSchema, enforceLimit, getState, hostAction, joinRoom, submitAnswer } from '@/lib/live/engine'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }
// 40 câu × (câu hỏi 600 + 4 phương án × 300 + giải thích 900) ≈ 112 KB; chừa dư cho ký tự thoát JSON.
const MAX_BODY_CHARS = 300_000

const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

const codeSchema = z.string().regex(/^\d{6}$/)

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create') }).extend(createSchema.shape),
  z.object({ action: z.literal('join'), code: codeSchema, name: z.string().max(60), pid: z.string().max(64).optional() }),
  z.object({ action: z.enum(['start', 'next', 'end']), code: codeSchema, hostToken: z.string().max(64) }),
  z.object({ action: z.literal('answer'), code: codeSchema, pid: z.string().max(64), choice: z.string().max(2) }),
])

const json = (data: unknown, init?: ResponseInit) => NextResponse.json(data, { ...init, headers: { ...NO_STORE, ...init?.headers } })

function failure(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, { status: error.status })
  if (error instanceof z.ZodError) return json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 })
  console.error('[live] unexpected error', error)
  return json({ error: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại.' }, { status: 500 })
}

/** Đọc thân JSON có giới hạn kích thước; JSON hỏng là lỗi 400 của người gửi, không phải lỗi máy chủ. */
async function readBody(req: Request): Promise<unknown> {
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_CHARS * 2) throw new HttpError(413, 'Dữ liệu gửi lên quá lớn.')
  const raw = await req.text()
  if (raw.length > MAX_BODY_CHARS) throw new HttpError(413, 'Dữ liệu gửi lên quá lớn.')
  try {
    return JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'Dữ liệu gửi lên không hợp lệ.')
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = codeSchema.parse(searchParams.get('code') ?? '')
    const state = await getState(code, {
      pid: searchParams.get('pid') ?? undefined,
      hostToken: searchParams.get('host') ?? undefined,
    })
    return json(state)
  } catch (error) {
    if (error instanceof z.ZodError) return json({ error: 'Mã phòng không hợp lệ.' }, { status: 404 })
    return failure(error)
  }
}

/**
 * Giới hạn tốc độ theo từng hành động (Upstash Ratelimit, cửa sổ trượt):
 *  - create : 8 / phút / IP                (tạo phòng tốn tài nguyên nhất)
 *  - join   : 200 / phút / IP  và  300 / phút / phòng
 *             — cả một lớp (tới 200 học sinh) thường dùng CHUNG một IP Wi-Fi nên không thể đặt ngưỡng IP thấp;
 *               ngưỡng IP vẫn đủ chặn việc dò mã phòng 6 số hàng loạt.
 *  - answer : 20 / 10 giây / người chơi    (không giới hạn theo IP vì cả lớp trả lời cùng lúc)
 *  - start | next | end : 30 / 10 giây / phòng
 */
export async function POST(req: Request) {
  try {
    const body = actionSchema.parse(await readBody(req))
    const ip = clientIp(req)

    switch (body.action) {
      case 'create': {
        await enforceLimit('create', ip, 8, '1 m')
        const { action: _action, ...input } = body
        return json(await createRoom(input))
      }
      case 'join':
        await enforceLimit('join-ip', ip, 200, '1 m')
        await enforceLimit('join-room', body.code, 300, '1 m')
        return json(await joinRoom(body.code, body.name, body.pid))
      case 'answer':
        await enforceLimit('answer', body.pid, 20, '10 s')
        return json(await submitAnswer(body.code, body.pid, body.choice))
      default:
        await enforceLimit('host', body.code, 30, '10 s')
        return json(await hostAction(body.code, body.hostToken, body.action))
    }
  } catch (error) {
    return failure(error)
  }
}
