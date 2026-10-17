create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index wishlist_items_product_id_idx on public.wishlist_items (product_id);

alter table public.wishlist_items enable row level security;

-- كل مستخدم يشوف ويعدّل مفضلته هو بس
create policy "Users manage own wishlist"
  on public.wishlist_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);