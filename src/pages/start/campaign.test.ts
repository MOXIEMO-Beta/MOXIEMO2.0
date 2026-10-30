import { captureCampaign, campaignLink, getVisitCampaign, foundingRedirect, readCampaign } from "./campaign";
import { normalizeCampaign } from "../../../supabase/functions/join-waitlist/campaign";
import { normalizeSource } from "../../../supabase/functions/join-waitlist/source";

it("captures the five campaign values without browser storage", () => {
  const storage = vi.spyOn(Storage.prototype, "setItem");
  captureCampaign("?utm_source=test&utm_campaign=shell-check&utm_medium=email&utm_content=hero&utm_term=founder");
  expect(getVisitCampaign()).toEqual({ utm_source: "test", utm_campaign: "shell-check", utm_medium: "email", utm_content: "hero", utm_term: "founder" });
  expect(storage).not.toHaveBeenCalled();
  storage.mockRestore();
});

it("keeps campaign tags and existing queries on links", () => {
  expect(campaignLink("/auth?mode=signin#top", readCampaign("?utm_source=test&utm_campaign=shell-check"))).toBe("/auth?mode=signin&utm_source=test&utm_campaign=shell-check#top");
});

it("redirects founding to the founding anchor while retaining campaign tags", () => {
  expect(foundingRedirect("?utm_source=test&utm_campaign=shell-check")).toBe("/start?utm_source=test&utm_campaign=shell-check#founding");
});

it("allows both campaign placements", () => {
  expect(normalizeSource("start_hero")).toBe("start_hero");
  expect(normalizeSource("start_section")).toBe("start_section");
});

it("keeps legacy submissions nullable and rejects non-text UTM values", () => {
  expect(normalizeCampaign({ utm_source: "test", utm_campaign: "shell-check", utm_term: 9 })).toEqual({ utm_source: "test", utm_medium: null, utm_campaign: "shell-check", utm_content: null, utm_term: null });
});
