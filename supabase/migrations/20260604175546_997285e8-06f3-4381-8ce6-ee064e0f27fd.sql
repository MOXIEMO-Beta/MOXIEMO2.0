CREATE TABLE public.campaign_execution_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL,
  date date NOT NULL,
  channel text NOT NULL,
  week_number integer,
  week_theme text,
  content_brief text,
  status text NOT NULL DEFAULT 'not_started',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_execution_items TO authenticated;
GRANT ALL ON public.campaign_execution_items TO service_role;

ALTER TABLE public.campaign_execution_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own execution items" ON public.campaign_execution_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own execution items" ON public.campaign_execution_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own execution items" ON public.campaign_execution_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own execution items" ON public.campaign_execution_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_cei_user_date ON public.campaign_execution_items (user_id, date);
CREATE INDEX idx_cei_campaign ON public.campaign_execution_items (campaign_id);

CREATE TRIGGER touch_cei_updated_at BEFORE UPDATE ON public.campaign_execution_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();