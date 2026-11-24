/* Hiển thị công thức toán bằng KaTeX.
 *
 * Viết công thức trong dữ liệu / lời AI bằng:
 *   $...$   hoặc  \( ... \)   công thức trên cùng dòng (inline)
 *   $$...$$ hoặc  \[ ... \]   công thức riêng một dòng (block)
 *
 * File này tự quét trang lúc nạp và theo dõi mọi nội dung mới được vẽ vào trang
 * (đề thi, ngân hàng câu hỏi, xem lại bài, khung Gia sư AI, đấu trực tiếp...),
 * nên không cần gọi hàm render ở từng màn hình. Nếu KaTeX không tải được (mất mạng),
 * công thức vẫn hiện dưới dạng mã LaTeX thô, các chức năng khác không bị ảnh hưởng.
 */
(() => {
  const OPTIONS = {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false },
      { left: "$", right: "$", display: false },
    ],
    throwOnError: false, // công thức lỗi hiện mã thô màu đỏ thay vì làm hỏng cả trang
    strict: "ignore", // cho phép chữ tiếng Việt trong \text{...}
    errorColor: "#be123c",
    ignoredClasses: ["no-math"], // thêm class này để một vùng luôn hiển thị nguyên văn
    macros: {
      "\\R": "\\mathbb{R}",
      "\\N": "\\mathbb{N}",
      "\\Z": "\\mathbb{Z}",
      "\\Q": "\\mathbb{Q}",
    },
  };

  const ready = () => typeof window.renderMathInElement === "function";
  const hasMath = (s) => s.includes("$") || s.includes("\\(") || s.includes("\\[");

  let observer = null;
  const pending = new Set();
  let scheduled = false;

  function typeset(root) {
    if (!ready() || !root || !root.isConnected) return;
    try {
      window.renderMathInElement(root, OPTIONS);
    } catch (error) {
      console.warn("KaTeX:", error);
    }
  }

  function observe() {
    if (observer) observer.observe(document.body, { childList: true, subtree: true });
  }

  function flush() {
    scheduled = false;
    if (!ready()) return pending.clear();
    const roots = [...pending].filter((el) => el.isConnected);
    pending.clear();
    // Ngắt theo dõi trong lúc render để các thay đổi do KaTeX tạo ra không kích hoạt lại vòng lặp.
    observer.disconnect();
    roots.filter((el) => !roots.some((other) => other !== el && other.contains(el))).forEach(typeset);
    observer.takeRecords();
    observe();
  }

  function queue(node) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el || el.closest(".katex, .katex-display, .no-math")) return;
    const text = node.nodeType === 1 ? node.textContent : node.data;
    if (!text || !hasMath(text)) return; // bỏ qua nhanh phần lớn thay đổi (đồng hồ, nút bấm...)
    pending.add(el);
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  }

  function start() {
    observer = new MutationObserver((records) => {
      for (const record of records) record.addedNodes.forEach(queue);
    });
    observe();
    typeset(document.body);
  }

  window.LabMath = { typeset, ready };

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
