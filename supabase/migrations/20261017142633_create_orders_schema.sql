-- ============ إعدادات المتجر ============

create table public.store_settings (
  id boolean primary key default true check (id), -- صف واحد بس
  free_shipping_threshold numeric(10,2) not null default 1500
    check (free_shipping_threshold >= 0)
);
insert into public.store_settings (id) values (true);

create table public.shipping_rates (
  governorate text primary key,
  fee numeric(10,2) not null check (fee >= 0)
);

-- أرقام تقريبية للتجربة. غيّرها بما يناسب شركة الشحن بتاعتك.
insert into public.shipping_rates (governorate, fee) values
  ('Cairo', 50), ('Giza', 50), ('Alexandria', 60), ('Qalyubia', 60),
  ('Dakahlia', 70), ('Beheira', 70), ('Gharbia', 70), ('Ismailia', 70),
  ('Menofia', 70), ('Suez', 70), ('Port Said', 70), ('Damietta', 70),
  ('Sharqia', 70), ('Kafr El Sheikh', 70), ('Fayoum', 80), ('Beni Suef', 85),
  ('Minya', 90), ('Assiut', 95), ('Sohag', 100), ('Qena', 100),
  ('Luxor', 105), ('Aswan', 110), ('Red Sea', 120), ('Matrouh', 120),
  ('New Valley', 130), ('South Sinai', 130), ('North Sinai', 130);

-- ============ الكوبونات ============

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,30}$'),
  type text not null check (type in ('percent', 'fixed')),
  value numeric(10,2) not null check (value > 0),
  min_order numeric(10,2) not null default 0 check (min_order >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit int check (usage_limit is null or usage_limit > 0),
  used_count int not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (type <> 'percent' or value <= 100)
);

-- ============ الطلبات ============

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity (start with 1001) unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  idempotency_key uuid not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_method text not null check (payment_method in ('cod', 'card')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'failed', 'refunded')),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  discount numeric(10,2) not null default 0 check (discount >= 0),
  shipping_fee numeric(10,2) not null check (shipping_fee >= 0),
  total numeric(10,2) not null check (total >= 0),
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  shipping_address jsonb not null, -- نسخة من العنوان وقت الشراء
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index orders_coupon_id_idx on public.orders (coupon_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  -- restrict: منتج اتباع منه مش هيتمسح، بنخفيه بس
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  product_name text not null,
  sku text not null,
  size_name text not null,
  color_name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null check (line_total >= 0)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_variant_id_idx on public.order_items (variant_id);

-- ============ المدفوعات ============

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null check (provider in ('cod', 'paymob')),
  provider_ref text,
  amount numeric(10,2) not null check (amount >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'cancelled')),
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index payments_order_id_idx on public.payments (order_id);

-- ============ Row Level Security ============

alter table public.store_settings enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- إعدادات الشحن: الكل يقرأ، الأدمن يعدّل
create policy "Public can read store settings"
  on public.store_settings for select to anon, authenticated using (true);
create policy "Admins manage store settings"
  on public.store_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public can read shipping rates"
  on public.shipping_rates for select to anon, authenticated using (true);
create policy "Admins manage shipping rates"
  on public.shipping_rates for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- الكوبونات: الأدمن بس. مفيش قراءة عامة، عشان محدش يعدّد الأكواد ويجرّبها.
-- التحقق من الكود بيحصل جوه function بتقرأه بدالنا.
create policy "Admins manage coupons"
  on public.coupons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- الطلبات: المستخدم يقرأ طلباته هو، والأدمن يقرأ الكل. محدش يكتب مباشرة.
create policy "Users read own orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Admins read all orders"
  on public.orders for select to authenticated
  using ((select public.is_admin()));

create policy "Users read own order items"
  on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = (select auth.uid())
  ));
create policy "Admins read all order items"
  on public.order_items for select to authenticated
  using ((select public.is_admin()));

create policy "Users read own payments"
  on public.payments for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = (select auth.uid())
  ));
create policy "Admins read all payments"
  on public.payments for select to authenticated
  using ((select public.is_admin()));

-- خط دفاع إضافي: نسحب صلاحيات الكتابة من الجداول دي.
-- (الكتابة بتحصل من functions بصلاحيات أعلى، ومن الأدمن في مرحلة تانية)
revoke insert, update, delete on public.orders from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
revoke insert, update, delete on public.payments from anon, authenticated;