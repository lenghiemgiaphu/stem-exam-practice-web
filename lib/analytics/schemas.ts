import { z } from 'zod'

export const COHORT_TAGS = ['nang_cao_nguyen', 'general'] as const
export const AUTH_PROVIDERS = ['firebase', 'anonymous'] as const
export const SESSION_TYPES = ['exam', 'topic_practice', 'spaced_review'] as const
export const ATTEMPT_CONTEXTS = ['initial', 'retest', 'spaced_review'] as const

export type CohortTag = (typeof COHORT_TAGS)[number]
export type SessionType = (typeof SESSION_TYPES)[number]
export type AttemptContext = (typeof ATTEMPT_CONTEXTS)[number]

/** Firebase `uid` hoặc mã khách ẩn danh `anon_<uuid>`. */
export const userIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(128)
  .regex(/^[A-Za-z0-9_.:@-]+$/)

/** Mã câu hỏi / chuyên đề / đề thi: chuỗi ngắn do client sinh ra. */
export const idText = z.string().trim().min(1).max(128)

export const optionalText = (max: number) => z.string().trim().max(max).nullish()

export const sessionIdSchema = z.uuid()

export const nonNegativeInt = (max = 100_000) => z.number().int().min(0).max(max)
