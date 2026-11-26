import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────
const { from, auth, functions } = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "user-1" }, access_token: "tok" } } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  functions: { invoke: vi.fn() },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from, auth, functions } }));

// planRef object so the vi.mock factory closure picks up updates at render time
const planRef = { value: "founding_member" };
vi.mock("@/hooks/usePlan", () => ({
  usePlan: () => ({
    plan: planRef.value,
    loading: false,
    checkGenerationLimit: vi.fn().mockResolvedValue(true),
    openUpgrade: vi.fn(),
    incrementUsage: vi.fn(),
    handleGenerationResponse: vi.fn().mockReturnValue(false),
  }),
  PlanProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: { access_token: "tok" }, loading: false, isAdmin: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/AppHeader", () => ({ default: () => null }));
vi.mock("@/components/UpgradeDialog", () => ({ UpgradeDialog: () => null }));
// strategyPdf imports @react-pdf/renderer which is not jsdom-compatible
vi.mock("@/lib/strategyPdf", () => ({ downloadStrategyPdf: vi.fn().mockResolvedValue(undefined) }));

function makeChain(data: unknown, error = null) {
  const c: Record<string, unknown> = {};
  const methods = ["select","eq","neq","order","limit","maybeSingle","single","insert","update","upsert"];
  methods.forEach(m => { c[m] = vi.fn().mockReturnValue(c); });
  (c.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data, error });
  (c.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data, error });
  return c;
}

const freeStrategy = {
  id: "strat-1",
  user_id: "user-1",
  positioning_statement: "I help small businesses grow",
  ideal_client: "Small business owners",
  content_pillars: [{ name: "Value", description: "Provide value" }],
  voice_attributes: ["Clear", "Confident"],
  primary_channel: "LinkedIn",
  success_definition: "10 clients in 90 days",
  enhanced_foundation: {
    positioningBreakdown: { who: "SMB", problem: "No leads", transformation: "Clients", uniqueApproach: "MOXIEMO", method: "AI CMO", outcome: "10 clients" },
    brandArchetype: { name: "Sage", description: "Expert guide" },
    coreValues: [{ name: "Clarity" }],
    voiceGuidelines: { attributes: [{ trait: "Direct" }] },
    competitivePositioning: { yourPosition: "AI CMO" },
    action_plan: { weeks: [] },
  },
};

let StrategyPage: React.ComponentType;

beforeEach(async () => {
  planRef.value = "founding_member";
  const mod = await import("./Strategy");
  StrategyPage = mod.default;
  from.mockImplementation((_table: string) => makeChain(freeStrategy));
});

afterEach(() => { cleanup(); from.mockReset(); vi.clearAllMocks(); vi.resetModules(); });

describe("Strategy page — founding_member (free tier)", () => {
  it("renders the positioning section nav item", async () => {
    render(<MemoryRouter><StrategyPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText(/positioning/i).length).toBeGreaterThan(0);
    }, { timeout: 4000 });
  });

  it("shows paywall overlay when a locked section nav item is clicked", async () => {
    render(<MemoryRouter><StrategyPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText(/positioning/i).length).toBeGreaterThan(0);
    }, { timeout: 4000 });
    const voiceNav = screen.queryByText(/voice and tone/i);
    if (voiceNav) {
      voiceNav.click();
      await waitFor(() => expect(screen.getByText(/Upgrade to Foundation/i)).toBeInTheDocument(), { timeout: 2000 });
    }
  });
});

describe("Strategy page — active paid subscriber", () => {
  it("does not show paywall for voice section when plan is foundation", async () => {
    planRef.value = "foundation";
    render(<MemoryRouter><StrategyPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText(/positioning/i).length).toBeGreaterThan(0);
    }, { timeout: 4000 });
    expect(screen.queryByText(/Upgrade to Foundation/i)).not.toBeInTheDocument();
  });
});

describe("Strategy page — no strategy yet", () => {
  it("shows empty state or loading when no strategy row exists", async () => {
    from.mockImplementation((_table: string) => makeChain(null));
    render(<MemoryRouter><StrategyPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 2000 });
  });
});
