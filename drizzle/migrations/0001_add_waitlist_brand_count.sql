ALTER TABLE public.waitlist ADD COLUMN brand_count text CHECK (brand_count IN ('1', '2', '3', '4 or more'));
COMMENT ON COLUMN public.waitlist.brand_count IS 'Number of brands selected on the home first-100 form; nullable for legacy and other signup forms.';
GRANT ALL ON public.waitlist TO service_role;