# Cài đặt Đợt 2 — Tạo quiz bằng AI & Đấu trực tiếp

Làm theo thứ tự. Tổng thời gian khoảng 15 phút. Phần nào chưa làm thì chỉ tính năng đó báo "chưa cấu hình",
các phần còn lại của web vẫn chạy bình thường.

## A. Nếu bạn đã chạy Đợt 1 (Supabase)

Bước **bắt buộc**: mở Supabase → SQL Editor → chạy `supabase/migrations/004_align_handover_schema.sql`
**trước khi** triển khai bản mã mới (xem chi tiết trong `docs/SUPABASE_SETUP.md`).

## B. Tạo quiz bằng AI (Vercel AI Gateway)

1. Cài gói: `pnpm install` (mọi gói cần dùng đã có trong `package.json`: `ai`, `jszip`, `zod`).
2. Chạy trên **Vercel**: Project → **AI Gateway** → bật. Không cần khóa, Vercel tự xác thực (OIDC).
   Chạy **local / host khác**: Vercel Dashboard → AI Gateway → *API Keys* → tạo khóa →
   đặt `AI_GATEWAY_API_KEY=...` trong `.env.local`.
3. Lần đầu dùng, Vercel có thể yêu cầu **gắn thẻ thanh toán** cho tài khoản (không bắt buộc nạp tiền ngay).
   Nếu thiếu, trang AI Quiz hiện "cần kích hoạt AI Gateway…" (lỗi 503 có chủ đích).
4. (Tùy chọn) `QUIZ_MODEL=google/gemini-3.8-flash` là mặc định và đã được xác minh. Model khác phải nhận được
   **PDF và video** nếu bạn muốn giữ tính năng tải PDF và link YouTube.

Thử: mở `#/ai-quiz` → tab *Dán văn bản* → dán ≥ 200 ký tự → *Tạo quiz*.

## C. Đấu trực tiếp (Upstash Redis)

1. https://console.upstash.com → **Create Database** (Redis, vùng gần người dùng, ví dụ Singapore).
2. Vào tab **REST API**, sao chép **URL** và **Token**.
   (Hoặc Vercel → Storage → *Upstash* → Create: Vercel tự thêm `KV_REST_API_URL` và `KV_REST_API_TOKEN`.)
3. Điền vào `.env.local` và vào Vercel → Settings → Environment Variables:
   `KV_REST_API_URL` + `KV_REST_API_TOKEN` (hoặc `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`).
4. **Redeploy** (biến môi trường mới chỉ có hiệu lực cho bản triển khai mới).

Thử: mở `#/live/host` → tạo phòng → mở `#/live` trên điện thoại/tab ẩn danh → nhập mã 6 số + tên.

### Lưu ý khi dùng thật
- Mỗi máy (học sinh và giáo viên) hỏi máy chủ trạng thái phòng khoảng 1,5 giây/lần khi đang chơi (2,5 giây/lần ở
  sảnh chờ; 5 giây khi tab bị ẩn). Mỗi lần hỏi tốn khoảng **4 lệnh Redis** (2 lệnh ở sảnh). Với lớp 40 học sinh + 1 giáo viên
  đó là khoảng **6.500 lệnh/phút** khi đang chơi, nên một buổi 20 phút ≈ **130.000 lệnh**. Hãy so với hạn mức
  của gói Upstash bạn dùng (xem bảng giá hiện tại trên trang Upstash) và theo dõi mức dùng trong Upstash Console
  trước khi tổ chức nhiều buổi liên tiếp.
- Quyền điều khiển phòng nằm trong **tab đã tạo phòng** (sessionStorage). Đóng tab = mất quyền điều khiển
  (phòng vẫn tự hết hạn sau 6 giờ). Nên để tab giáo viên mở suốt buổi.
- Học sinh được nhận diện theo trình duyệt: tải lại trang vẫn vào lại đúng chỗ ngồi (lưu `pid` trong localStorage).

## D. Danh sách kiểm tra sau khi triển khai

- [ ] `#/ai-quiz` tạo được quiz từ văn bản; thử thêm một tệp `.docx`.
- [ ] `#/live/host` → *Nguồn: Quiz AI* chọn được bộ quiz vừa tạo → tạo phòng ra mã 6 số.
- [ ] Học sinh (tab khác) vào bằng mã; giáo viên thấy tên xuất hiện; bấm *Bắt đầu*.
- [ ] Học sinh trả lời được **cả các câu sau câu 1**; giáo viên bấm *Câu tiếp* / *Kết thúc*.
- [ ] Trang `#/review` hiển thị "N câu đang chờ" (cần Đợt 1 + Supabase).
