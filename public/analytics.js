/* =============================================================================
 * LabLuyen — Analytics client
 *
 * Gửi thống kê học tập tới các API route /api/analytics/* (ghi vào Supabase ở server).
 *
 * NGUYÊN TẮC: hoàn toàn "non-blocking". Mọi hàm công khai
 *   - không bao giờ ném lỗi và không bao giờ làm gián đoạn việc học;
 *   - trả về null / [] khi lỗi mạng, khi server chưa cấu hình Supabase, hoặc khi
 *     chạy mà không có Next.js (ví dụ mở thẳng public/index.html).
 * Khi server trả `{ disabled: true }` (chưa cấu hình Supabase) hoặc 404/405, module tự
 * ngừng gọi thêm trong suốt phiên truy cập hiện tại.
 *
 * Nạp SAU auth.js và TRƯỚC app.js (xem index.html).
 * ========================================================================== */
const Analytics = (() => {
  "use strict";

  const KEY = {
    anon: "labluyen_anon_id", // mã khách ẩn danh, cố định theo trình duyệt
    ref: "labluyen_ref", // nguồn truy cập đầu tiên (first-touch), giữ xuyên các phiên
  };
  const REQUEST_TIMEOUT_MS = 15000;
  const ATTEMPT_CHUNK = 200; // khớp giới hạn của POST /api/analytics/attempts

  const state = { disabled: false, identifiedSig: "" };

  /* ---------- Lưu trữ an toàn (localStorage có thể bị chặn / đầy) ---------- */
  const memory = {};
  const store = {
    get(key) {
      try {
        const value = localStorage.getItem(key);
        if (value != null) return value;
      } catch (_) {
        /* bỏ qua */
      }
      return memory[key] != null ? memory[key] : null;
    },
    set(key, value) {
      memory[key] = value;
      try {
        localStorage.setItem(key, value);
      } catch (_) {
        /* bỏ qua: vẫn dùng được bản trong bộ nhớ trong phiên này */
      }
    },
  };

  /* ---------- Định danh người dùng ---------- */
  function uuid() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    } catch (_) {
      /* thử cách khác */
    }
    const bytes = new Uint8Array(16);
    try {
      window.crypto.getRandomValues(bytes);
    } catch (_) {
      for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function anonId() {
    const saved = store.get(KEY.anon);
    if (saved && /^anon_[0-9a-f-]{36}$/i.test(saved)) return saved;
    const created = `anon_${uuid()}`;
    store.set(KEY.anon, created);
    return created;
  }

  /** Ưu tiên Firebase uid khi đã đăng nhập; nếu không dùng mã khách `anon_<uuid>`. */
  function currentUser() {
    try {
      if (typeof Auth !== "undefined" && Auth && Auth.user && Auth.user.uid) {
        return { id: String(Auth.user.uid), provider: "firebase" };
      }
    } catch (_) {
      /* rơi xuống khách ẩn danh */
    }
    return { id: anonId(), provider: "anonymous" };
  }

  /* ---------- Nguồn truy cập tự nhiên (referral_source, first-touch) ---------- */
  const cleanRef = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 64);

  function urlParamSets() {
    const sets = [];
    try {
      sets.push(new URLSearchParams(window.location.search));
    } catch (_) {
      /* bỏ qua */
    }
    try {
      // Router của app dùng hash (#/bank?x=y) nên đọc cả phần query nằm sau dấu #.
      const hash = window.location.hash || "";
      const at = hash.indexOf("?");
      if (at >= 0) sets.push(new URLSearchParams(hash.slice(at + 1)));
    } catch (_) {
      /* bỏ qua */
    }
    return sets;
  }

  /**
   * Xác định nguồn truy cập ở lần đầu người dùng ghé trang trên trình duyệt này, theo thứ tự:
   *   1) tham số ?ref= / ?utm_source= / ?source=
   *   2) tên miền của trang giới thiệu (document.referrer) nếu khác tên miền hiện tại
   *   3) "direct" (gõ thẳng địa chỉ, đánh dấu trang, ứng dụng chat không gửi referrer...)
   * Chỉ ghi một lần; các lần truy cập sau không ghi đè.
   */
  function detectReferral() {
    if (store.get(KEY.ref)) return;
    for (const params of urlParamSets()) {
      const tagged = cleanRef(params.get("ref") || params.get("utm_source") || params.get("source"));
      if (tagged) {
        store.set(KEY.ref, tagged);
        return;
      }
    }
    try {
      const referrer = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
      const own = String(window.location.hostname || "").replace(/^www\./, "");
      if (referrer && referrer !== own) {
        store.set(KEY.ref, cleanRef(referrer));
        return;
      }
    } catch (_) {
      /* bỏ qua */
    }
    store.set(KEY.ref, "direct");
  }

  /* ---------- Gửi request (không bao giờ ném lỗi) ---------- */
  async function post(path, payload, options) {
    if (state.disabled) return null;
    const opts = options || {};
    try {
      const body = JSON.stringify(payload);
      if (opts.beacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const queued = navigator.sendBeacon(path, new Blob([body], { type: "application/json" }));
        if (queued) return { ok: true, beacon: true };
      }
      const controller = typeof AbortController === "function" && !opts.beacon ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;
      try {
        const response = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: !!opts.beacon, // cho phép request hoàn tất khi trang đang đóng
          signal: controller ? controller.signal : undefined,
        });
        return await readResponse(response);
      } finally {
        if (timer) clearTimeout(timer);
      }
    } catch (_) {
      return null;
    }
  }

  async function get(path, params) {
    if (state.disabled) return null;
    try {
      const response = await fetch(`${path}?${new URLSearchParams(params).toString()}`, { method: "GET", cache: "no-store" });
      return await readResponse(response);
    } catch (_) {
      return null;
    }
  }

  async function readResponse(response) {
    // 404/405: không chạy trên Next.js (hoặc route chưa triển khai) → ngừng gọi.
    if (response.status === 404 || response.status === 405) {
      state.disabled = true;
      return null;
    }
    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      return null;
    }
    if (data && data.disabled) state.disabled = true; // chưa cấu hình Supabase ở server
    return response.ok ? data : null; // 4xx/5xx (bị giới hạn tốc độ, dữ liệu sai, lỗi server) → coi như thất bại
  }

  const int = (value) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
  };
  const num = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  };
  const text = (value) => (value == null || value === "" ? undefined : String(value));

  /* ---------- API công khai ---------- */

  /** Gọi /api/analytics/identify (tự bỏ qua nếu danh tính không đổi trong phiên truy cập này). */
  async function identify(force) {
    try {
      const user = currentUser();
      const signature = `${user.id}|${user.provider}`;
      if (!force && state.identifiedSig === signature) return null;
      state.identifiedSig = signature;
      const result = await post("/api/analytics/identify", {
        userId: user.id,
        authProvider: user.provider,
        referralSource: text(store.get(KEY.ref)),
      });
      if (!result) state.identifiedSig = ""; // lỗi mạng: cho phép thử lại ở lần kích hoạt sau
      return result;
    } catch (_) {
      return null;
    }
  }

  /**
   * Bắt đầu phiên học.
   * @param {{sessionType:'exam'|'topic_practice'|'spaced_review', subject?:string, topicId?:string, examId?:string, totalQuestions?:number}} info
   * @returns {Promise<string|null>} session_id, hoặc null nếu không ghi được (vẫn cứ học bình thường).
   */
  async function startSession(info) {
    try {
      const i = info || {};
      const user = currentUser();
      const result = await post("/api/analytics/session", {
        action: "start",
        userId: user.id,
        sessionType: i.sessionType,
        subject: text(i.subject),
        topicId: text(i.topicId),
        examId: text(i.examId),
        totalQuestions: int(i.totalQuestions) || 0,
      });
      return result && result.ok && result.sessionId ? result.sessionId : null;
    } catch (_) {
      return null;
    }
  }

  function progressPayload(stats) {
    const s = stats || {};
    return {
      totalQuestions: int(s.totalQuestions),
      answeredQuestions: int(s.answeredQuestions),
      correctCount: int(s.correctCount),
    };
  }

  /** Đánh dấu hoàn thành. stats: { answeredQuestions, correctCount, totalQuestions, score } */
  async function completeSession(sessionId, stats) {
    try {
      if (!sessionId) return null;
      unwatchSession(sessionId);
      return await post("/api/analytics/session", {
        action: "complete",
        userId: currentUser().id,
        sessionId,
        ...progressPayload(stats),
        score: num(stats && stats.score),
      });
    } catch (_) {
      return null;
    }
  }

  /**
   * Đánh dấu bỏ dở. stats: { answeredQuestions, correctCount, totalQuestions, dropOffQuestionIndex }
   * options.beacon = true → dùng navigator.sendBeacon (an toàn khi trang đang đóng).
   */
  async function abandonSession(sessionId, stats, options) {
    try {
      if (!sessionId) return null;
      unwatchSession(sessionId);
      return await post(
        "/api/analytics/session",
        {
          action: "abandon",
          userId: currentUser().id,
          sessionId,
          ...progressPayload(stats),
          dropOffQuestionIndex: int(stats && stats.dropOffQuestionIndex),
        },
        { beacon: !!(options && options.beacon) }
      );
    } catch (_) {
      return null;
    }
  }

  /**
   * Tự đánh dấu "bỏ dở" (qua sendBeacon) nếu người học đóng/tải lại trang khi phiên chưa kết thúc.
   * getStats() được gọi đúng lúc rời trang để lấy tiến độ mới nhất. Tự gỡ khi gọi
   * completeSession/abandonSession. Trả về hàm hủy theo dõi.
   */
  const watchers = new Map();
  function unwatchSession(sessionId) {
    const handler = watchers.get(sessionId);
    if (!handler) return;
    window.removeEventListener("pagehide", handler);
    watchers.delete(sessionId);
  }
  function watchSession(sessionId, getStats) {
    if (!sessionId) return () => {};
    unwatchSession(sessionId);
    const handler = () => {
      let stats = {};
      try {
        stats = (typeof getStats === "function" && getStats()) || {};
      } catch (_) {
        /* dùng số liệu rỗng */
      }
      abandonSession(sessionId, stats, { beacon: true });
    };
    watchers.set(sessionId, handler);
    window.addEventListener("pagehide", handler);
    return () => unwatchSession(sessionId);
  }

  /**
   * Lưu lượt trả lời. attempts: [{ questionId, isCorrect, subject?, topicId?, questionType? }]
   * Server tự xác định attempt_context / is_first_try_in_session và cập nhật lịch ôn SM-2.
   */
  async function recordAttempts(sessionId, attempts) {
    try {
      const list = (Array.isArray(attempts) ? attempts : [])
        .filter((a) => a && a.questionId != null && typeof a.isCorrect === "boolean")
        .map((a) => ({
          questionId: String(a.questionId),
          isCorrect: a.isCorrect,
          subject: text(a.subject),
          topicId: text(a.topicId),
          questionType: text(a.questionType),
        }));
      if (!list.length) return null;
      const userId = currentUser().id;
      let last = null;
      for (let i = 0; i < list.length; i += ATTEMPT_CHUNK) {
        last = await post("/api/analytics/attempts", {
          userId,
          sessionId: sessionId || null,
          attempts: list.slice(i, i + ATTEMPT_CHUNK),
        });
        if (!last) break;
      }
      return last;
    } catch (_) {
      return null;
    }
  }

  /**
   * Danh sách question_id đã đến hạn ôn tập ngắt quãng. Luôn trả về mảng (rỗng khi lỗi).
   * @param {{limit?:number, subject?:string}} [options]
   */
  async function getDueReview(options) {
    try {
      const o = options || {};
      const params = { userId: currentUser().id };
      if (int(o.limit)) params.limit = String(int(o.limit));
      if (text(o.subject)) params.subject = text(o.subject);
      const result = await get("/api/analytics/due-review", params);
      return result && result.ok && Array.isArray(result.questionIds) ? result.questionIds : [];
    } catch (_) {
      return [];
    }
  }

  /** Gửi 👍 (1) / 👎 (-1) cho một lượt hỏi AI (interactionId do /api/ai-explain trả về). */
  async function sendAiFeedback(interactionId, rating) {
    try {
      if (!interactionId || (rating !== 1 && rating !== -1)) return null;
      return await post("/api/analytics/ai-feedback", { interactionId, userId: currentUser().id, rating });
    } catch (_) {
      return null;
    }
  }

  /* ---------- Khởi động ---------- */
  function init() {
    try {
      detectReferral();
      if (typeof Auth !== "undefined" && Auth && typeof Auth.onChange === "function") {
        // Auth phát sự kiện khi Firebase xác định xong trạng thái đăng nhập (hoặc ngay lập tức
        // ở chế độ khách khi chưa cấu hình Firebase). Nhờ vậy hồ sơ luôn gắn đúng uid/anon.
        Auth.onChange(() => {
          identify();
        });
      } else {
        identify();
      }
    } catch (_) {
      /* analytics không bao giờ được làm hỏng trang */
    }
  }
  init();

  return {
    getUserId: () => currentUser().id,
    getAuthProvider: () => currentUser().provider,
    getReferralSource: () => store.get(KEY.ref) || "direct",
    isEnabled: () => !state.disabled,
    identify,
    startSession,
    completeSession,
    abandonSession,
    watchSession,
    recordAttempts,
    getDueReview,
    sendAiFeedback,
  };
})();

window.Analytics = Analytics;
