
CREATE OR REPLACE FUNCTION public.sanitize_beta20_founding_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  new.status := 'waitlisted';
  new.source := 'pricing_page';
  new.tier_interest := coalesce(new.tier_interest, 'unsure');
  new.user_id := auth.uid();
  return new;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.sanitize_beta20_founding_insert() FROM PUBLIC, anon, authenticated;

DELETE FROM public.beta20_founding WHERE email = 'qa-verification@example.com';
