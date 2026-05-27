-- Prevent public inserts from setting admin-only fields on the waitlist table.
-- This acts as defense-in-depth since the join-waitlist edge function already
-- only inserts safe fields, but the RLS INSERT policy allows any columns.
CREATE OR REPLACE FUNCTION public.sanitize_waitlist_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.status := 'pending';
  NEW.approved_at := NULL;
  NEW.approved_by := NULL;
  NEW.beta_code_sent := NULL;
  NEW.scheduled_call_at := NULL;
  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS sanitize_waitlist_insert ON public.waitlist;
CREATE TRIGGER sanitize_waitlist_insert
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_waitlist_insert();
