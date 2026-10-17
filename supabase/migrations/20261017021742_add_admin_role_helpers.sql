-- دالة بترجّع true لو المستخدم الحالي أدمن. بتتحقق من جدول profiles، مش من أي حاجة جاية من المتصفح.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- الأدمن يقدر يقرأ كل البروفايلات (لصفحة العملاء بعدين)
create policy "Admins can read all profiles"
  on public.profiles for select to authenticated
  using (public.is_admin());