import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const { from, auth, functions, storage } = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "user-1" }, access_token: "tok" } } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  functions: { invoke: vi.fn() },
  storage: { from: vi.fn().mockReturnValue({ upload: vi.fn().mockResolvedValue({ data: { path: "test.jpg" }, error: null }), getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/test.jpg" } }) }) },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from, auth, functions, storage } }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: { access_token: "tok" }, loading: false, isAdmin: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/hooks/usePlan", () => ({
  usePlan: () => ({ plan: "founding_member", loading: false, checkGenerationLimit: vi.fn().mockResolvedValue(true), openUpgrade: vi.fn(), incrementUsage: vi.fn(), handleGenerationResponse: vi.fn().mockReturnValue(false) }),
  PlanProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn(), useSearchParams: () => [new URLSearchParams(), vi.fn()] };
});

function makeChain(data: unknown, error = null) {
  const c: Record<string, unknown> = {};
  ["select","eq","neq","order","limit","maybeSingle","single","insert","update","upsert","delete","ilike"].forEach(m => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  (c.maybeSingle as any).mockResolvedValue({ data, error });
  (c.single as any).mockResolvedValue({ data, error });
  (c.order as any).mockResolvedValue({ data: Array.isArray(data) ? data : [], error });
  (c.limit as any).mockResolvedValue({ data: Array.isArray(data) ? data : [], error });
  // Make chain itself awaitable — resolves when used as `await supabase.from("x").select().eq()`
  (c as any).then = (fn: any) => Promise.resolve({ data, error }).then(fn);
  return c;
}

function makeArrayChain(data: unknown[], error = null) {
  const c = makeChain(data, error);
  (c.order as any).mockResolvedValue({ data, error });
  (c.limit as any).mockResolvedValue({ data, error });
  return c;
}

const mockStrategy = {
  id: "strat-1",
  user_id: "user-1",
  positioning_statement: "We help small businesses grow.",
  brand_voice: "Friendly and direct",
  content_pillars: ["Thought Leadership", "Client Stories"],
  enhanced_foundation: { launchCampaignSeeded: true },
  primary_goal: "Lead generation",
  target_audience: "Small business owners",
  avoid_phrases: [],
};

const mockProfile = {
  full_name: "Alice Smith",
  business_name: "Alice Co",
  business_type: "Consulting",
  location: "New York",
  website_url: "https://alice.co",
};

import BrandHub from "./BrandHub";

describe("BrandHub page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    from.mockReset();
  });

  it("1. renders without crashing with strategy data", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(mockStrategy);
      if (table === "profiles") return makeChain(mockProfile);
      if (table === "social_connections") return makeArrayChain([]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><BrandHub /></MemoryRouter>);
    await waitFor(() => expect(from).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("2. renders without crashing with no strategy (empty state)", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(null);
      if (table === "profiles") return makeChain(mockProfile);
      if (table === "social_connections") return makeArrayChain([]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><BrandHub /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/No strategy yet/i)).toBeTruthy();
    }, { timeout: 3000 });
  });

  it("3. queries strategies on mount", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(mockStrategy);
      if (table === "profiles") return makeChain(mockProfile);
      if (table === "social_connections") return makeArrayChain([]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><BrandHub /></MemoryRouter>);
    await waitFor(() => {
      const calls = (from as any).mock.calls.map((c: string[]) => c[0]);
      expect(calls).toContain("strategies");
    }, { timeout: 3000 });
  });

  it("4. queries profiles on mount", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(mockStrategy);
      if (table === "profiles") return makeChain(mockProfile);
      if (table === "social_connections") return makeArrayChain([]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><BrandHub /></MemoryRouter>);
    await waitFor(() => {
      const calls = (from as any).mock.calls.map((c: string[]) => c[0]);
      expect(calls).toContain("profiles");
    }, { timeout: 3000 });
  });

  it("5. shows Brand Hub heading when strategy loaded", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(mockStrategy);
      if (table === "profiles") return makeChain(mockProfile);
      if (table === "social_connections") return makeArrayChain([]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><BrandHub /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText(/Brand Hub/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it("6. DB error on strategies fetch renders without crashing", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(null, { message: "db error" } as any);
      if (table === "profiles") return makeChain(mockProfile);
      if (table === "social_connections") return makeArrayChain([]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><BrandHub /></MemoryRouter>);
    await waitFor(() => expect(from).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("7. strategy with null enhanced_foundation renders without crashing", async () => {
    const stratNoFoundation = { ...mockStrategy, enhanced_foundation: null };
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(stratNoFoundation);
      if (table === "profiles") return makeChain(mockProfile);
      if (table === "social_connections") return makeArrayChain([]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><BrandHub /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText(/Brand Hub/i).length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it("8. strategy with null content_pillars renders without crashing", async () => {
    const stratNoPillars = { ...mockStrategy, content_pillars: null };
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(stratNoPillars);
      if (table === "profiles") return makeChain(mockProfile);
      if (table === "social_connections") return makeArrayChain([]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><BrandHub /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText(/Brand Hub/i).length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });
});
