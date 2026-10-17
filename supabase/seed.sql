insert into public.categories (name, slug) values
  ('Men', 'men'),
  ('Women', 'women'),
  ('Oversized T-shirts', 'oversized'),
  ('Hoodies', 'hoodies'),
  ('Accessories', 'accessories');

insert into public.colors (name, hex) values
  ('Black', '#111111'),
  ('OffWhite', '#f5f5f0'),
  ('Charcoal', '#2b2b2b'),
  ('Grey', '#8a8a85'),
  ('DarkGrey', '#4a4a46');

insert into public.sizes (name, sort_order) values
  ('S', 1), ('M', 2), ('L', 3), ('XL', 4), ('One Size', 5);

insert into public.products (slug, name, description, base_price, category_id, is_featured)
select v.slug, v.name, 'Heavyweight cotton, designed in Cairo.', v.price, c.id, v.featured
from (values
  ('cairo-oversized-tee-black', 'Cairo Oversized Tee', 650, 'oversized', true),
  ('nile-heavy-hoodie',        'Nile Heavy Hoodie',   1450, 'hoodies',   true),
  ('zamalek-boxy-tee',         'Zamalek Boxy Tee',     590, 'men',       false),
  ('heliopolis-wide-tee',      'Heliopolis Wide Tee',  620, 'women',     false),
  ('delta-zip-hoodie',         'Delta Zip Hoodie',    1650, 'hoodies',   true),
  ('monogram-cap',             'Monogram Cap',         380, 'accessories', false)
) as v(slug, name, price, category, featured)
join public.categories c on c.slug = v.category;

insert into public.product_variants (product_id, size_id, color_id, sku, stock_quantity)
select
  p.id, s.id, c.id,
  upper(replace(p.slug || '-' || s.name || '-' || c.name, ' ', '-')),
  case when p.slug = 'heliopolis-wide-tee' then 0 else 10 end
from (values
  ('cairo-oversized-tee-black', array['S','M','L','XL'], array['Black','OffWhite']),
  ('nile-heavy-hoodie',        array['M','L','XL'],     array['Charcoal','Grey']),
  ('zamalek-boxy-tee',         array['S','M','L'],      array['OffWhite']),
  ('heliopolis-wide-tee',      array['S','M'],          array['Black']),
  ('delta-zip-hoodie',         array['S','M','L','XL'], array['Black','DarkGrey']),
  ('monogram-cap',             array['One Size'],       array['Black','OffWhite'])
) as v(slug, sizes, colors)
join public.products p on p.slug = v.slug
cross join lateral unnest(v.sizes) as sz(name)
cross join lateral unnest(v.colors) as cl(name)
join public.sizes s on s.name = sz.name
join public.colors c on c.name = cl.name;


update public.products set is_new = true
where slug in ('cairo-oversized-tee-black', 'nile-heavy-hoodie', 'delta-zip-hoodie');