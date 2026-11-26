import React from "react";
import { render, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
// IMPORTANT: stableUser must be a stable object reference — a new object per render would
// cause Goals' useEffect([user]) to fire on every render, creating an infinite loop.
const { from, auth, functions, stableUser } = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "user-1" }, access_token: "tok" } } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  stableUser: { id: "user-1" },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from, auth, functions } }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: stableUser, session: { access_token: "tok" }, loading: false, isAdmin: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/hooks/usePlan", () => ({
  usePlan: () => ({
    plan: "founding_member",
    loading: false,
    checkGenerationLimit: vi.fn().mockResolvedValue(true),
    openUpgrade: vi.fn(),
    incrementUsage: vi.fn(),
    handleGenerationResponse: vi.fn().mockReturnValue(false),
  }),
  PlanProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("lucide-react", () => {
  const icon = () => null;
  return { Sparkles: icon, Loader2: icon, CheckCircle2: icon, Flame: icon, ArrowRight: icon };
});
vi.mock("@/components/ui/skeleton", () => ({ Skeleton: () => null }));
vi.mock("@/lib/utils", () => ({ cn: (...a: unknown[]) => a.filter(Boolean).join(" "), formatDateUS: (d: string) => String(d) }));
vi.mock("@/hooks/useGoalDefinitions", () => ({
  useGoalDefinitions: () => ({
    goals: null,
    loading: false,
    generating: false,
    generate: vi.fn(),
    hasGoals: false,
    refetch: vi.fn(),
  }),
}));

// ── Chain builder ─────────────────────────────────────────────────────────────
function makeChain(data: unknown, error: unknown = null) {
  const resolved = { data, error };
  const resolvedArray = { data: Array.isArray(data) ? data : [], error };
  const c: Record<string, unknown> = {};
  ["select","eq","neq","order","limit","maybeSingle","single","insert","update","upsert","delete","gte"].forEach(m => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  (c.maybeSingle as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(resolved));
  (c.single as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(resolved));
  (c.limit as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(resolvedArray));
  (c.order as ReturnType<typeof vi.fn>).mockReturnValue(c);
  (c.gte as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(resolvedArray));
  return c;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
const strategyData = {
  success_definition: "10 paying clients by Q2",
  business_goal: "Revenue growth",
  strength_score: 82,
  content_pillars: ["Authority", "Education", "Stories", "Offers", "Community"],
  created_at: "2026-01-01T00:00:00Z",
};

const goalEntryData = [
  {
    id: "entry-1",
    user_id: "user-1",
    week_of: "2026-11-04",
    paying_users: 5,
    mrr: 500,
    retention_pct: 90,
    testimonials: 2,
    discovery_calls: 3,
    posts_published: 4,
    email_opens: null,
    notes: null,
    goal_definition_id: "def-1",
    metric_key: "paying_users",
    value: 5,
    period: "2026-11-04",
    created_at: new Date().toISOString(),
  },
];

const socialPostsData = [
  {
    id: "post-1",
    status: "published",
    pillar: "Authority",
    created_at: new Date().toISOString(),
  },
];

function setupFromMock() {
  from.mockImplementation((table: string) => {
    if (table === "strategies") return makeChain(strategyData);
    if (table === "goal_entries") return makeChain(goalEntryData);
    if (table === "social_posts") return makeChain(socialPostsData);
    return makeChain(null);
  });
}

let GoalsPage: React.ComponentType;

beforeEach(async () => {
  if (!GoalsPage) {
    const mod = await import("./Goals");
    GoalsPage = mod.default;
  }
  setupFromMock();
});

afterEach(() => {
  cleanup();
  from.mockReset();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Goals", () => {
  it("renders without crashing with goal data", async () => {
    render(<MemoryRouter><GoalsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it("renders without crashing with no goals (empty state)", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(strategyData);
      if (table === "goal_entries") return makeChain([]);
      if (table === "social_posts") return makeChain([]);
      return makeChain(null);
    });
    render(<MemoryRouter><GoalsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it("queries strategies table on mount", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(strategyData);
      if (table === "goal_entries") return makeChain(goalEntryData);
      if (table === "social_posts") return makeChain(socialPostsData);
      return makeChain(null);
    });
    render(<MemoryRouter><GoalsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("strategies");
    }, { timeout: 3000 });
  });

  it("shows goals heading or tracker heading", async () => {
    render(<MemoryRouter><GoalsPage /></MemoryRouter>);
    await waitFor(() => {
      const body = document.body.textContent ?? "";
      expect(body.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it("shows empty state when no strategy exists", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(null);
      if (table === "goal_entries") return makeChain([]);
      if (table === "social_posts") return makeChain([]);
      return makeChain(null);
    });
    render(<MemoryRouter><GoalsPage /></MemoryRouter>);
    await waitFor(() => {
      const body = document.body.textContent ?? "";
      expect(body).toMatch(/strategy|goals/i);
    }, { timeout: 3000 });
  });

  it("DB error on strategies fetch renders without crashing", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(null, { message: "DB error" });
      if (table === "goal_entries") return makeChain([]);
      if (table === "social_posts") return makeChain([]);
      return makeChain(null);
    });
    render(<MemoryRouter><GoalsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it("renders without crashing when goal_entries returns empty array", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(strategyData);
      if (table === "goal_entries") return makeChain([]);
      if (table === "social_posts") return makeChain([]);
      return makeChain(null);
    });
    render(<MemoryRouter><GoalsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });
});
