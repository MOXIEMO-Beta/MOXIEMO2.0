ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

UPDATE public.profiles
  SET is_admin = true
  WHERE email = 'karee@studiosbagency.com';