# Hướng dẫn tích hợp Supabase & triển khai LabLuyen (làm từ đầu)

Tài liệu này dẫn bạn từ con số 0 đến khi **thấy dữ liệu xuất hiện trong cả 5 bảng** và **mở được trang quản trị `/admin/analytics`**. Mất khoảng 30 phút.

> Nếu bạn đã làm một phần ở các lần trước (đã tạo project, đã chạy `001`), cứ đi tiếp từ bước tương ứng: các file SQL đều **chạy lại an toàn** (idempotent).
> Tên menu của Supabase/Vercel đôi khi đổi nhẹ giữa các phiên bản; nếu không thấy đúng tên, hãy tìm mục tương đương.

## Tổng quan hệ thống

| Thành phần | Vai trò |
| :--- | :--- |
| `public/analytics.js` | Trình duyệt tự sinh mã `anon_<uuid>` (hoặc dùng Firebase `uid`), ghi nhận nguồn truy cập, gửi thống kê **không chặn** việc học (lỗi nào cũng bị nuốt). |
| `app/api/analytics/*`, `app/api/ai-explain` | Route chạy ở **server**, ghi vào Supabase bằng `SUPABASE_SERVICE_ROLE_KEY`. Trình duyệt không bao giờ nói chuyện trực tiếp với Supabase. |
| 5 bảng Supabase | `learner_profiles`, `study_sessions`, `question_attempts`, `spaced_repetition`, `ai_interactions` (bật RLS, không có quyền cho client). |
| `/admin/analytics` | Dashboard cho quản trị viên, bảo vệ bằng `ADMIN_ANALYTICS_SECRET`. |

Chưa cấu hình Supabase thì **mọi tính năng học vẫn chạy bình thường**; chỉ thiếu thống kê, trang Ôn tập và nút đánh giá AI.

---

## Bước 1 — Tạo project Supabase

1. Vào <https://supabase.com> → đăng nhập → **New project**.
2. **Name**: `labluyen` (tùy ý). **Database password**: đặt mật khẩu mạnh và lưu lại. **Region**: chọn **Southeast Asia (Singapore)** để độ trễ thấp nhất cho người dùng Việt Nam.
3. **Create new project**, đợi 1–2 phút tới khi sẵn sàng.

## Bước 2 — Chạy các file SQL migration (đúng thứ tự)

Vào **SQL Editor** (biểu tượng `>_`) → **New query**. Với **từng file** dưới đây, theo thứ tự: mở file trong thư mục `supabase/migrations/`, **sao chép toàn bộ**, dán vào ô soạn thảo, bấm **Run** (kết quả mong đợi: `Success. No rows returned`).

| Thứ tự | File | Làm gì |
| :---: | :--- | :--- |
| 1 | `001_analytics_schema.sql` | Tạo 5 bảng, chỉ mục, bật RLS. |
| 2 | `002_generalize_user_profiles.sql` | Gỡ ràng buộc `CHECK` cứng trên `cohort_tag`; mặc định `'general'`; nguồn truy cập ghi ở `referral_source`. Dữ liệu cũ được đưa về `general` (nguồn cũ giữ lại trong `referral_source`). |
| 3 | `003_admin_dashboard_indexes.sql` | Thêm chỉ mục cho trang quản trị. |
| 4 | `004_align_handover_schema.sql` | Đưa tên bảng/cột về đúng bản bàn giao Đợt 1 (xem khung bên dưới). **Cài mới: chạy cũng được, không làm gì. Đã có dữ liệu từ bản cũ: bắt buộc.** |

> `001` vẫn chứa ràng buộc `CHECK` ban đầu **có chủ đích** (file migration đã chạy thì không sửa lại); `002` gỡ nó. Cả cài mới lẫn cài cũ đều về cùng một trạng thái cuối.

> ⚠️ **Đã chạy `001`–`003` của bản CŨ (trước Đợt 1)?** Tên cũ → tên mới: `user_analytics_profiles` → `learner_profiles`, `spaced_repetition_items` → `spaced_repetition`, `study_sessions.completed_at` → `ended_at`, `study_sessions.status = 'started'` → `'active'`, `ai_interactions.helpfulness_rating` → `feedback_rating`.
> **Chỉ cần chạy `004_align_handover_schema.sql`** — nó đổi tên tại chỗ, **không mất dữ liệu** — và phải chạy **trước hoặc cùng lúc** với việc triển khai code mới (code mới đọc/ghi theo tên mới). **Đừng chạy lại `001` mới trước `004`**: nó sẽ tạo bảng trống mang tên mới bên cạnh bảng cũ còn dữ liệu (khi đó `004` sẽ dừng lại và báo lỗi rõ ràng thay vì đoán).

**Kiểm tra:** mở **Table Editor**: phải thấy đúng **5 bảng** `learner_profiles`, `study_sessions`, `question_attempts`, `spaced_repetition`, `ai_interactions`, mỗi bảng có nhãn **RLS enabled**.

## Bước 3 — Lấy `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`

1. **Project Settings** (bánh răng) → **API** (hoặc **Data API** / **API Keys**).
2. **`SUPABASE_URL`**: mục **Project URL**, dạng `https://abcdxyz.supabase.co`.
3. **`SUPABASE_SERVICE_ROLE_KEY`**: khóa `service_role` (tab **Legacy API keys**) hoặc **Secret key** (`sb_secret_…`) nếu giao diện của bạn dùng hệ khóa mới. Cả hai đều dùng được.

> ⚠️ Đây là **khóa quyền cao nhất, bỏ qua mọi RLS**. Chỉ đặt trong biến môi trường **phía server**; không dán vào `public/`, không đặt tên bắt đầu bằng `NEXT_PUBLIC_`, không gửi qua chat/ảnh chụp. Nếu lỡ lộ, tạo lại khóa ngay trong cùng trang. **Không** dùng khóa `anon`/`publishable`: các bảng đã khóa RLS nên sẽ bị từ chối.

## Bước 4 — Chạy ở máy local

1. Tạo file môi trường: `cp .env.example .env.local`
2. Mở `.env.local` và điền **cả 5 biến**:

   ```bash
   SUPABASE_URL=https://abcdxyz.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<khóa ở bước 3>
   GEMINI_API_KEY=<tạo tại https://aistudio.google.com/apikey>
   GEMINI_MODEL=gemini-2.5-flash
   ADMIN_ANALYTICS_SECRET=<chuỗi bí mật ≥ 12 ký tự, ví dụ: openssl rand -hex 32>
   ```

   > ⚠️ **Gemini đổi chỗ:** gia sư AI nay gọi qua server nên khóa Gemini phải nằm ở `GEMINI_API_KEY` trong `.env.local` (không còn đọc từ `public/config.js`). Thiếu biến này, gia sư AI báo "máy chủ chưa cấu hình GEMINI_API_KEY".
3. **Đảm bảo `.env.local` không bị commit:** chạy `git check-ignore -v .env.local`. Nếu không in ra gì, thêm dòng `.env*.local` vào `.gitignore`.
4. Cài thư viện **và cập nhật file khóa**: `pnpm install`. Hãy commit cả `package.json` lẫn `pnpm-lock.yaml` (lockfile lệch sẽ làm Vercel lỗi khi build).
5. Chạy `pnpm dev` rồi mở <http://localhost:3000>.

## Bước 5 — Test nhanh: thấy dữ liệu ở đủ 5 bảng

Mở Supabase **Table Editor** ở một tab riêng và bấm **Refresh** sau mỗi thao tác. Dùng ứng dụng như người học thật:

| # | Thao tác trên web | Kết quả cần thấy trong Supabase |
| :---: | :--- | :--- |
| 1 | Mở <http://localhost:3000> | **`learner_profiles`**: 1 dòng mới `user_id = anon_…`, `cohort_tag = general`, `referral_source = direct`. Thử thêm `?ref=facebook` ở một trình duyệt ẩn danh để thấy nguồn `facebook`. |
| 2 | **Ngân hàng câu hỏi** → chọn chuyên đề → **Bắt đầu luyện tập** | **`study_sessions`**: 1 dòng `session_type = topic_practice`, `status = active`. |
| 3 | Trả lời 3–4 câu, mỗi câu bấm **Kiểm tra** (cố tình sai 1 câu) | **`question_attempts`**: mỗi câu 1 dòng, `attempt_context = initial`, `is_first_try_in_session = true`. **`spaced_repetition`**: mỗi câu 1 dòng; câu đúng `interval_days = 1, repetitions = 1`, câu sai `interval_days = 1, repetitions = 0`; `next_review_at` ≈ ngày mai. |
| 4 | Bấm **Làm lại câu này** rồi kiểm tra lại | Thêm 1 dòng ở `question_attempts` với `is_first_try_in_session = false`; lịch ôn **không đổi** (SM-2 chỉ tính lần đầu của mỗi câu trong phiên). |
| 5 | Bấm **Kết thúc** → xác nhận | `study_sessions`: `status = completed`, `score`, `answered_questions`, `correct_count`, `ended_at`. |
| 6 | Bắt đầu một phiên luyện tập khác, trả lời vài câu rồi **đóng tab** (hoặc tải lại trang) | Dòng phiên đó chuyển `status = abandoned` kèm `drop_off_question_index` (gửi bằng `navigator.sendBeacon`). |
| 7 | Mở **Đề thi** → làm đề → **Nộp bài** | `study_sessions` có phiên `session_type = exam`, `exam_id` điền, `completed`; thêm các dòng `question_attempts` cho câu đã làm. |
| 8 | Mở một câu → **Gia sư AI** → hỏi 1 câu | **`ai_interactions`**: 1 dòng có `model_name`, `input_tokens`, `output_tokens`, `estimated_cost_usd`, `latency_ms`, `is_requery = false`. |
| 9 | Bấm 👍 (hoặc 👎) dưới câu trả lời của AI | `ai_interactions.feedback_rating` = `1` (hoặc `-1`). |
| 10 | Trong vòng 10 phút, hỏi AI **lại cùng câu hỏi đó** | Dòng mới có `is_requery = true`. |
| 11 | **Ôn tập ngắt quãng.** Câu vừa làm hẹn ngày mai nên chưa đến hạn. Để thử ngay: SQL Editor chạy `update public.spaced_repetition set next_review_at = now() - interval '1 hour';` rồi mở tab **Ôn tập** trên web | Trang hiện "N câu đang chờ ôn". Bấm **Bắt đầu ôn tập**, làm vài câu: `study_sessions` có phiên `spaced_review`; `question_attempts` có `attempt_context = spaced_review`, `was_scheduled_on_time = true`; lịch trong `spaced_repetition` được cập nhật (`last_reviewed_at`, `next_review_at` lùi xa hơn khi làm đúng). |
| 12 | **Thử `retest`** (làm lại sau 7–14 ngày): trong SQL Editor chạy `update public.question_attempts set created_at = now() - interval '10 days';` rồi làm lại một câu cũ ở **phiên luyện tập mới** | Dòng `question_attempts` mới của câu đó có `attempt_context = retest`. |

Lấy `user_id` của bạn nếu cần: mở F12 → Console → gõ `Analytics.getUserId()`. Kiểm tra API câu đến hạn: <http://localhost:3000/api/analytics/due-review?userId=anon_…>.

**Mở trang quản trị:** <http://localhost:3000/admin/analytics> → nhập `ADMIN_ANALYTICS_SECRET` → xem 4 nhóm chỉ số, thử các bộ lọc (7/30/90 ngày, tùy chọn, môn, chuyên đề, loại phiên, loại người dùng) và nút **CSV / JSON**.

> Mẹo: với ít dữ liệu, dashboard sẽ nhiều số 0 hoặc "—". Cứ làm thêm vài phiên (bước 2–10) để thấy số liệu sống động.

## Bước 6 — Triển khai lên Vercel

1. Đẩy mã (kèm `pnpm-lock.yaml`) lên Git; Vercel → import project (hoặc dùng project cũ).
2. **Settings → Environment Variables**, thêm đủ các biến sau (chọn **Production**, và **Preview** nếu muốn thử ở nhánh phụ). Với khóa bí mật nên bật **Sensitive** nếu có:

| Biến | Bắt buộc? | Ghi chú |
| :--- | :---: | :--- |
| `SUPABASE_URL` | ✅ | Project URL ở bước 3. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Khóa bí mật ở bước 3. **Không** đặt `NEXT_PUBLIC_`. |
| `GEMINI_API_KEY` | ✅ | Khóa Gemini (gia sư AI qua server). |
| `GEMINI_MODEL` | khuyến nghị | `gemini-2.5-flash` (mặc định nếu bỏ trống). |
| `ADMIN_ANALYTICS_SECRET` | ✅ | ≥ 12 ký tự, chuỗi ngẫu nhiên dài. |
| `GEMINI_PRICE_INPUT_PER_M`, `GEMINI_PRICE_OUTPUT_PER_M` | tùy chọn | Đơn giá USD/1 triệu token nếu dùng model không có trong bảng giá mặc định (ước tính chi phí). |
| `QUIZ_MODEL` | tùy chọn | Model cho tính năng tạo quiz bằng AI (có sẵn từ trước). |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (hoặc `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) | tùy chọn | Chỉ cần cho **Đấu trực tiếp** (có sẵn từ trước). |

3. **Redeploy:** biến môi trường chỉ có hiệu lực với bản deploy **mới** (Deployments → bản mới nhất → **⋯ → Redeploy**, hoặc push một commit).
4. Thử trên tên miền thật: học vài câu, kiểm tra Table Editor, rồi mở `https://<tên-miền>/admin/analytics`.

## Kiểm tra trước khi phát hành

```bash
pnpm build            # build production: phải kết thúc không lỗi
pnpm audit:security   # không khóa server nào lọt ra client; mọi API quản trị đều yêu cầu xác thực
```

> Lưu ý: dự án đang bật `typescript.ignoreBuildErrors` trong `next.config.mjs`, nên `pnpm build` **không** dừng khi có lỗi kiểu. Để thật sự bắt lỗi TypeScript, chạy thêm `pnpm exec tsc --noEmit`. Dự án chưa cài ESLint nên không có bước lint.

## Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp |
| :--- | :--- |
| API trả `{"ok":false,"disabled":true}` / không có dữ liệu | Thiếu hoặc sai `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`; chưa khởi động lại `pnpm dev` sau khi sửa `.env.local`; trên Vercel chưa Redeploy. |
| Log server có `relation ... does not exist` hoặc `column ... does not exist` | Chưa chạy file SQL (bước 2). Nếu trước đây đã chạy `001`–`003` bản cũ: chạy `004_align_handover_schema.sql`. |
| Log server có `permission denied` | Đang dùng nhầm khóa `anon`/`publishable` thay vì `service_role`/`secret`. |
| Cột `cohort_tag` báo vi phạm `check constraint` | Chưa chạy `002_generalize_user_profiles.sql`. |
| Trang Ôn tập báo "Chưa bật được tính năng này" | Supabase chưa cấu hình (xem dòng đầu), hoặc chưa có câu nào đến hạn (xem mẹo ở bước 5.11). |
| Gia sư AI báo "chưa cấu hình GEMINI_API_KEY" | Chưa đặt `GEMINI_API_KEY` ở **server** (khóa trong `public/config.js` không còn được dùng). |
| Gia sư AI chạy nhưng không có nút 👍/👎 | `interactionId` rỗng: Supabase chưa cấu hình hoặc lưu `ai_interactions` lỗi (xem log server). |
| `/admin/analytics` báo "chưa được bật" | Thiếu `ADMIN_ANALYTICS_SECRET` hoặc ngắn hơn 12 ký tự / còn giá trị mẫu. |
| Đăng nhập admin bị 429 | Nhập sai quá 8 lần/phút từ một IP; đợi 1 phút. |
| Đăng nhập admin thành công nhưng quay lại form | Cookie bị chặn. Bản chạy `next start` trên `http://` (không phải localhost) không lưu được cookie `Secure`; dùng HTTPS hoặc `pnpm dev`. |
| Dashboard cảnh báo "chỉ đọc 50.000 hàng đầu" | Dữ liệu trong khoảng đã chọn quá lớn; thu hẹp khoảng thời gian. |
| `403 Nguồn gửi yêu cầu không hợp lệ` | Request có header `Origin` khác tên miền đang chạy. Gọi từ chính trang LabLuyen hoặc bằng `curl` (không có Origin). |
| `429` ở các API thống kê | Gọi quá nhanh (giới hạn tạm thời theo instance); đợi vài chục giây. |
| Build Vercel lỗi lockfile | Chưa commit `pnpm-lock.yaml` sau `pnpm install`. |

## Quy ước dữ liệu

- **Người dùng**: `anon_<uuid>` cho khách (lưu cố định trong `localStorage`), Firebase `uid` khi đã đăng nhập. Đăng nhập tạo ra một hồ sơ **mới** (khác hồ sơ khách trước đó).
- **`referral_source`** (first-touch, chỉ ghi lần đầu): tham số `?ref=` / `?utm_source=` / `?source=`; nếu không có thì tên miền trang giới thiệu; nếu không có nữa thì `direct`. **`cohort_tag`** luôn `general` (nhãn tự do, không ràng buộc).
- **`topic_id`** = `Môn-Lớp-Chuyên đề`, ví dụ `Math-10-Hàm số`. Phiên thi có `exam_id`; phiên ôn ngắt quãng không gắn môn/chuyên đề (mỗi lượt trả lời có môn/chuyên đề riêng).
- **`is_correct`** = đúng hoàn toàn (câu Đúng/Sai nhiều ý chỉ `true` khi đúng cả các ý).
- **`attempt_context`** do server quyết định: `spaced_review` nếu phiên là ôn ngắt quãng; `retest` nếu người học đã làm câu đó ở **phiên khác** cách đây **7–14 ngày**; còn lại `initial` (đổi cửa sổ ngày ở `lib/analytics/constants.ts`).
- **`was_scheduled_on_time`**: với lần làm đầu tiên của câu đã có lịch ôn — `true` nếu lúc làm đã đến hạn, `false` nếu làm sớm hơn lịch, `null` nếu câu chưa có lịch.
- **SM-2**: chỉ cập nhật ở lần làm **đầu tiên** của mỗi câu trong phiên. Đúng → hạn 1 ngày, rồi 6 ngày, rồi `interval × ease_factor`; sai → quay về 1 ngày (`repetitions = 0`).
- **Phiên thi**: `abandoned` khi hủy bài hoặc đóng/tải lại trang; nếu sau đó làm tiếp và nộp bài, phiên chuyển lại thành `completed`. Rời trang thi bằng cách bấm sang mục khác **không** bị tính bỏ dở (bài thi có thể mở lại). `drop_off_question_index` (tính từ 0) của bài thi là câu đầu tiên chưa làm.
- **`estimated_cost_usd`** = (`promptTokenCount` × giá vào + (`candidatesTokenCount` + `thoughtsTokenCount`) × giá ra) / 1.000.000. Cột `output_tokens` chỉ lưu `candidatesTokenCount`; "thinking tokens" của Gemini 2.5 chỉ nằm trong chi phí. Bảng giá ở `lib/ai/gemini.ts` (mặc định `gemini-2.5-flash`: 0,30 / 2,50 USD mỗi 1 triệu token) — kiểm tra lại khi đổi model.
- **Dashboard**: ngày tính theo giờ Việt Nam (UTC+7). "Hoạt động" = có bắt đầu ≥ 1 phiên học. Nhóm *Tổng quan người học* chỉ áp dụng lọc thời gian và loại người dùng; nhóm *Ôn ngắt quãng* hiển thị trạng thái **hiện tại** của lịch ôn. Lọc chuyên đề chỉ khớp phiên luyện chuyên đề và lượt trả lời (phiên thi không có chuyên đề riêng).

## Hạn chế đã biết

- `user_id` do trình duyệt tự khai, server **chưa** xác minh Firebase ID token → số liệu mang tính tham khảo, không chống giả mạo.
- Giới hạn tốc độ lưu trong bộ nhớ từng instance (best-effort); cần chặt hơn thì chuyển sang Upstash.
- Tổng hợp dashboard chạy ở TypeScript và đọc tối đa 50.000 hàng cho mỗi nhóm dữ liệu; khi dữ liệu lớn hơn nhiều, nên chuyển sang hàm SQL/RPC hoặc bảng tổng hợp theo ngày.
