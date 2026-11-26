import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
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

vi.mock("@/components/calendar/CampaignCalendarTab", () => ({ default: () => <div>CampaignCalendarTab</div> }));
vi.mock("@/components/calendar/CampaignsTab", () => ({ default: () => <div>CampaignsTab</div> }));
vi.mock("@/components/calendar/IdeasTab", () => ({ default: () => <div>IdeasTab</div> }));
vi.mock("@/components/calendar/StartCampaignTab", () => ({ default: () => <div>StartCampaignTab</div>, CampaignWizardModal: () => null }));
vi.mock("@/lib/seedLaunchCampaign", () => ({ seedLaunchCampaign: vi.fn().mockResolvedValue(undefined) }));

import CalendarPage from "./Calendar";

function makeChain(data: unknown, error = null) {
  const c: Record<string, unknown> = {};
  ["select","eq","neq","order","limit","maybeSingle","single","insert","update","upsert","delete","ilike"].forEach(m => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  (c.maybeSingle as any).mockResolvedValue({ data, error });
  (c.single as any).mockResolvedValue({ data, error });
  (c.order as any).mockResolvedValue({ data: Array.isArray(data) ? data : [], error });
  (c.limit as any).mockResolvedValue({ data: Array.isArray(data) ? data : [], error });
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
  enhanced_foundation: { launchCampaignSeeded: true },
};

const mockPost = {
  id: "post-1",
  platforms: ["linkedin"],
  content_by_platform: { linkedin: "Hello LinkedIn" },
  status: "pending_approval",
  scheduled_at: null,
};

function setupDefaultMocks() {
  from.mockImplementation((table: string) => {
    if (table === "strategies") return makeChain(mockStrategy);
    if (table === "social_posts") return makeArrayChain([mockPost]);
    if (table === "content_items") return makeArrayChain([]);
    if (table === "email_sends") return makeArrayChain([]);
    if (table === "campaigns") return makeArrayChain([]);
    if (table === "social_connections") return makeArrayChain([]);
    if (table === "subscribers") return makeArrayChain([]);
    if (table === "calendar_ideas") return makeArrayChain([]);
    if (table === "campaign_execution_items") return makeArrayChain([]);
    return makeArrayChain([]);
  });
}

describe("Calendar page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    from.mockReset();
  });

  it("1. renders without crashing", async () => {
    setupDefaultMocks();
    render(<MemoryRouter><CalendarPage /></MemoryRouter>);
    await waitFor(() => expect(from).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("2. shows tab navigation with 'Start a Campaign' tab visible", async () => {
    setupDefaultMocks();
    render(<MemoryRouter><CalendarPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText("Start a Campaign").length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it("3. clicking 'Campaign Calendar' tab switches content", async () => {
    setupDefaultMocks();
    render(<MemoryRouter><CalendarPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText("Campaign Calendar").length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    fireEvent.click(screen.getAllByText("Campaign Calendar")[0]);
    await waitFor(() => {
      expect(screen.getByText("CampaignCalendarTab")).toBeTruthy();
    }, { timeout: 3000 });
  });

  it("4. queries strategies on mount", async () => {
    setupDefaultMocks();
    render(<MemoryRouter><CalendarPage /></MemoryRouter>);
    await waitFor(() => {
      const calls = (from as any).mock.calls.map((c: string[]) => c[0]);
      expect(calls).toContain("strategies");
    }, { timeout: 3000 });
  });

  it("5. queries social_posts on mount", async () => {
    setupDefaultMocks();
    render(<MemoryRouter><CalendarPage /></MemoryRouter>);
    await waitFor(() => {
      const calls = (from as any).mock.calls.map((c: string[]) => c[0]);
      expect(calls).toContain("social_posts");
    }, { timeout: 3000 });
  });

  it("6. DB error on strategies fetch renders without crashing", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(null, { message: "db error" } as any);
      if (table === "social_posts") return makeArrayChain([mockPost]);
      if (table === "content_items") return makeArrayChain([]);
      if (table === "email_sends") return makeArrayChain([]);
      if (table === "campaigns") return makeArrayChain([]);
      if (table === "social_connections") return makeArrayChain([]);
      if (table === "subscribers") return makeArrayChain([]);
      if (table === "calendar_ideas") return makeArrayChain([]);
      if (table === "campaign_execution_items") return makeArrayChain([]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><CalendarPage /></MemoryRouter>);
    await waitFor(() => expect(from).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("7. DB error on social_posts fetch renders without crashing", async () => {
    from.mockImplementation((table: string) => {
      if (table === "strategies") return makeChain(mockStrategy);
      if (table === "social_posts") return makeArrayChain([], { message: "db error" } as any);
      if (table === "content_items") return makeArrayChain([]);
      if (table === "email_sends") return makeArrayChain([]);
      if (table === "campaigns") return makeArrayChain([]);
      if (table === "social_connections") return makeArrayChain([]);
      if (table === "subscribers") return makeArrayChain([]);
      if (table === "calendar_ideas") return makeArrayChain([]);
      if (table === "campaign_execution_items") return makeArrayChain([]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><CalendarPage /></MemoryRouter>);
    await waitFor(() => expect(from).toHaveBeenCalled(), { timeout: 3000 });
  });
});
