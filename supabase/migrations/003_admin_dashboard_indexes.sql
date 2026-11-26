-- =============================================================================
-- LabLuyen — 003_admin_dashboard_indexes.sql
-- Chỉ mục phục vụ trang thống kê quản trị /admin/analytics (truy vấn theo khoảng thời gian).
-- CÁCH CHẠY: Supabase → SQL Editor → dán toàn bộ → Run. Idempotent.
-- =============================================================================
create index if not exists idx_ss_started                on public.study_sessions (started_at);
create index if not exists idx_sri_last_reviewed         on public.spaced_repetition_items (last_reviewed_at);
create index if not exists idx_sri_next_review           on public.spaced_repetition_items (next_review_at);
create index if not exists idx_qa_subject_created        on public.question_attempts (subject, created_at);
create index if not exists idx_ai_model_created          on public.ai_interactions (model_name, created_at);
