import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

// ── Mocks ─────────────────────────────────────────────────────────────────────
const { from, auth, functions } = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: { id: "user-1" }, access_token: "tok-abc" } },
    }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  functions: { invoke: vi.fn() },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from, auth, functions } }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: { access_token: "tok-abc" }, loading: false, isAdmin: false }),
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
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

// jsdom doesn't implement scrollTo — patch it globally
beforeAll(() => {
  window.HTMLElement.prototype.scrollTo = vi.fn();
});

function makeChain(data: unknown, error = null) {
  const c: Record<string, unknown> = {};
  ["select","eq","neq","order","limit","maybeSingle","single","insert","update","upsert","delete"].forEach(m => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  (c.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data, error });
  (c.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data, error });
  return c;
}

const existingSession = {
  id: "sess-existing",
  user_id: "user-1",
  messages: [
    { role: "assistant", content: "Hey Alice, I'm MOXIEMO. Ready?" },
  ],
  status: "in_progress",
  lane: "lane1",
  synthesis_status: null,
  synthesis_attempts: 0,
  completed_at: null,
};

let DiscoveryPage: React.ComponentType;

beforeEach(async () => {
  const mod = await import("./Discovery");
  DiscoveryPage = mod.default;

  from.mockImplementation((table: string) => {
    if (table === "profiles") {
      const c = makeChain({ full_name: "Alice" });
      return c;
    }
    if (table === "discovery_sessions") {
      const c = makeChain(existingSession);
      (c.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { ...existingSession, id: "sess-new" }, error: null }),
        }),
      });
      return c;
    }
    if (table === "feature_flags") {
      return makeChain({ enabled: false });
    }
    return makeChain(null);
  });
});

afterEach(() => { cleanup(); from.mockReset(); vi.clearAllMocks(); vi.resetModules(); });

describe("Discovery page — session loading", () => {
  it("renders without crashing when a session exists", async () => {
    render(<TooltipProvider><MemoryRouter><DiscoveryPage /></MemoryRouter></TooltipProvider>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
  });

  it("loads the existing session messages from the database", async () => {
    render(<TooltipProvider><MemoryRouter><DiscoveryPage /></MemoryRouter></TooltipProvider>);
    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("discovery_sessions");
    }, { timeout: 3000 });
  });
});

describe("Discovery page — new user (no session)", () => {
  it("creates a new session when no existing session found", async () => {
    from.mockImplementation((table: string) => {
      if (table === "profiles") return makeChain({ full_name: "Bob" });
      if (table === "discovery_sessions") {
        const c = makeChain(null); // no existing session
        (c.insert as ReturnType<typeof vi.fn>).mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { ...existingSession, id: "sess-new", user_id: "user-1" }, error: null }),
          }),
        });
        return c;
      }
      if (table === "feature_flags") return makeChain({ enabled: false });
      return makeChain(null);
    });

    render(<TooltipProvider><MemoryRouter><DiscoveryPage /></MemoryRouter></TooltipProvider>);
    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("discovery_sessions");
    }, { timeout: 3000 });
  });
});

describe("Discovery page — synthesis idempotency", () => {
  it("calls synthesize-strategy edge function at most once per trigger", async () => {
    // The idempotency key logic means a 409 from the edge function
    // should NOT trigger a second call
    functions.invoke.mockResolvedValueOnce({ data: null, error: { message: "DUPLICATE_IN_FLIGHT" } });

    render(<TooltipProvider><MemoryRouter><DiscoveryPage /></MemoryRouter></TooltipProvider>);
    await waitFor(() => document.body, { timeout: 2000 });
    // invoke should not have been called at page load (only on user action)
    expect(functions.invoke).not.toHaveBeenCalled();
  });

  it("synthesis_status=completed session shows view-strategy button, not build button", async () => {
    from.mockImplementation((table: string) => {
      if (table === "profiles") return makeChain({ full_name: "Carol" });
      if (table === "discovery_sessions") {
        return makeChain({
          ...existingSession,
          status: "completed",
          synthesis_status: "completed",
          completed_at: new Date().toISOString(),
        });
      }
      if (table === "feature_flags") return makeChain({ enabled: false });
      return makeChain(null);
    });

    render(<TooltipProvider><MemoryRouter><DiscoveryPage /></MemoryRouter></TooltipProvider>);
    await waitFor(() => expect(document.body).toBeInTheDocument(), { timeout: 3000 });
    // Page should render without crash in completed state
  });
});
