-- ============================================================
-- quote_order: مكان واحد بس لحساب السعر. بتتحقق وبتحسب ومبتكتبش حاجة.
-- مش متاحة للمتصفح مباشرة، بتتنادى من الـ functions اللي تحت.
-- ============================================================
create function public.quote_order(
  p_user_id uuid,
  p_governorate text,
  p_coupon_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subtotal numeric(10,2);
  v_count int;
  v_fee numeric(10,2);
  v_threshold numeric(10,2);
  v_coupon public.coupons%rowtype;
  v_code text := upper(trim(coalesce(p_coupon_code, '')));
  v_discount numeric(10,2) := 0;
  v_coupon_id uuid;
  v_coupon_code text;
begin
  -- الأسعار من الـ DB (سعر الـ variant لو موجود، وإلا سعر المنتج). مش من المتصفح.
  select
    count(*),
    coalesce(sum(coalesce(pv.price_override, p.base_price) * ci.quantity), 0)
  into v_count, v_subtotal
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  join public.products p on p.id = pv.product_id
  where ci.user_id = p_user_id;

  if v_count = 0 then
    raise exception 'cart_empty';
  end if;

  -- منتج اتخفى أو مخزون مش كفاية
  if exists (
    select 1
    from public.cart_items ci
    join public.product_variants pv on pv.id = ci.variant_id
    join public.products p on p.id = pv.product_id
    where ci.user_id = p_user_id
      and (not p.is_active or pv.stock_quantity < ci.quantity)
  ) then
    raise exception 'items_unavailable';
  end if;

  select fee into v_fee
  from public.shipping_rates
  where governorate = p_governorate;
  if v_fee is null then
    raise exception 'shipping_unavailable';
  end if;

  if v_code <> '' then
    select * into v_coupon
    from public.coupons c
    where c.code = v_code and c.is_active;
    if not found then
      raise exception 'coupon_invalid';
    end if;

    if (v_coupon.starts_at is not null and v_coupon.starts_at > now())
       or (v_coupon.expires_at is not null and v_coupon.expires_at <= now()) then
      raise exception 'coupon_expired';
    end if;

    if v_coupon.usage_limit is not null
       and v_coupon.used_count >= v_coupon.usage_limit then
      raise exception 'coupon_exhausted';
    end if;

    if v_subtotal < v_coupon.min_order then
      raise exception 'coupon_min_order';
    end if;

    if v_coupon.type = 'percent' then
      v_discount := round(v_subtotal * v_coupon.value / 100, 2);
    else
      v_discount := least(v_coupon.value, v_subtotal);
    end if;

    v_coupon_id := v_coupon.id;
    v_coupon_code := v_coupon.code;
  end if;

  -- شحن مجاني لو الإجمالي بعد الخصم وصل للحد
  select free_shipping_threshold into v_threshold
  from public.store_settings
  where id;
  if v_subtotal - v_discount >= v_threshold then
    v_fee := 0;
  end if;

  return jsonb_build_object(
    'subtotal', v_subtotal,
    'discount', v_discount,
    'shipping_fee', v_fee,
    'total', v_subtotal - v_discount + v_fee,
    'coupon_id', v_coupon_id,
    'coupon_code', v_coupon_code
  );
end;
$$;

-- ============================================================
-- preview_order: معاينة الحساب لصفحة الـ Checkout (من غير كتابة)
-- ============================================================
create function public.preview_order(
  p_address_id uuid,
  p_coupon_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_governorate text;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select a.governorate into v_governorate
  from public.addresses a
  where a.id = p_address_id and a.user_id = v_user;
  if v_governorate is null then
    raise exception 'address_not_found';
  end if;

  return public.quote_order(v_user, v_governorate, p_coupon_code);
end;
$$;

-- ============================================================
-- create_order: بتنشئ الطلب بالكامل في transaction واحدة
-- ============================================================
create function public.create_order(
  p_idempotency_key uuid,
  p_address_id uuid,
  p_coupon_code text default null,
  p_payment_method text default 'cod'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_existing uuid;
  v_addr public.addresses%rowtype;
  v_coupon public.coupons%rowtype;
  v_coupon_id uuid;
  v_quote jsonb;
  v_order_id uuid;
  v_item record;
  v_items_total numeric(10,2) := 0;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  -- COD بس دلوقتي. الدفع بالكارت هيتضاف مع Paymob.
  if p_payment_method <> 'cod' then
    raise exception 'payment_method_unsupported';
  end if;

  -- بنخلي عمليات الـ checkout بتاعة نفس المستخدم تمشي واحدة ورا التانية
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  -- نفس الـ key؟ يبقى ده نفس الطلب (ضغطة مكررة أو refresh). نرجّعه من غير ما نعمل حاجة.
  select o.id into v_existing
  from public.orders o
  where o.user_id = v_user and o.idempotency_key = p_idempotency_key;
  if v_existing is not null then
    return v_existing;
  end if;

  select * into v_addr
  from public.addresses a
  where a.id = p_address_id and a.user_id = v_user;
  if not found then
    raise exception 'address_not_found';
  end if;

  -- نقفل (بترتيب ثابت عشان ما يحصلش deadlock): السلة، بعدين المنتجات، بعدين الـ variants.
  -- أي حد تاني يحاول يعدّل حاجة منهم هيستنى لحد ما الطلب يخلص.
  perform 1 from public.cart_items ci
  where ci.user_id = v_user
  order by ci.id
  for update;

  perform 1 from public.products p
  where p.id in (
    select pv.product_id from public.cart_items ci
    join public.product_variants pv on pv.id = ci.variant_id
    where ci.user_id = v_user
  )
  order by p.id
  for share;

  perform 1 from public.product_variants pv
  where pv.id in (
    select ci.variant_id from public.cart_items ci where ci.user_id = v_user
  )
  order by pv.id
  for update;

  -- الحساب والتحققات (المخزون، الكوبون، الشحن) بعد القفل
  v_quote := public.quote_order(v_user, v_addr.governorate, p_coupon_code);
  v_coupon_id := (v_quote ->> 'coupon_id')::uuid;

  if v_coupon_id is not null then
    select * into v_coupon
    from public.coupons c
    where c.id = v_coupon_id
    for update;

    if v_coupon.usage_limit is not null
       and v_coupon.used_count >= v_coupon.usage_limit then
      raise exception 'coupon_exhausted';
    end if;

    update public.coupons
    set used_count = used_count + 1
    where id = v_coupon_id;
  end if;

  insert into public.orders (
    user_id, idempotency_key, payment_method,
    subtotal, discount, shipping_fee, total,
    coupon_id, coupon_code, shipping_address
  )
  values (
    v_user, p_idempotency_key, p_payment_method,
    (v_quote ->> 'subtotal')::numeric,
    (v_quote ->> 'discount')::numeric,
    (v_quote ->> 'shipping_fee')::numeric,
    (v_quote ->> 'total')::numeric,
    v_coupon_id, v_quote ->> 'coupon_code',
    jsonb_build_object(
      'full_name', v_addr.full_name,
      'phone', v_addr.phone,
      'governorate', v_addr.governorate,
      'city', v_addr.city,
      'street', v_addr.street,
      'notes', v_addr.notes
    )
  )
  returning id into v_order_id;

  for v_item in
    select
      ci.quantity,
      pv.id as variant_id,
      pv.sku,
      coalesce(pv.price_override, p.base_price) as unit_price,
      p.name as product_name,
      s.name as size_name,
      c.name as color_name
    from public.cart_items ci
    join public.product_variants pv on pv.id = ci.variant_id
    join public.products p on p.id = pv.product_id
    join public.sizes s on s.id = pv.size_id
    join public.colors c on c.id = pv.color_id
    where ci.user_id = v_user
  loop
    insert into public.order_items (
      order_id, variant_id, product_name, sku, size_name, color_name,
      unit_price, quantity, line_total
    )
    values (
      v_order_id, v_item.variant_id, v_item.product_name, v_item.sku,
      v_item.size_name, v_item.color_name,
      v_item.unit_price, v_item.quantity, v_item.unit_price * v_item.quantity
    );

    -- خصم المخزون. وعليه check (stock >= 0) في الجدول كخط دفاع أخير.
    update public.product_variants
    set stock_quantity = stock_quantity - v_item.quantity
    where id = v_item.variant_id;

    v_items_total := v_items_total + v_item.unit_price * v_item.quantity;
  end loop;

  -- فحص أمان أخير: مجموع السطور لازم يساوي الـ subtotal اللي اتحسب
  if v_items_total <> (v_quote ->> 'subtotal')::numeric then
    raise exception 'cart_changed';
  end if;

  delete from public.cart_items where user_id = v_user;

  insert into public.payments (order_id, provider, amount, status)
  values (v_order_id, 'cod', (v_quote ->> 'total')::numeric, 'pending');

  return v_order_id;
end;
$$;

-- ============ الصلاحيات ============
-- quote_order داخلية: ولا واحد من المتصفح يقدر ينادي عليها
revoke execute on function public.quote_order(uuid, text, text)
  from public, anon, authenticated;

revoke execute on function public.preview_order(uuid, text) from public, anon;
grant execute on function public.preview_order(uuid, text) to authenticated;

revoke execute on function public.create_order(uuid, uuid, text, text)
  from public, anon;
grant execute on function public.create_order(uuid, uuid, text, text)
  to authenticated;