-- =============================================================================
-- Fix hardcoded 1.0 project URL in email_queue_wake function
-- generation_queue_dispatch was fixed by re-applying the migration with --include-all
-- =============================================================================

CREATE OR REPLACE FUNCTION public.email_queue_wake()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'email-queue-processor'
  ) THEN
    BEGIN
      PERFORM cron.schedule(
        'email-queue-processor',
        '* * * * *',
        $cron$SELECT public.email_queue_wake()$cron$
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'email_queue_wake: cron schedule failed: %', SQLERRM;
    END;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://gnvehgdbgcsozaawzgtc.supabase.co/functions/v1/process-email-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'email_queue_wake: http_post failed: %', SQLERRM;
  END;
END;
$func$;
