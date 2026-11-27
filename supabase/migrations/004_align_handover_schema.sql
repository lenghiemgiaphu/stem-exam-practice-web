-- =============================================================================
-- LabLuyen — 004_align_handover_schema.sql
-- Đưa lược đồ về ĐÚNG tên trong bản bàn giao Đợt 1 — đổi tên TẠI CHỖ, không mất dữ liệu.
--
--   Tên cũ (001 bản đầu)                      →  Tên mới (bản bàn giao)
--   -------------------------------------------------------------------------
--   bảng  user_analytics_profiles             →  learner_profiles
--   bảng  spaced_repetition_items             →  spaced_repetition
--   cột   study_sessions.completed_at         →  study_sessions.ended_at
--   giá trị study_sessions.status = 'started' →  'active'
--   cột   ai_interactions.helpfulness_rating  →  ai_interactions.feedback_rating
--   (kèm đổi tên ràng buộc & chỉ mục idx_uap_* → idx_lp_*, idx_sri_* → idx_sr_*)
--
-- AI NÊN CHẠY FILE NÀY?
--   • Đã từng chạy 001/002/003 BẢN CŨ (dữ liệu nằm ở tên cũ)  → CHẠY 004 NGAY, TRƯỚC KHI triển khai
--     code mới (code mới đọc/ghi theo tên mới). Đây là bước bắt buộc.
--   • Cài mới, đã chạy 001→003 BẢN MỚI (đã ở tên mới)          → chạy cũng được: không làm gì cả.
--   • Chưa chạy 001                                            → chạy 001, 002, 003 trước.
--
-- CÁCH CHẠY: Supabase → SQL Editor → New query → dán toàn bộ → Run.
-- Idempotent: chạy lại nhiều lần không lỗi, không mất dữ liệu.
-- An toàn: nếu thấy CẢ tên cũ LẪN tên mới cùng tồn tại (ví dụ lỡ chạy 001 mới khi bảng cũ còn dữ liệu),
-- file dừng lại với thông báo rõ ràng thay vì đoán — hãy chuyển/gộp dữ liệu thủ công rồi chạy lại.
-- =============================================================================

do $$
declare
  c record;
begin
  if to_regclass('public.study_sessions') is null then
    raise exception 'Chưa có bảng study_sessions: hãy chạy 001_analytics_schema.sql (rồi 002, 003) trước khi chạy 004.';
  end if;

  -- ---- 1) Đổi tên bảng ------------------------------------------------------
  if to_regclass('public.user_analytics_profiles') is not null then
    if to_regclass('public.learner_profiles') is not null then
      raise exception 'Cả user_analytics_profiles và learner_profiles cùng tồn tại. Hãy gộp dữ liệu thủ công (giữ bảng có dữ liệu thật), xóa bảng còn lại rồi chạy lại 004.';
    end if;
    alter table public.user_analytics_profiles rename to learner_profiles;
  end if;

  if to_regclass('public.spaced_repetition_items') is not null then
    if to_regclass('public.spaced_repetition') is not null then
      raise exception 'Cả spaced_repetition_items và spaced_repetition cùng tồn tại. Hãy gộp dữ liệu thủ công (giữ bảng có dữ liệu thật), xóa bảng còn lại rồi chạy lại 004.';
    end if;
    alter table public.spaced_repetition_items rename to spaced_repetition;
  end if;

  -- ---- 2) Đổi tên cột -------------------------------------------------------
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'study_sessions' and column_name = 'completed_at')
     and not exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'study_sessions' and column_name = 'ended_at') then
    alter table public.study_sessions rename column completed_at to ended_at;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'ai_interactions' and column_name = 'helpfulness_rating')
     and not exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'ai_interactions' and column_name = 'feedback_rating') then
    alter table public.ai_interactions rename column helpfulness_rating to feedback_rating;
  end if;

  -- ---- 3) Đổi tên ràng buộc (đổi tên PK/UNIQUE cũng đổi luôn chỉ mục đi kèm) -------
  for c in
    select * from (values
      ('learner_profiles',   'user_analytics_profiles_pkey',                 'learner_profiles_pkey'),
      ('learner_profiles',   'user_analytics_profiles_auth_provider_check',  'learner_profiles_auth_provider_check'),
      ('learner_profiles',   'user_analytics_profiles_cohort_tag_check',     'learner_profiles_cohort_tag_check'),
      ('spaced_repetition',  'spaced_repetition_items_pkey',                 'spaced_repetition_pkey'),
      ('spaced_repetition',  'spaced_repetition_items_user_question_key',    'spaced_repetition_user_question_key'),
      ('ai_interactions',    'ai_interactions_helpfulness_rating_check',     'ai_interactions_feedback_rating_check')
    ) as t (tbl, old_name, new_name)
  loop
    if exists (select 1 from pg_constraint where conrelid = to_regclass('public.' || c.tbl) and conname = c.old_name)
       and not exists (select 1 from pg_constraint where conrelid = to_regclass('public.' || c.tbl) and conname = c.new_name) then
      execute format('alter table public.%I rename constraint %I to %I', c.tbl, c.old_name, c.new_name);
    end if;
  end loop;

  -- ---- 4) Đổi tên chỉ mục thường -------------------------------------------------
  for c in
    select * from (values
      ('idx_uap_cohort_last_seen',  'idx_lp_cohort_last_seen'),   -- 002 sẽ xóa chỉ mục này nếu còn
      ('idx_uap_first_seen',        'idx_lp_first_seen'),
      ('idx_uap_referral_source',   'idx_lp_referral_source'),
      ('idx_uap_auth_first_seen',   'idx_lp_auth_first_seen'),
      ('idx_sri_user_next_review',  'idx_sr_user_next_review'),
      ('idx_sri_user_topic',        'idx_sr_user_topic'),
      ('idx_sri_last_reviewed',     'idx_sr_last_reviewed'),
      ('idx_sri_next_review',       'idx_sr_next_review')
    ) as t (old_name, new_name)
  loop
    if to_regclass('public.' || c.old_name) is not null and to_regclass('public.' || c.new_name) is null then
      execute format('alter index public.%I rename to %I', c.old_name, c.new_name);
    end if;
  end loop;
end
$$;

-- ---- 5) study_sessions.status: 'started' → 'active' --------------------------------
-- Gỡ ràng buộc cũ TRƯỚC (nó không cho phép 'active'), cập nhật dữ liệu, rồi tạo lại ràng buộc mới.
alter table public.study_sessions drop constraint if exists study_sessions_status_check;
update public.study_sessions set status = 'active' where status = 'started';
alter table public.study_sessions alter column status set default 'active';
alter table public.study_sessions
  add constraint study_sessions_status_check check (status in ('active', 'completed', 'abandoned'));

-- ---- 6) Chú thích & bảo mật (an toàn khi lặp lại) ----------------------------------
comment on column public.study_sessions.status is
  'active = đang học; completed = đã nộp/kết thúc; abandoned = bỏ dở (đóng tab, thoát giữa chừng).';
comment on column public.study_sessions.ended_at is
  'Thời điểm phiên kết thúc (hoàn thành hoặc bỏ dở); NULL khi còn active.';
comment on column public.ai_interactions.feedback_rating is
  '1 = 👍 hữu ích, -1 = 👎 chưa hữu ích, NULL = chưa đánh giá (ghi bởi POST /api/analytics/ai-feedback).';

alter table public.learner_profiles  enable row level security;
alter table public.study_sessions    enable row level security;
alter table public.question_attempts enable row level security;
alter table public.spaced_repetition enable row level security;
alter table public.ai_interactions   enable row level security;

revoke all on table
  public.learner_profiles,
  public.study_sessions,
  public.question_attempts,
  public.spaced_repetition,
  public.ai_interactions
from anon, authenticated;

-- Báo cho PostgREST (API của Supabase) nạp lại lược đồ để nhận tên bảng/cột mới ngay.
notify pgrst, 'reload schema';

-- Kết quả mong đợi: đúng 5 dòng.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('learner_profiles', 'study_sessions', 'question_attempts', 'spaced_repetition', 'ai_interactions')
order by table_name;
