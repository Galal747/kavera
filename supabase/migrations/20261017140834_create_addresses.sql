create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text not null check (phone ~ '^01[0125][0-9]{8}$'),
  governorate text not null,
  city text not null check (char_length(city) between 2 and 60),
  street text not null check (char_length(street) between 5 and 200),
  notes text check (notes is null or char_length(notes) <= 200),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);

-- القاعدة "عنوان افتراضي واحد لكل مستخدم" بتتفرض في الـ database نفسها
create unique index addresses_one_default_per_user
  on public.addresses (user_id) where is_default;

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

alter table public.addresses enable row level security;

create policy "Users manage own addresses"
  on public.addresses for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- تغيير العنوان الافتراضي في عملية واحدة (transaction).
-- security invoker: بتشتغل بصلاحيات المستخدم نفسه، فالـ RLS سارية عليها.
create function public.set_default_address(p_address_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.addresses
    where id = p_address_id and user_id = (select auth.uid())
  ) then
    raise exception 'Address not found';
  end if;

  update public.addresses
    set is_default = false
    where user_id = (select auth.uid()) and is_default;

  update public.addresses
    set is_default = true
    where id = p_address_id and user_id = (select auth.uid());
end;
$$;

revoke execute on function public.set_default_address(uuid) from public, anon;
grant execute on function public.set_default_address(uuid) to authenticated;