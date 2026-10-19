-- ============ Rate limiting ============
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 1,
  primary key (key, window_start)
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- عدّاد بنافذة ثابتة: بيرجّع true لو لسه في الحد المسموح
create function public.consume_rate_limit(
  p_key text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window int := least(greatest(p_window_seconds, 1), 86400);
  v_bucket timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / v_window) * v_window);
  v_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_bucket, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;

  return v_hits <= p_max;
end;
$$;

revoke execute on function public.consume_rate_limit(text, int, int)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, int, int)
  to service_role;

-- ============ تشديد الصلاحيات ============
-- الزائر (anon) مابيكتبش في أي جدول في تطبيقنا: قراءة بس
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon;
-- المستخدم المسجّل بيكتب عن طريق سياسات الـ RLS، لكن مالوش داعي بـ TRUNCATE وغيره
-- (الـ RLS مابتغطيش TRUNCATE)
revoke truncate, references, trigger
  on all tables in schema public from authenticated;

-- دالة الـ trigger بتشتغل من غير ما أي مستخدم يقدر ينادي عليها مباشرة
revoke execute on function public.handle_new_user()
  from public, anon, authenticated;