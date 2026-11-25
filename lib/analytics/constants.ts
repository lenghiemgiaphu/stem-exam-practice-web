/**
 * Cửa sổ "làm lại sau một thời gian" (retest): một câu hỏi được coi là `retest` khi người học
 * đã từng làm câu đó (đúng hay sai đều tính), ở một PHIÊN KHÁC, cách đây từ RETEST_MIN_DAYS đến RETEST_MAX_DAYS ngày.
 * Lần làm lại ngoài cửa sổ này (quá gần hoặc quá xa) vẫn ghi `initial` — dữ liệu thô (created_at)
 * được giữ nguyên nên có thể tính lại bằng SQL nếu sau này đổi định nghĩa.
 */
export const RETEST_MIN_DAYS = 7
export const RETEST_MAX_DAYS = 14

/** Khoảng thời gian (phút) coi một câu hỏi AI lặp lại là `is_requery`. */
export const REQUERY_WINDOW_MINUTES = 10
