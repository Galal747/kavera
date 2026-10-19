select cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',
  $$delete from public.rate_limits where window_start < now() - interval '1 day'$$
);