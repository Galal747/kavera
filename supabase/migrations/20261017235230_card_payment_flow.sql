-- ============================================================
-- إلغاء طلب داخليًا: بيرجّع المخزون والكوبون ويلغي الدفعة المعلّقة.
-- مش متاحة لأي مستخدم، بتتنادى من functions تانية بس.
-- ============================================================
create function public.cancel_order_internal(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.status = 'cancelled' then
    return;
  end if;

  -- طلب مدفوع محتاج استرداد، مش إلغاء بس
  if v_order.payment_status = 'paid' then
    raise exception 'refund_required';
  end if;

  perform 1
  from public.product_variants pv
  where pv.id in (
    select oi.variant_id from public.order_items oi
    where oi.order_id = p_order_id
  )
  order by pv.id
  for update;

  update public.product_variants pv
  set stock_quantity = pv.stock_quantity + items.qty
  from (
    select oi.variant_id, sum(oi.quantity)::int as qty
    from public.order_items oi
    where oi.order_id = p_order_id
    group by oi.variant_id
  ) items
  where pv.id = items.variant_id;

  if v_order.coupon_id is not null then
    update public.coupons
    set used_count = greatest(used_count - 1, 0)
    where id = v_order.coupon_id;
  end if;

  update public.payments
  set status = 'cancelled'
  where order_id = p_order_id and status = 'pending';

  update public.orders set status = 'cancelled' where id = p_order_id;
end;
$$;

revoke execute on function public.cancel_order_internal(uuid)
  from public, anon, authenticated;

-- ============================================================
-- admin_update_order_status: نفس القواعد، + طلب الكارت لازم يكون مدفوع قبل ما يتقدّم
-- ============================================================
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_new_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_allowed boolean;
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  v_allowed := case v_order.status
    when 'pending' then p_new_status in ('confirmed', 'cancelled')
    when 'confirmed' then p_new_status in ('processing', 'cancelled')
    when 'processing' then p_new_status in ('shipped', 'cancelled')
    when 'shipped' then p_new_status = 'delivered'
    else false
  end;
  if not v_allowed then
    raise exception 'invalid_transition';
  end if;

  if p_new_status = 'cancelled' then
    if v_order.payment_status = 'paid' then
      raise exception 'refund_required';
    end if;
    perform public.cancel_order_internal(p_order_id);
    return;
  end if;

  -- مفيش شحن لطلب كارت مش مدفوع
  if v_order.payment_method = 'card' and v_order.payment_status <> 'paid' then
    raise exception 'payment_required';
  end if;

  if p_new_status = 'delivered' and v_order.payment_method = 'cod' then
    update public.payments
    set status = 'succeeded'
    where order_id = p_order_id and provider = 'cod' and status = 'pending';
  end if;

  update public.orders
  set status = p_new_status,
      payment_status = case
        when p_new_status = 'delivered' and payment_method = 'cod' then 'paid'
        else payment_status
      end
  where id = p_order_id;
end;
$$;

-- ============================================================
-- إلغاء طلبات الكارت اللي ما اتدفعتش (للـ cron)
-- ============================================================
create function public.expire_unpaid_card_orders(p_minutes int default 60)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_order public.orders%rowtype;
  v_count int := 0;
begin
  for v_id in
    select o.id
    from public.orders o
    where o.payment_method = 'card'
      and o.status = 'pending'
      and o.payment_status in ('unpaid', 'failed')
      and o.created_at < now() - make_interval(mins => greatest(p_minutes, 5))
    order by o.created_at
    limit 100
  loop
    -- نقفل الطلب ونفحص تاني: ممكن الدفع يكون وصل في اللحظة دي
    select * into v_order from public.orders where id = v_id for update;
    if v_order.status = 'pending'
       and v_order.payment_status in ('unpaid', 'failed') then
      perform public.cancel_order_internal(v_id);
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.expire_unpaid_card_orders(int)
  from public, anon, authenticated;
grant execute on function public.expire_unpaid_card_orders(int) to service_role;

-- ============================================================
-- بداية محاولة دفع: بتتأكد إن الطلب بتاع المستخدم وينفع يتدفع،
-- وبترجّع المبلغ من الـ database
-- ============================================================
create function public.begin_card_payment(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_order public.orders%rowtype;
  v_payment_id uuid;
  v_attempts int;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and user_id = v_user
  for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.payment_method <> 'card'
     or v_order.status <> 'pending'
     or v_order.payment_status not in ('unpaid', 'failed') then
    raise exception 'payment_not_allowed';
  end if;

  -- أول محاولة: الدفعة اللي create_order عملتها وما اتربطتش بـ intention لسه
  select id into v_payment_id
  from public.payments
  where order_id = p_order_id and provider = 'paymob'
    and status = 'pending' and paymob_order_id is null
  order by created_at
  limit 1;

  if v_payment_id is null then
    select count(*) into v_attempts
    from public.payments
    where order_id = p_order_id and provider = 'paymob';
    if v_attempts >= 5 then
      raise exception 'too_many_attempts';
    end if;

    insert into public.payments (order_id, provider, amount, status)
    values (p_order_id, 'paymob', v_order.total, 'pending')
    returning id into v_payment_id;
  end if;

  return jsonb_build_object(
    'payment_id', v_payment_id,
    'amount_cents', round(v_order.total * 100)::bigint,
    'order_number', v_order.order_number,
    'shipping_address', v_order.shipping_address
  );
end;
$$;

revoke execute on function public.begin_card_payment(uuid) from public, anon;
grant execute on function public.begin_card_payment(uuid) to authenticated;

-- ربط الدفعة برقم الـ order عند Paymob (من السيرفر بس)
create function public.attach_paymob_intention(
  p_payment_id uuid,
  p_paymob_order_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.payments
  set paymob_order_id = p_paymob_order_id
  where id = p_payment_id
    and provider = 'paymob'
    and status = 'pending'
    and paymob_order_id is null;
  if not found then
    raise exception 'payment_not_attachable';
  end if;
end;
$$;

revoke execute on function public.attach_paymob_intention(uuid, bigint)
  from public, anon, authenticated;
grant execute on function public.attach_paymob_intention(uuid, bigint)
  to service_role;

-- ============================================================
-- apply_paymob_transaction: نفس اللي في الجزء 1 + حماية من الدفع المزدوج
-- ============================================================
create or replace function public.apply_paymob_transaction(
  p_paymob_order_id bigint,
  p_paymob_transaction_id bigint,
  p_amount_cents bigint,
  p_currency text,
  p_outcome text,
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

  if v_payment.status = 'succeeded' then
    return 'already_processed';
  end if;

  if p_amount_cents <> round(v_payment.amount * 100)::bigint
     or upper(p_currency) <> 'EGP' then
    return 'amount_mismatch';
  end if;

  if p_outcome = 'pending' then
    return 'ignored_pending';
  end if;

  if p_outcome = 'failed' then
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

  -- الطلب اتدفع قبل كده بمحاولة تانية: العميل اتخصم منه مرتين
  if v_order.payment_status = 'paid' then
    return 'duplicate_payment';
  end if;

  update public.orders
  set payment_status = 'paid',
      status = case when status = 'pending' then 'confirmed' else status end
  where id = v_order.id;

  if v_order.status = 'cancelled' then
    return 'needs_refund';
  end if;

  return 'applied';
end;
$$;