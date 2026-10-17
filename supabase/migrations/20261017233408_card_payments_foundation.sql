-- ============ ربط الدفعات بـ Paymob ============
alter table public.payments
  add column paymob_order_id bigint,
  add column paymob_transaction_id bigint;

-- الـ Paymob order id لازم يكون لدفعة واحدة بس
create unique index payments_paymob_order_id_key
  on public.payments (paymob_order_id) where paymob_order_id is not null;

-- ============ create_order: ندعم الكارت (بنفس منطق الأمان) ============
create or replace function public.create_order(
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

  if p_payment_method not in ('cod', 'card') then
    raise exception 'payment_method_unsupported';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

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

    update public.product_variants
    set stock_quantity = stock_quantity - v_item.quantity
    where id = v_item.variant_id;

    v_items_total := v_items_total + v_item.unit_price * v_item.quantity;
  end loop;

  if v_items_total <> (v_quote ->> 'subtotal')::numeric then
    raise exception 'cart_changed';
  end if;

  delete from public.cart_items where user_id = v_user;

  insert into public.payments (order_id, provider, amount, status)
  values (
    v_order_id,
    case when p_payment_method = 'card' then 'paymob' else 'cod' end,
    (v_quote ->> 'total')::numeric,
    'pending'
  );

  return v_order_id;
end;
$$;

-- ============================================================
-- apply_paymob_transaction: بتتنادى من الـ webhook (بعد التحقق من الـ HMAC) بس.
-- مفيش حاجة من المتصفح بتوصلها: الصلاحية للسيرفر (service_role) فقط.
-- ============================================================
create function public.apply_paymob_transaction(
  p_paymob_order_id bigint,
  p_paymob_transaction_id bigint,
  p_amount_cents bigint,
  p_currency text,
  p_outcome text,   -- 'paid' | 'failed' | 'pending'
  p_summary jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
begin
  if p_outcome not in ('paid', 'failed', 'pending') then
    raise exception 'invalid_outcome';
  end if;

  -- نعرف الطلب الأول من غير قفل، وبعدين نقفل بنفس ترتيب باقي الـ functions:
  -- الطلب ثم الدفعة (عشان ما يحصلش deadlock مع إلغاء الأدمن)
  select pay.order_id into v_order_id
  from public.payments pay
  where pay.paymob_order_id = p_paymob_order_id and pay.provider = 'paymob';
  if v_order_id is null then
    return 'unknown_payment';
  end if;

  select * into v_order from public.orders where id = v_order_id for update;
  select * into v_payment
  from public.payments
  where paymob_order_id = p_paymob_order_id and provider = 'paymob'
  for update;

  -- الدفعة اتعلّمت ناجحة قبل كده: ولا callback (حتى قديم أو مكرر) يغيّرها
  if v_payment.status = 'succeeded' then
    return 'already_processed';
  end if;

  -- المبلغ والعملة لازم يطابقوا اللي في الـ database
  if p_amount_cents <> round(v_payment.amount * 100)::bigint
     or upper(p_currency) <> 'EGP' then
    return 'amount_mismatch';
  end if;

  if p_outcome = 'pending' then
    return 'ignored_pending';
  end if;

  if p_outcome = 'failed' then
    -- دفعة اتلغت (الطلب اتلغى) ما بنرجّعهاش لـ failed
    if v_payment.status in ('pending', 'failed') then
      update public.payments
      set status = 'failed',
          paymob_transaction_id = p_paymob_transaction_id,
          raw_payload = p_summary
      where id = v_payment.id;

      update public.orders
      set payment_status = 'failed'
      where id = v_order.id and payment_status = 'unpaid';
    end if;
    return 'applied';
  end if;

  -- p_outcome = 'paid'
  update public.payments
  set status = 'succeeded',
      paymob_transaction_id = p_paymob_transaction_id,
      raw_payload = p_summary
  where id = v_payment.id;

  update public.orders
  set payment_status = 'paid',
      status = case when status = 'pending' then 'confirmed' else status end
  where id = v_order.id;

  -- العميل دفع لطلب اتلغى (المخزون اترجع): محتاج استرداد يدوي
  if v_order.status = 'cancelled' then
    return 'needs_refund';
  end if;

  return 'applied';
end;
$$;

revoke execute on function public.apply_paymob_transaction(bigint, bigint, bigint, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.apply_paymob_transaction(bigint, bigint, bigint, text, text, jsonb)
  to service_role;