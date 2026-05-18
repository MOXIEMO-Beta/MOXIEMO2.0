
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'founding_member';

CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  generations_used INTEGER DEFAULT 0,
  last_reset TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage"
ON public.usage_tracking FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own usage"
ON public.usage_tracking FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own usage"
ON public.usage_tracking FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
