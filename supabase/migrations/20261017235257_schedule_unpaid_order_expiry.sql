create extension if not exists pg_cron;

-- كل 10 دقايق: نلغي طلبات الكارت اللي عدّى عليها ساعة من غير دفع
select cron.schedule(
  'expire-unpaid-card-orders',
  '*/10 * * * *',
  $$select public.expire_unpaid_card_orders(60)$$
);