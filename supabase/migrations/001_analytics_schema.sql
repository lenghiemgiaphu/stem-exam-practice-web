-- =============================================================================
-- LabLuyen — Lược đồ thống kê học tập (Đợt 1)
-- 001_analytics_schema.sql
--
-- Tên bảng/cột bám theo bản bàn giao Đợt 1: learner_profiles, study_sessions, question_attempts,
-- spaced_repetition, ai_interactions; study_sessions.status = active|completed|abandoned,
-- study_sessions.ended_at, ai_interactions.feedback_rating.
-- Đã lỡ chạy bản 001 CŨ (user_analytics_profiles / spaced_repetition_items / 'started' /
-- completed_at / helpfulness_rating)? Chạy 004_align_handover_schema.sql TRƯỚC — nó đổi tên tại chỗ, không mất dữ liệu.
--
-- CÁCH CHẠY: Supabase Dashboard → SQL Editor → New query → dán toàn bộ file → Run.
-- File an toàn khi chạy lại nhiều lần (idempotent): không báo lỗi, không mất dữ liệu.
--
-- Ghi chú thiết kế
--  * user_id là `text` để chứa cả Firebase `uid` lẫn mã khách ẩn danh `anon_<uuid>`.
--  * Không đặt khóa ngoại tới bảng hồ sơ để việc ghi thống kê không bao giờ bị chặn
--    chỉ vì thứ tự request (identify chưa kịp chạy). Khóa ngoại duy nhất:
--    question_attempts.session_id -> study_sessions.id.
--  * Toàn bộ ghi/đọc đi qua server bằng Service Role Key (bỏ qua RLS). Client ẩn danh
--    KHÔNG có quyền gì trên các bảng này (RLS bật + không có policy + thu hồi quyền anon).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) learner_profiles — hồ sơ người học
-- -----------------------------------------------------------------------------
create table if not exists public.learner_profiles (
  user_id          text primary key,
  cohort_tag       text not null default 'general'
                     constraint learner_profiles_cohort_tag_check
                     check (cohort_tag in ('nang_cao_nguyen', 'general')),
  auth_provider    text not null default 'anonymous'
                     constraint learner_profiles_auth_provider_check
                     check (auth_provider in ('firebase', 'anonymous')),
  referral_source  text,
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now()
);

comment on table  public.learner_profiles is 'Hồ sơ thống kê của người học (Firebase uid hoặc anon_<uuid>).';
comment on column public.learner_profiles.cohort_tag is 'nang_cao_nguyen = đến từ kênh Nâng Cao Nguyên (?cohort=ncn / ?ref=nangcaonguyen); general = còn lại.';

create index if not exists idx_lp_cohort_last_seen on public.learner_profiles (cohort_tag, last_seen_at desc);
create index if not exists idx_lp_first_seen       on public.learner_profiles (first_seen_at);


-- -----------------------------------------------------------------------------
-- 2) study_sessions — một lượt học (làm đề / luyện chuyên đề / ôn ngắt quãng)
-- -----------------------------------------------------------------------------
create table if not exists public.study_sessions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 text not null,
  subject                 text,
  topic_id                text,
  exam_id                 text,
  session_type            text not null
                            constraint study_sessions_session_type_check
                            check (session_type in ('exam', 'topic_practice', 'spaced_review')),
  status                  text not null default 'active'
                            constraint study_sessions_status_check
                            check (status in ('active', 'completed', 'abandoned')),
  total_questions         integer not null default 0 check (total_questions >= 0),
  answered_questions      integer not null default 0 check (answered_questions >= 0),
  correct_count           integer not null default 0 check (correct_count >= 0),
  score                   numeric(5, 2) check (score is null or (score >= 0 and score <= 100)),
  drop_off_question_index integer check (drop_off_question_index is null or drop_off_question_index >= 0),
  started_at              timestamptz not null default now(),
  ended_at                timestamptz
);

comment on column public.study_sessions.status is 'active = đang học; completed = đã nộp/kết thúc; abandoned = bỏ dở (đóng tab, thoát giữa chừng).';
comment on column public.study_sessions.ended_at is 'Thời điểm phiên kết thúc (hoàn thành hoặc bỏ dở); NULL khi còn active.';
comment on column public.study_sessions.score is 'Điểm thang 10 của ứng dụng (cho phép tới 100 để chứa thang %).';
comment on column public.study_sessions.drop_off_question_index is 'Chỉ số câu hỏi (bắt đầu từ 0) người học đang xem khi bỏ dở phiên.';

create index if not exists idx_ss_user_started   on public.study_sessions (user_id, started_at desc);
create index if not exists idx_ss_type_started   on public.study_sessions (session_type, started_at desc);
create index if not exists idx_ss_status_started on public.study_sessions (status, started_at desc);
create index if not exists idx_ss_exam           on public.study_sessions (exam_id) where exam_id is not null;
create index if not exists idx_ss_subject_topic  on public.study_sessions (subject, topic_id);


-- -----------------------------------------------------------------------------
-- 3) question_attempts — từng lượt trả lời một câu hỏi
-- -----------------------------------------------------------------------------
create table if not exists public.question_attempts (
  id                      uuid primary key default gen_random_uuid(),
  session_id              uuid references public.study_sessions (id) on delete cascade,
  user_id                 text not null,
  question_id             text not null,
  subject                 text,
  topic_id                text,
  question_type           text,
  attempt_context         text not null default 'initial'
                            constraint question_attempts_attempt_context_check
                            check (attempt_context in ('initial', 'retest', 'spaced_review')),
  is_correct              boolean not null,
  is_first_try_in_session boolean not null default true,
  was_scheduled_on_time   boolean,
  created_at              timestamptz not null default now()
);

comment on column public.question_attempts.attempt_context is 'initial = lần đầu/làm thường; retest = làm lại câu cũ (phiên khác) sau 7–14 ngày; spaced_review = trong phiên ôn ngắt quãng.';
comment on column public.question_attempts.was_scheduled_on_time is 'Chỉ với lần làm đầu tiên của câu đã có lịch ôn: true = đã đến hạn (next_review_at <= now), false = làm sớm hơn lịch, null = chưa có lịch.';

create index if not exists idx_qa_user_question_created on public.question_attempts (user_id, question_id, created_at desc);
create index if not exists idx_qa_session               on public.question_attempts (session_id);
create index if not exists idx_qa_created               on public.question_attempts (created_at);
create index if not exists idx_qa_context_created       on public.question_attempts (attempt_context, created_at desc);
create index if not exists idx_qa_subject_topic         on public.question_attempts (subject, topic_id);


-- -----------------------------------------------------------------------------
-- 4) spaced_repetition — lịch ôn ngắt quãng (SM-2) cho từng (user, câu hỏi)
-- -----------------------------------------------------------------------------
create table if not exists public.spaced_repetition (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null,
  question_id      text not null,
  subject          text,
  topic_id         text,
  interval_days    integer not null default 0 check (interval_days >= 0),
  ease_factor      numeric(4, 2) not null default 2.50 check (ease_factor >= 1.30),
  repetitions      integer not null default 0 check (repetitions >= 0),
  next_review_at   timestamptz not null default now(),
  last_reviewed_at timestamptz,
  constraint spaced_repetition_user_question_key unique (user_id, question_id)
);

create index if not exists idx_sr_user_next_review on public.spaced_repetition (user_id, next_review_at);
create index if not exists idx_sr_user_topic       on public.spaced_repetition (user_id, topic_id);


-- -----------------------------------------------------------------------------
-- 5) ai_interactions — mỗi lượt hỏi gia sư AI
-- -----------------------------------------------------------------------------
create table if not exists public.ai_interactions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text not null,
  session_id          uuid,
  question_id         text,
  subject             text,
  topic_id            text,
  question_type       text,
  model_name          text,
  input_tokens        integer not null default 0 check (input_tokens >= 0),
  output_tokens       integer not null default 0 check (output_tokens >= 0),
  estimated_cost_usd  numeric(12, 6) not null default 0 check (estimated_cost_usd >= 0),
  feedback_rating     smallint
                        constraint ai_interactions_feedback_rating_check
                        check (feedback_rating in (1, -1)),
  is_requery          boolean not null default false,
  latency_ms          integer check (latency_ms is null or latency_ms >= 0),
  created_at          timestamptz not null default now()
);

comment on column public.ai_interactions.feedback_rating is '1 = 👍 hữu ích, -1 = 👎 chưa hữu ích, NULL = chưa đánh giá (ghi bởi POST /api/analytics/ai-feedback).';
comment on column public.ai_interactions.output_tokens is 'candidatesTokenCount của Gemini (chưa gồm thinking tokens; chi phí ước tính đã tính cả thinking tokens).';
comment on column public.ai_interactions.is_requery is 'true nếu trong 10 phút trước đó cùng user đã hỏi AI về cùng question_id.';

create index if not exists idx_ai_user_question_created on public.ai_interactions (user_id, question_id, created_at desc);
create index if not exists idx_ai_created               on public.ai_interactions (created_at);
create index if not exists idx_ai_session               on public.ai_interactions (session_id) where session_id is not null;
create index if not exists idx_ai_subject_topic         on public.ai_interactions (subject, topic_id);


-- -----------------------------------------------------------------------------
-- Row Level Security
-- Bật RLS và KHÔNG tạo policy nào → vai trò anon/authenticated bị từ chối hoàn toàn.
-- Service Role Key (chỉ dùng ở server) bỏ qua RLS nên vẫn đọc/ghi bình thường.
-- Thu hồi thêm quyền bảng của anon/authenticated như một lớp bảo vệ thứ hai.
-- -----------------------------------------------------------------------------
alter table public.learner_profiles enable row level security;
alter table public.study_sessions          enable row level security;
alter table public.question_attempts       enable row level security;
alter table public.spaced_repetition enable row level security;
alter table public.ai_interactions         enable row level security;

revoke all on table
  public.learner_profiles,
  public.study_sessions,
  public.question_attempts,
  public.spaced_repetition,
  public.ai_interactions
from anon, authenticated;
