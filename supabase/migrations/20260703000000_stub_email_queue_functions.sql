-- Stub: email_queue_wake and email_queue_dispatch were created directly in
-- production by Lovable and never captured in a migration. This stub defines
-- them locally so subsequent migrations that move/revoke them can run cleanly.
-- In production these already exist — CREATE OR REPLACE is a no-op there.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION public.email_queue_wake()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.email_queue_dispatch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NULL;
END;
$function$;
