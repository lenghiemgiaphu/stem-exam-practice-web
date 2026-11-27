-- =============================================================================
-- LabLuyen — 002_generalize_user_profiles.sql
-- Chuẩn hóa hồ sơ người học cho TẤT CẢ người dùng.
--
-- Việc làm:
--  1) Gỡ mọi ràng buộc CHECK trên cột cohort_tag (giá trị cứng do 001 tạo ra).
--  2) Chuyển các giá trị cũ về 'general'; giữ lại thông tin nguồn cũ trong referral_source
--     (chỉ khi cột này đang trống) để không mất dữ liệu.
--  3) cohort_tag giữ mặc định 'general' và là nhãn tự do (không còn ràng buộc giá trị);
--     nguồn truy cập tự nhiên được ghi ở referral_source.
--  4) Thay chỉ mục theo cohort_tag bằng chỉ mục theo referral_source.
--
-- CÁCH CHẠY: Supabase → SQL Editor → New query → dán toàn bộ → Run (sau khi đã chạy 001).
-- Idempotent: chạy lại nhiều lần không lỗi, không mất dữ liệu.
-- =============================================================================

-- 1) Gỡ mọi CHECK trên cột cohort_tag (tìm theo catalog nên không phụ thuộc tên ràng buộc).
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel      on rel.oid = con.conrelid
    join pg_namespace ns   on ns.oid  = rel.relnamespace
    join pg_attribute att  on att.attrelid = rel.oid and att.attnum = any (con.conkey)
    where ns.nspname = 'public'
      and rel.relname = 'learner_profiles'
      and con.contype = 'c'
      and att.attname = 'cohort_tag'
  loop
    execute format('alter table public.learner_profiles drop constraint %I', c.conname);
  end loop;
end
$$;

-- 2) Đưa dữ liệu cũ về 'general', giữ lại nguồn gốc trong referral_source nếu còn trống.
update public.learner_profiles
set referral_source = coalesce(referral_source, cohort_tag),
    cohort_tag      = 'general'
where cohort_tag is distinct from 'general';

-- 3) Mặc định 'general', không cho NULL.
alter table public.learner_profiles alter column cohort_tag set default 'general';
alter table public.learner_profiles alter column cohort_tag set not null;

comment on column public.learner_profiles.cohort_tag is
  'Nhãn phân nhóm tùy chọn, mặc định general. Không còn ràng buộc giá trị.';
comment on column public.learner_profiles.referral_source is
  'Nguồn truy cập đầu tiên (first-touch): tham số ?ref= / ?utm_source=, tên miền giới thiệu, hoặc direct.';

-- 4) Chỉ mục.
drop index if exists public.idx_lp_cohort_last_seen;
create index if not exists idx_lp_referral_source on public.learner_profiles (referral_source);
create index if not exists idx_lp_auth_first_seen on public.learner_profiles (auth_provider, first_seen_at);
