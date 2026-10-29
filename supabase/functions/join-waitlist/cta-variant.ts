export function validCtaVariant(value: unknown): boolean {
  return value == null || value === "seat" || value === "early";
}