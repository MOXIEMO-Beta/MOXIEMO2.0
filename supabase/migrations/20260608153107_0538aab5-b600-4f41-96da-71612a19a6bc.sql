
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS source_filename text;

-- Migrate existing repurposed drafts: extract trailing "Source: X" line into source_filename, strip from body.
UPDATE public.content_items
SET
  source_filename = COALESCE(
    source_filename,
    NULLIF(regexp_replace(
      (regexp_match(body, '(?im)^\s*Source:\s*(.+?)\s*$'))[1],
      '^\s+|\s+$', '', 'g'
    ), '')
  ),
  body = regexp_replace(body, '(?im)\n*^\s*Source:\s*.+?\s*$', '', 'g')
WHERE body ~* '(?m)^\s*Source:\s*.+$';
