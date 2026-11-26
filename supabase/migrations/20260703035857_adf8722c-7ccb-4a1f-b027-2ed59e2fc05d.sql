DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'email_queue_wake') THEN
    REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM public, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'email_queue_dispatch') THEN
    REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM public, anon, authenticated;
  END IF;
END;
$$;
