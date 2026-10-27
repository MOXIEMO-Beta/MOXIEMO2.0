export function validBrandCount(value: unknown, source: unknown): boolean {
  if (value == null && source !== "home_first100" && source !== "founding_first100") return true;
  return typeof value === "string" && ["1", "2", "3", "4 or more"].includes(value);
}

export function validPlanInterest(value: unknown, source: unknown): boolean {
  if (value == null && source !== "founding_first100") return true;
  return typeof value === "string" && ["Clarity", "Momentum", "Multiply", "Not sure yet"].includes(value);
}
