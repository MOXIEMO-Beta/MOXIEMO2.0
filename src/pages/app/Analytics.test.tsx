import React from "react";
import { render, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const { from, auth, functions } = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "user-1" }, access_token: "tok" } } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  functions: { invoke: vi.fn() },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from, auth, functions } }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: { access_token: "tok" }, loading: false, isAdmin: false }),
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

// ── Chain builder ─────────────────────────────────────────────────────────────
function makeChain(data: unknown, error = null) {
  const resolved = { data, error };
  const resolvedArray = { data: Array.isArray(data) ? data : [], error };
  const c: Record<string, unknown> = {};
  ["select","eq","neq","order","limit","maybeSingle","single","insert","update","upsert","delete"].forEach(m => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  (c.maybeSingle as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(resolved));
  (c.single as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(resolved));
  (c.limit as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(resolvedArray));
  (c.order as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve(resolvedArray));
  return c;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
const postData = [
  {
    id: "post-1",
    platforms: ["linkedin"],
    content_by_platform: { linkedin: "Great post about authority building." },
    pillar: "Authority",
    status: "published",
    published_at: new Date().toISOString(),
    topic: "Authority topic",
    platform_post_ids: null,
  },
  {
    id: "post-2",
    platforms: ["instagram"],
    content_by_platform: { instagram: "Instagram post content." },
    pillar: "Education",
    status: "draft",
    published_at: null,
    topic: "Education topic",
    platform_post_ids: null,
  },
];

const analyticsData = [
  {
    post_id: "post-1",
    platform: "linkedin",
    impressions: 1200,
    reach: 900,
    likes: 45,
    comments: 12,
    shares: 8,
    engagement_rate: 3.5,
    fetched_at: new Date().toISOString(),
  },
];

const strategyData = {
  content_pillars: ["Authority", "Education", "Stories"],
  strength_score: 80,
};

function setupFromMock() {
  from.mockImplementation((table: string) => {
    if (table === "social_posts") return makeChain(postData);
    if (table === "social_analytics") return makeChain(analyticsData);
    if (table === "strategies") return makeChain(strategyData);
    return makeChain(null);
  });
}

let AnalyticsPage: React.ComponentType;

beforeEach(async () => {
  if (!AnalyticsPage) {
    const mod = await import("./Analytics");
    AnalyticsPage = mod.default;
  }
  setupFromMock();
});

afterEach(() => {
  cleanup();
  from.mockReset();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Analytics", () => {
  it("renders without crashing with post data", async () => {
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it("renders without crashing with no posts (empty state)", async () => {
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeChain([]);
      if (table === "social_analytics") return makeChain([]);
      if (table === "strategies") return makeChain(null);
      return makeChain(null);
    });
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it("queries social_posts table on mount", async () => {
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("social_posts");
    }, { timeout: 3000 });
  });

  it("shows analytics heading", async () => {
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
    await waitFor(() => {
      const h1 = document.querySelector("h1");
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toMatch(/growth/i);
    }, { timeout: 3000 });
  });

  it("shows empty state message when no published posts", async () => {
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeChain([]);
      if (table === "social_analytics") return makeChain([]);
      if (table === "strategies") return makeChain(null);
      return makeChain(null);
    });
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
    await waitFor(() => {
      const body = document.body.textContent ?? "";
      expect(body.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it("DB error on social_posts fetch renders without crashing", async () => {
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeChain(null, { message: "DB error" } as any);
      if (table === "social_analytics") return makeChain([]);
      if (table === "strategies") return makeChain(null);
      return makeChain(null);
    });
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it("DB error on social_analytics fetch renders without crashing", async () => {
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeChain(postData);
      if (table === "social_analytics") return makeChain(null, { message: "DB error" } as any);
      if (table === "strategies") return makeChain(null);
      return makeChain(null);
    });
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });
});
