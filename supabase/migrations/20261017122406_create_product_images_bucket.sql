-- bucket عام للقراءة. الرفع والحذف للأدمن بس (policy تحت).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Admins manage product image files"
  on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

-- نفس الملف ما ينفعش يتسجّل مرتين
alter table public.product_images
  add constraint product_images_storage_path_key unique (storage_path);