
-- Part E: link audits to users (nullable, backwards compatible)
ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS audits_user_id_idx ON public.audits(user_id);
CREATE INDEX IF NOT EXISTS audits_user_created_idx ON public.audits(user_id, created_at DESC);

-- Replace the flat deny-all with targeted policies: clients still cannot write,
-- but signed-in owners can read their own rows (needed for polling + Brand Hub).
DROP POLICY IF EXISTS "deny all client access to audits" ON public.audits;

CREATE POLICY "clients cannot insert audits"
  ON public.audits FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "clients cannot update audits"
  ON public.audits FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "clients cannot delete audits"
  ON public.audits FOR DELETE TO anon, authenticated USING (false);
CREATE POLICY "owners can read their audits"
  ON public.audits FOR SELECT TO authenticated USING (user_id IS NOT NULL AND user_id = auth.uid());

GRANT SELECT ON public.audits TO authenticated;

-- Part F: brand kits table (real generated JSON content, per user)
CREATE TABLE IF NOT EXISTS public.brand_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kit_json jsonb NOT NULL,
  strategy_id uuid REFERENCES public.strategies(id) ON DELETE SET NULL,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_kits TO authenticated;
GRANT ALL ON public.brand_kits TO service_role;

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners can select their brand_kits"
  ON public.brand_kits FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "owners can insert their brand_kits"
  ON public.brand_kits FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "owners can update their brand_kits"
  ON public.brand_kits FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owners can delete their brand_kits"
  ON public.brand_kits FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS brand_kits_user_idx ON public.brand_kits(user_id, created_at DESC);

CREATE TRIGGER brand_kits_touch_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
