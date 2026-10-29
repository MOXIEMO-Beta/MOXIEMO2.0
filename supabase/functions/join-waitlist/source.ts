export function normalizeSource(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 60 || !/^[A-Za-z0-9_. -]+$/.test(trimmed)) return null;
  return trimmed;
}
