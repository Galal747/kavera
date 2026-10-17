create function public.admin_update_order_status(
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

  -- نقفل الطلب: أي تغيير تاني عليه هيستنى لحد ما ننتهي
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
    -- طلب اتدفع بالفعل محتاج استرداد، وده لسه مش مدعوم
    if v_order.payment_status = 'paid' then
      raise exception 'refund_required';
    end if;

    -- نقفل الـ variants بترتيب ثابت (نفس ترتيب create_order) عشان ما يحصلش deadlock
    perform 1
    from public.product_variants pv
    where pv.id in (
      select oi.variant_id from public.order_items oi
      where oi.order_id = p_order_id
    )
    order by pv.id
    for update;

    -- نرجّع المخزون
    update public.product_variants pv
    set stock_quantity = pv.stock_quantity + items.qty
    from (
      select oi.variant_id, sum(oi.quantity)::int as qty
      from public.order_items oi
      where oi.order_id = p_order_id
      group by oi.variant_id
    ) items
    where pv.id = items.variant_id;

    -- نرجّع استخدام الكوبون
    if v_order.coupon_id is not null then
      update public.coupons
      set used_count = greatest(used_count - 1, 0)
      where id = v_order.coupon_id;
    end if;

    update public.payments
    set status = 'cancelled'
    where order_id = p_order_id and status = 'pending';
  end if;

  -- تسليم طلب COD = الفلوس اتحصّلت
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

revoke execute on function public.admin_update_order_status(uuid, text)
  from public, anon;
grant execute on function public.admin_update_order_status(uuid, text)
  to authenticated;