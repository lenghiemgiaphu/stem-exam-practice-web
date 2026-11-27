import {
  SM2_FIRST_INTERVAL_DAYS,
  SM2_INITIAL_EASE_FACTOR,
  SM2_MAX_INTERVAL_DAYS,
  SM2_MIN_EASE_FACTOR,
  SM2_PASS_QUALITY,
  SM2_QUALITY_CORRECT,
  SM2_QUALITY_WRONG,
  SM2_SECOND_INTERVAL_DAYS,
} from './constants'

/**
 * SM-2 cơ bản (SuperMemo-2) cho ôn tập ngắt quãng. Hằng số nằm ở ./constants.
 *
 * - quality 0–5: ở đây chỉ có 2 mức vì ta chỉ biết đúng/sai → đúng = 4, sai = 1.
 * - quality < 3  → học lại từ đầu: repetitions = 0, interval = 1 ngày, GIỮ NGUYÊN ease factor
 *                  (đúng theo mô tả gốc của SM-2).
 * - quality >= 3 → lần 1: 1 ngày, lần 2: 6 ngày, các lần sau: round(interval × EF).
 * - EF' = max(1.3, EF + 0.1 − (5 − q) × (0.08 + (5 − q) × 0.02)) khi quality >= 3.
 */
export interface Sm2State {
  intervalDays: number
  easeFactor: number
  repetitions: number
}

export const SM2_INITIAL: Sm2State = { intervalDays: 0, easeFactor: SM2_INITIAL_EASE_FACTOR, repetitions: 0 }

export const QUALITY_CORRECT = SM2_QUALITY_CORRECT
export const QUALITY_WRONG = SM2_QUALITY_WRONG

export const sm2Quality = (isCorrect: boolean) => (isCorrect ? QUALITY_CORRECT : QUALITY_WRONG)

export function sm2Next(prev: Sm2State, quality: number): Sm2State {
  if (quality < SM2_PASS_QUALITY) {
    return { intervalDays: SM2_FIRST_INTERVAL_DAYS, easeFactor: prev.easeFactor, repetitions: 0 }
  }

  let intervalDays: number
  if (prev.repetitions === 0) intervalDays = SM2_FIRST_INTERVAL_DAYS
  else if (prev.repetitions === 1) intervalDays = SM2_SECOND_INTERVAL_DAYS
  else intervalDays = Math.round(Math.max(prev.intervalDays, 1) * prev.easeFactor)

  const delta = 5 - quality
  const easeFactor = Math.max(SM2_MIN_EASE_FACTOR, prev.easeFactor + 0.1 - delta * (0.08 + delta * 0.02))

  return {
    intervalDays: Math.min(intervalDays, SM2_MAX_INTERVAL_DAYS),
    easeFactor: Math.round(easeFactor * 100) / 100,
    repetitions: prev.repetitions + 1,
  }
}

export const addDays = (from: Date, days: number) => new Date(from.getTime() + days * 86_400_000)
