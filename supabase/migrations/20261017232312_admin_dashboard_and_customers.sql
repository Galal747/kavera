-- ============================================================
-- إحصائيات الـ Dashboard
-- "المبيعات" = الطلبات غير الملغية. "المحصّل" = الطلبات اللي حالة دفعها paid.
-- ============================================================
create function public.admin_dashboard_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days int := least(greatest(coalesce(p_days, 30), 1), 365);
  v_today date := (now() at time zone 'Africa/Cairo')::date;
  v_since timestamptz;
  v_sales jsonb;
  v_pending int;
  v_products jsonb;
  v_low_count int;
  v_low jsonb;
  v_top jsonb;
  v_daily jsonb;
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  -- بداية الفترة = منتصف ليل القاهرة قبل (v_days - 1) يوم
  v_since := (v_today - (v_days - 1))::timestamp at time zone 'Africa/Cairo';

  select jsonb_build_object(
    'orders_count', count(*) filter (where o.status <> 'cancelled'),
    'cancelled_count', count(*) filter (where o.status = 'cancelled'),
    'sales_total', coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0),
    'collected_total', coalesce(sum(o.total) filter (where o.payment_status = 'paid'), 0)
  )
  into v_sales
  from public.orders o
  where o.created_at >= v_since;

  select count(*) into v_pending
  from public.orders o
  where o.status = 'pending';

  select jsonb_build_object(
    'active', count(*) filter (where p.is_active),
    'hidden', count(*) filter (where not p.is_active)
  )
  into v_products
  from public.products p;

  select count(*) into v_low_count
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where p.is_active and pv.stock_quantity <= 5;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.stock, t.name), '[]'::jsonb)
  into v_low
  from (
    select p.id as product_id, p.name, s.name as size, c.name as color,
           pv.stock_quantity as stock
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    join public.sizes s on s.id = pv.size_id
    join public.colors c on c.id = pv.color_id
    where p.is_active and pv.stock_quantity <= 5
    order by pv.stock_quantity, p.name
    limit 10
  ) t;

  -- الأكثر مبيعًا حسب اسم المنتج وقت الشراء (snapshot)
  select coalesce(jsonb_agg(to_jsonb(t) order by t.units desc, t.name), '[]'::jsonb)
  into v_top
  from (
    select oi.product_name as name,
           sum(oi.quantity)::int as units,
           sum(oi.line_total) as revenue
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.created_at >= v_since and o.status <> 'cancelled'
    group by oi.product_name
    order by units desc, name
    limit 5
  ) t;

  -- آخر 14 يوم بتوقيت القاهرة، والأيام اللي مفيهاش مبيعات بتظهر بصفر
  select coalesce(jsonb_agg(
           jsonb_build_object(
             'day', to_char(g.d, 'YYYY-MM-DD'),
             'total', coalesce(s.total, 0),
             'orders', coalesce(s.cnt, 0)
           ) order by g.d
         ), '[]'::jsonb)
  into v_daily
  from (
    select generate_series(
             (v_today - 13)::timestamp, v_today::timestamp, interval '1 day'
           )::date as d
  ) g
  left join (
    select (o.created_at at time zone 'Africa/Cairo')::date as d,
           sum(o.total) as total,
           count(*) as cnt
    from public.orders o
    where o.status <> 'cancelled'
      and o.created_at >= ((v_today - 13)::timestamp at time zone 'Africa/Cairo')
    group by 1
  ) s on s.d = g.d;

  return jsonb_build_object(
    'period_days', v_days,
    'sales', v_sales,
    'pending_orders', v_pending,
    'products', v_products,
    'low_stock_count', v_low_count,
    'low_stock', v_low,
    'top_products', v_top,
    'daily', v_daily
  );
end;
$$;

-- ============================================================
-- قايمة العملاء (قراءة فقط، من غير إيميل أو تليفون)
-- ============================================================
create function public.admin_list_customers(
  p_search text default null,
  p_limit int default 10,
  p_offset int default 0
)
returns table (
  customer_id uuid,
  customer_name text,
  customer_role text,
  joined_at timestamptz,
  orders_count bigint,
  total_spent numeric,
  last_order_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.role,
    p.created_at,
    count(o.id) filter (where o.status <> 'cancelled'),
    coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0),
    max(o.created_at),
    count(*) over ()
  from public.profiles p
  left join public.orders o on o.user_id = p.id
  where p_search is null or p.full_name ilike '%' || p_search || '%'
  group by p.id
  order by p.created_at desc, p.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
end;
$$;

revoke execute on function public.admin_dashboard_stats(int) from public, anon;
grant execute on function public.admin_dashboard_stats(int) to authenticated;

revoke execute on function public.admin_list_customers(text, int, int)
  from public, anon;
grant execute on function public.admin_list_customers(text, int, int)
  to authenticated;