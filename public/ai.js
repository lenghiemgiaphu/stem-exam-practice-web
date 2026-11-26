/* Gia sư AI — gọi qua máy chủ (POST /api/ai-explain).
 * Khóa Gemini chỉ nằm ở biến môi trường GEMINI_API_KEY của server, không còn trong file client.
 * Server cũng ghi thống kê lượt hỏi (token, chi phí, độ trễ, hỏi lại) và trả về interactionId
 * để người học đánh giá 👍/👎 câu trả lời. */
const AITutor = (() => {
  const fail = (code, message) => {
    const err = new Error(message || code);
    err.code = code;
    return err;
  };

  /**
   * @param {object} ctx      ngữ cảnh câu hỏi (cùng cấu trúc cũ)
   * @param {{role:string,text:string}[]} history
   * @param {{questionId?:string,questionType?:string,subject?:string,topicId?:string,sessionId?:string|null}} [meta]
   * @returns {Promise<{text:string, interactionId:string|null}>}
   */
  async function ask(ctx, history, meta) {
    const m = meta || {};
    const analytics = window.Analytics;
    let response;
    try {
      response = await fetch("/api/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ctx,
          history,
          userId: analytics ? analytics.getUserId() : "anon_local",
          sessionId: m.sessionId || null,
          questionId: m.questionId || null,
          questionType: m.questionType || null,
          subject: m.subject || null,
          topicId: m.topicId || null,
        }),
      });
    } catch (_) {
      throw fail("ai/network");
    }

    // Không chạy trên Next.js (ví dụ mở thẳng public/index.html) → không có API.
    if (response.status === 404 || response.status === 405) throw fail("ai/unavailable");

    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      /* xử lý bên dưới */
    }
    if (!response.ok) throw fail((data && data.code) || `ai/http-${response.status}`, data && data.error);
    if (!data || !data.answer) throw fail("ai/empty");
    return { text: String(data.answer), interactionId: data.interactionId || null };
  }

  function errorMessage(error) {
    switch (error && error.code) {
      case "ai/missing-key":
        return "Gia sư AI chưa được bật: máy chủ chưa cấu hình GEMINI_API_KEY. Vui lòng liên hệ quản trị viên.";
      case "ai/unavailable":
        return "Không tìm thấy máy chủ AI. Gia sư AI cần chạy trên Next.js (pnpm dev) hoặc bản đã triển khai.";
      case "ai/http-429":
        return "Đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau ít phút.";
      case "ai/empty":
        return "AI không trả về nội dung. Hãy thử đặt câu hỏi theo cách khác.";
      case "ai/bad-request":
        return "Yêu cầu không hợp lệ (nội dung quá dài?). Hãy thử rút gọn câu hỏi.";
      case "ai/network":
        return "Không thể kết nối tới AI. Vui lòng kiểm tra mạng và thử lại.";
      default:
        return "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.";
    }
  }

  return { ask, errorMessage };
})();
