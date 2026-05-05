
CREATE TABLE public.blog_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.resources_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join blog waitlist" ON public.blog_waitlist
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can join resources waitlist" ON public.resources_waitlist
  FOR INSERT TO anon, authenticated WITH CHECK (true);
