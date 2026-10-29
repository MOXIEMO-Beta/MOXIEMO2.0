ALTER TABLE public.waitlist ADD COLUMN cta_variant text;
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_cta_variant_allowed CHECK (cta_variant IS NULL OR cta_variant IN ('seat', 'early'));