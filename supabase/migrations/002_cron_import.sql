-- Active les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Job cron : tous les vendredis à 20h UTC
-- IMPORTANT : remplacer YOUR_SERVICE_ROLE_KEY par la vraie clé service_role
-- avant d'exécuter ce SQL dans le Dashboard Supabase
SELECT cron.schedule(
  'weekly-recipe-import',
  '0 20 * * 5',
  $$
  SELECT net.http_post(
    url := 'https://baybsmuwcmsmpmfpmzfg.supabase.co/functions/v1/import-recipes',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  );
  $$
);
