-- Default plan for new profiles is founding_member during beta
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'founding_member';

-- Backfill any existing rows without a founding plan (covers null + legacy 'free_beta')
UPDATE public.profiles SET plan = 'founding_member' WHERE plan IS NULL OR plan = 'free_beta';

-- Update handle_new_user trigger to set plan explicitly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'founding_member');
  RETURN NEW;
END;
$function$;