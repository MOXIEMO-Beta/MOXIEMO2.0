export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type Campaign = Record<(typeof UTM_KEYS)[number], string | null>;
let visitCampaign: Campaign = readCampaign("");

export function readCampaign(search: string): Campaign {
  const params = new URLSearchParams(search);
  return Object.fromEntries(UTM_KEYS.map(key => [key, params.get(key)])) as Campaign;
}

export function captureCampaign(search: string): Campaign {
  visitCampaign = readCampaign(search);
  return { ...visitCampaign };
}

export function getVisitCampaign(): Campaign {
  return { ...visitCampaign };
}

export function campaignLink(path: string, campaign: Campaign): string {
  const [base, hash] = path.split("#");
  const [pathname, query] = base.split("?");
  const params = new URLSearchParams(query);
  for (const key of UTM_KEYS) {
    const value = campaign[key];
    if (value !== null) params.set(key, value);
  }
  const search = params.toString();
  return pathname + (search ? `?${search}` : "") + (hash !== undefined ? `#${hash}` : "");
}

export function foundingRedirect(search: string): string {
  return `/start${search}#founding`;
}
