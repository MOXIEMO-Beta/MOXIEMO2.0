export const BRAND_COUNTS = ["1", "2", "3", "4 or more"] as const;
export const HOME_ROLES = ["Solo business owner", "Founder or CEO", "Consultant or coach", "Fractional executive", "Agency owner", "Multi-brand or portfolio operator", "Marketer", "Other"];
export function isBrandCount(value: string): boolean {
  return BRAND_COUNTS.some(count => count === value);
}