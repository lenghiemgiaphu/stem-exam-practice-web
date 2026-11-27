/**
 * Hằng số dùng chung cho thống kê học tập & ôn tập ngắt quãng.
 * Không import gì từ nơi khác để cả route (server) lẫn test đơn vị đều dùng được.
 */

/* ---------------------------------------------------------------------------
 * Gia sư AI
 * ------------------------------------------------------------------------- */

/** Khoảng thời gian (phút) coi một câu hỏi AI lặp lại về cùng question_id là `is_requery`. */
export const REQUERY_WINDOW_MINUTES = 10

/* ---------------------------------------------------------------------------
 * Phân loại lượt làm lại (attempt_context = 'retest')
 * ------------------------------------------------------------------------- */

/**
 * Một câu hỏi được coi là `retest` khi người học đã từng làm câu đó (đúng hay sai đều tính),
 * ở một PHIÊN KHÁC, cách đây từ RETEST_MIN_DAYS đến RETEST_MAX_DAYS ngày.
 * Lần làm lại ngoài cửa sổ này (quá gần hoặc quá xa) vẫn ghi `initial` — dữ liệu thô (created_at)
 * được giữ nguyên nên có thể tính lại bằng SQL nếu sau này đổi định nghĩa.
 */
export const RETEST_MIN_DAYS = 7
export const RETEST_MAX_DAYS = 14

/* ---------------------------------------------------------------------------
 * SM-2 (SuperMemo-2) — ôn tập ngắt quãng
 *
 * Ứng dụng chỉ biết đúng/sai nên chỉ dùng 2 mức quality (thang gốc là 0–5):
 *   đúng = 4, sai = 1.   quality < 3  → học lại từ đầu.
 * ------------------------------------------------------------------------- */

/** ease_factor mặc định của một câu hỏi mới (cũng là DEFAULT của cột ease_factor trong DB). */
export const SM2_INITIAL_EASE_FACTOR = 2.5
/** ease_factor không bao giờ thấp hơn mức này (theo SM-2 gốc). */
export const SM2_MIN_EASE_FACTOR = 1.3
/** Khoảng cách sau lần đúng thứ 1: 1 ngày. Sai (quality < 3) cũng quay về 1 ngày. */
export const SM2_FIRST_INTERVAL_DAYS = 1
/** Khoảng cách sau lần đúng thứ 2: 6 ngày. Từ lần thứ 3: round(interval × ease_factor). */
export const SM2_SECOND_INTERVAL_DAYS = 6
/** Trần khoảng cách ôn tập, tránh hẹn lịch quá xa. */
export const SM2_MAX_INTERVAL_DAYS = 365
/** Ngưỡng quality: nhỏ hơn mức này là "quên" → reset repetitions. */
export const SM2_PASS_QUALITY = 3
export const SM2_QUALITY_CORRECT = 4
export const SM2_QUALITY_WRONG = 1
