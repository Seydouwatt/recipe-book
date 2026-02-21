-- Active les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Job cron : tous les vendredis à 20h UTC
-- Remplacer YOUR_PROJECT et SERVICE_ROLE_KEY par les vraies valeurs
SELECT cron.schedule(
  'weekly-recipe-import',
  '0 20 * * 5',
  $$
  SELECT net.http_post(
    url := 'https://baybsmuwcmsmpmfpmzfg.supabase.co/functions/v1/import-recipes',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheWJzbXV3Y21zbXBtZnBtemZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY1OTQ5MiwiZXhwIjoyMDg2MjM1NDkyfQ.gQtxK0oGOkTiizzNVFeqwKsmZ6vyQIM7OaPGmsHqkpo'
    )
  );
  $$
);
