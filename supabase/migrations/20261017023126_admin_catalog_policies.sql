-- بيحدّث updated_at لوحده كل ما المنتج يتعدّل
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- الأدمن: قراءة وكتابة كاملة على جداول الكتالوج.
-- (policy "for all" بتشمل القراءة، فالأدمن يشوف المنتجات غير النشطة كمان)
create policy "Admins manage categories"
  on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage colors"
  on public.colors for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage sizes"
  on public.sizes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage products"
  on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage variants"
  on public.product_variants for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage product images"
  on public.product_images for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));