create schema if not exists private;

-- Move both functions to private schema. Triggers reference by OID so they follow automatically.
alter function public.email_queue_wake() set schema private;
alter function public.email_queue_dispatch() set schema private;

-- Rewrite email_queue_wake so the cron job body references the new schema.
create or replace function private.email_queue_wake()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(7700000000000001);
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue') THEN
    BEGIN
      PERFORM cron.schedule('process-email-queue', '5 seconds', $cron$ SELECT private.email_queue_dispatch(); $cron$);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'email_queue_wake: cron schedule failed: %', SQLERRM;
    END;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://mqhipuvkdsvapbhrrzjd.supabase.co/functions/v1/process-email-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Lovable-Context', 'cron',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'email_queue_wake failed (enqueue preserved): %', SQLERRM;
  RETURN NULL;
END;
$function$;

-- Lock down execute on the private schema versions too (defense in depth).
revoke execute on function private.email_queue_wake() from public;
revoke execute on function private.email_queue_dispatch() from public;

-- Update any currently-scheduled cron job to use the new schema-qualified call.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'process-email-queue') then
    perform cron.unschedule('process-email-queue');
    perform cron.schedule('process-email-queue', '5 seconds', $cron$ SELECT private.email_queue_dispatch(); $cron$);
  end if;
end$$;