
CREATE OR REPLACE FUNCTION public.sanitize_dashes_text(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE WHEN t IS NULL THEN NULL ELSE
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(t, '[ \t\u00A0]*[\u2014\u2013][ \t\u00A0]*', ', ', 'g'),
            ',{2,}', ',', 'g'
          ),
          ',\s*([.!?;:])', '\1', 'g'
        ),
        '[ \t]+([,.!?;:])', '\1', 'g'
      ),
      '[ \t]{2,}', ' ', 'g'
    )
  END
$$;

-- One-time cleanup of already-persisted generated content.
UPDATE public.strategies
   SET enhanced_foundation = sanitize_dashes_text(enhanced_foundation::text)::jsonb
 WHERE enhanced_foundation IS NOT NULL
   AND enhanced_foundation::text ~ '[\u2013\u2014]';

UPDATE public.strategies
   SET raw_foundation = sanitize_dashes_text(raw_foundation::text)::jsonb
 WHERE raw_foundation IS NOT NULL
   AND raw_foundation::text ~ '[\u2013\u2014]';

UPDATE public.strategies
   SET voice_attributes = sanitize_dashes_text(voice_attributes::text)::jsonb
 WHERE voice_attributes IS NOT NULL
   AND voice_attributes::text ~ '[\u2013\u2014]';

UPDATE public.strategies
   SET content_pillars = sanitize_dashes_text(content_pillars::text)::jsonb
 WHERE content_pillars IS NOT NULL
   AND content_pillars::text ~ '[\u2013\u2014]';

UPDATE public.strategies
   SET positioning_statement = sanitize_dashes_text(positioning_statement),
       ideal_client          = sanitize_dashes_text(ideal_client),
       pain_point            = sanitize_dashes_text(pain_point),
       transformation        = sanitize_dashes_text(transformation),
       anti_positioning      = sanitize_dashes_text(anti_positioning),
       success_definition    = sanitize_dashes_text(success_definition),
       business_goal         = sanitize_dashes_text(business_goal)
 WHERE (positioning_statement || ' ' || COALESCE(ideal_client,'') || ' ' || COALESCE(pain_point,'')
        || ' ' || COALESCE(transformation,'') || ' ' || COALESCE(anti_positioning,'')
        || ' ' || COALESCE(success_definition,'') || ' ' || COALESCE(business_goal,'')) ~ '[\u2013\u2014]';

UPDATE public.brand_kits
   SET kit_json = sanitize_dashes_text(kit_json::text)::jsonb
 WHERE kit_json IS NOT NULL
   AND kit_json::text ~ '[\u2013\u2014]';

UPDATE public.audits
   SET report = sanitize_dashes_text(report::text)::jsonb
 WHERE report IS NOT NULL
   AND report::text ~ '[\u2013\u2014]';
