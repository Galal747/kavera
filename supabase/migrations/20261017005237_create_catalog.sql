-- ============ Tables ============

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hex text not null check (hex ~ '^#[0-9a-fA-F]{6}$')
);

create table public.sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  base_price numeric(10,2) not null check (base_price >= 0),
  category_id uuid not null references public.categories(id) on delete restrict,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_id uuid not null references public.sizes(id) on delete restrict,
  color_id uuid not null references public.colors(id) on delete restrict,
  sku text not null unique,
  price_override numeric(10,2) check (price_override >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  unique (product_id, size_id, color_id)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid references public.colors(id) on delete set null,
  storage_path text not null,
  position int not null default 0
);

-- ============ Indexes (على الـ foreign keys اللي بنفلتر بيها) ============

create index products_category_id_idx on public.products (category_id);
create index product_variants_product_id_idx on public.product_variants (product_id);
create index product_images_product_id_idx on public.product_images (product_id);

-- ============ Row Level Security ============

alter table public.categories enable row level security;
alter table public.colors enable row level security;
alter table public.sizes enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

-- الكتالوج العام: أي زائر يقرأ، ومحدش يكتب (مفيش policy للكتابة).

create policy "Public can read categories"
  on public.categories for select to anon, authenticated
  using (true);

create policy "Public can read colors"
  on public.colors for select to anon, authenticated
  using (true);

create policy "Public can read sizes"
  on public.sizes for select to anon, authenticated
  using (true);

create policy "Public can read active products"
  on public.products for select to anon, authenticated
  using (is_active);

create policy "Public can read variants of active products"
  on public.product_variants for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );

create policy "Public can read images of active products"
  on public.product_images for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );