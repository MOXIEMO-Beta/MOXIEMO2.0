
-- PART A: Qualify triggers to call private.email_queue_wake() explicitly
DROP TRIGGER IF EXISTS email_queue_wake_auth ON pgmq.q_auth_emails;
CREATE TRIGGER email_queue_wake_auth
  AFTER INSERT ON pgmq.q_auth_emails
  FOR EACH STATEMENT EXECUTE FUNCTION private.email_queue_wake();

DROP TRIGGER IF EXISTS email_queue_wake_transactional ON pgmq.q_transactional_emails;
CREATE TRIGGER email_queue_wake_transactional
  AFTER INSERT ON pgmq.q_transactional_emails
  FOR EACH STATEMENT EXECUTE FUNCTION private.email_queue_wake();

-- If a cron job named 'process-email-queue' exists and calls the unqualified/public dispatch, rewrite it
DO $mig$
DECLARE
  v_cmd text;
BEGIN
  SELECT command INTO v_cmd FROM cron.job WHERE jobname = 'process-email-queue';
  IF v_cmd IS NOT NULL AND v_cmd NOT LIKE '%private.email_queue_dispatch%' THEN
    PERFORM cron.unschedule('process-email-queue');
    PERFORM cron.schedule('process-email-queue', '5 seconds', $cron$ SELECT private.email_queue_dispatch(); $cron$);
  END IF;
END
$mig$;

-- PART B: Self-healing event trigger to auto-revoke on any recreation of the public duplicates
CREATE OR REPLACE FUNCTION private.revoke_on_email_queue_function_create()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF obj.object_identity IN (
      'public.email_queue_wake()',
      'public.email_queue_dispatch()'
    ) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', obj.object_identity);
      RAISE LOG 'Auto-revoked PUBLIC/anon/authenticated EXECUTE on recreated function: %', obj.object_identity;
    END IF;
  END LOOP;
END;
$fn$;

DO $ev$
BEGIN
  BEGIN
    DROP EVENT TRIGGER IF EXISTS auto_revoke_email_queue_functions;
    CREATE EVENT TRIGGER auto_revoke_email_queue_functions
      ON ddl_command_end
      WHEN TAG IN ('CREATE FUNCTION')
      EXECUTE FUNCTION private.revoke_on_email_queue_function_create();
    RAISE NOTICE 'Event trigger auto_revoke_email_queue_functions created successfully';
  EXCEPTION WHEN insufficient_privilege OR others THEN
    RAISE NOTICE 'Event trigger creation failed (%), falling back to cron reharden', SQLERRM;
    PERFORM cron.schedule(
      'reharden-email-queue-functions',
      '*/5 * * * *',
      $reh$
        DO $r$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='email_queue_wake') THEN
            REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
          END IF;
          IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='email_queue_dispatch') THEN
            REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
          END IF;
        END
        $r$;
      $reh$
    );
  END;
END
$ev$;

-- Immediate revoke on any current public duplicates (safety net)
DO $now$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='email_queue_wake') THEN
    REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='email_queue_dispatch') THEN
    REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
  END IF;
END
$now$;
