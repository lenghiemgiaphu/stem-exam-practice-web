/* Đoạn văn / ngữ liệu dùng chung cho một nhóm câu hỏi (Reading Comprehension, Cloze Test, ĐGNL...).
 * Nạp sau data.js và TRƯỚC các file dữ liệu của từng môn (data-math.js, data-english.js...).
 *
 * Đoạn văn được lưu MỘT LẦN trong passageBank; mỗi câu hỏi thuộc đoạn văn chỉ cần ghi passageId:
 *
 *   passageBank.push({
 *     passageId: "p_cloze_01",
 *     kind: "reading" | "cloze",       // quyết định nhãn và lời hướng dẫn mặc định
 *     subject: "English", grade: 12,
 *     title: "Tiêu đề (tùy chọn)",
 *     instruction: "Lời hướng dẫn (tùy chọn, mặc định theo kind)",
 *     passageContent: "Đoạn 1...\n\nĐoạn 2... {{1}} ...",
 *   });
 *   mc("eng_12_12", 12, "English", "Điền từ vào đoạn văn", "Choose the best answer for blank {{n}}.", [...], "A", "...")
 *     → thêm passageId: "p_cloze_01"  (và blank: 2 nếu câu này ứng với chỗ trống {{2}}; mặc định theo thứ tự)
 *
 * Quy ước trong passageContent:
 *   - Đoạn văn cách nhau bằng một dòng trống.
 *   - {{k}} là chỗ trống thứ k của bài điền từ: giao diện tự hiện đúng số câu, ví dụ “(21) ______”.
 *   - Cho phép <u>…</u>, <b>…</b>, <i>…</i> (phải có thẻ đóng).
 * Trong questionText, {{n}} được thay bằng số câu hiển thị trong đề.
 *
 * Các câu cùng passageId trong cùng một phần của đề luôn được xếp liền nhau và hiển thị chung một khối đoạn văn.
 */
const PASSAGE_KINDS = {
  reading: {
    label: "Reading passage",
    instruction:
      "Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate the correct answer to each of the questions.",
  },
  cloze: {
    label: "Cloze test",
    instruction:
      "Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate the correct word or phrase that best fits each of the numbered blanks.",
  },
};

const passageBank = [];
