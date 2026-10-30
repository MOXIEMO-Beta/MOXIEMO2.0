import { joinFoundingList } from "./joinFoundingList";
import { captureCampaign } from "./campaign";
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));
vi.mock("@/lib/ctaVariant", () => ({ getCtaVariant: () => "seat" }));

it("sends the hero attribution, shared variant and campaign values", async () => {
  captureCampaign("?utm_source=test&utm_campaign=shell-check");
  invoke.mockResolvedValue({ data: { success: true }, error: null });
  const result = await joinFoundingList({ firstName: "Shell", email: "shell@example.com", entry: "hero" });
  expect(invoke).toHaveBeenLastCalledWith("join-waitlist", { body: { name: "Shell", email: "shell@example.com", source: "start_hero", cta_variant: "seat", utm_source: "test", utm_campaign: "shell-check", utm_medium: null, utm_content: null, utm_term: null } });
  expect(result.status).toBe("success");
});

it("sends section attribution and returns the duplicate result", async () => {
  invoke.mockResolvedValue({ data: null, error: { context: new Response(null, { status: 409 }) } });
  expect((await joinFoundingList({ firstName: "Shell", email: "shell@example.com", entry: "section" })).status).toBe("already");
  expect(invoke.mock.lastCall?.[1].body.source).toBe("start_section");
});

it("returns an error for failed submissions", async () => {
  invoke.mockRejectedValue(new Error("offline"));
  expect((await joinFoundingList({ firstName: "Shell", email: "shell@example.com", entry: "hero" })).status).toBe("error");
});
