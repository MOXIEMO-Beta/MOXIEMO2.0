// Shared em-dash / en-dash sanitizer. Removes U+2014 and U+2013 anywhere they
// appear in generated copy, replacing "word — word", "word—word", "word —word"
// with "word, word". Leaves ordinary hyphens (U+002D) alone so compound words
// like "founder-led" and "end-to-end" remain intact.

const DASH_RE = /[ \t\u00A0]*[\u2014\u2013][ \t\u00A0]*/g;

export function sanitizeDashesInText(input: string): string {
  if (!input) return input;
  let s = input.replace(DASH_RE, ", ");
  // Collapse artifacts introduced by the replacement.
  s = s.replace(/,{2,}/g, ",");           // ",," -> ","
  s = s.replace(/,\s*([.!?;:])/g, "$1");   // ", ." -> "."
  s = s.replace(/\s+([,.!?;:])/g, "$1");   // " ," -> ","
  s = s.replace(/[ \t]{2,}/g, " ");        // collapse runs of spaces
  return s;
}

// Recursively sanitize every string leaf inside a JSON-shaped value. Non-string
// leaves (numbers, booleans, null) are passed through untouched. Arrays and
// plain objects are walked. Anything exotic is returned as-is.
export function sanitizeDashesDeep<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizeDashesInText(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeDashesDeep(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeDashesDeep(v);
    }
    return out as unknown as T;
  }
  return value;
}