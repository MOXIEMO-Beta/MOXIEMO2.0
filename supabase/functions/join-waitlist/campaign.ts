const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export function normalizeCampaign(payload: Record<string, unknown>) {
  return Object.fromEntries(keys.map(key => [key, typeof payload[key] === "string" ? payload[key] : null]));
}