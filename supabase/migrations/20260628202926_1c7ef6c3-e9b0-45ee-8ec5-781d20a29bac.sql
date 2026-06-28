ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_hub_visited boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_colors jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_logo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_fonts jsonb;