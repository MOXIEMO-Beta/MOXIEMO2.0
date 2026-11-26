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
  (c as any).then = (fn: any) => Promise.resolve({ data, error }).then(fn);
  return c;
}

function makeArrayChain(data: unknown[], error = null) {
  const c = makeChain(data, error);
  (c.order as any).mockResolvedValue({ data, error });
  (c.limit as any).mockResolvedValue({ data, error });
  return c;
}

const mockPost = {
  id: "post-1",
  platforms: ["linkedin"],
  content_by_platform: { linkedin: "Hello LinkedIn" },
  status: "pending_approval",
  scheduled_at: null,
  topic: "Test topic",
};
const mockConnection = {
  id: "conn-1",
  platform: "linkedin",
  profile_name: "Alice Smith",
  connection_type: "personal",
  expires_at: null,
};

import Social from "./Social";

describe("Social page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    from.mockReset();
  });

  it("1. renders without crashing with pending posts", async () => {
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeArrayChain([mockPost]);
      if (table === "social_connections") return makeArrayChain([mockConnection]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><Social /></MemoryRouter>);
    await waitFor(() => expect(from).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("2. renders without crashing with no posts (empty state)", async () => {
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeArrayChain([]);
      if (table === "social_connections") return makeArrayChain([]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><Social /></MemoryRouter>);
    await waitFor(() => expect(from).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("3. queries social_posts on mount", async () => {
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeArrayChain([mockPost]);
      if (table === "social_connections") return makeArrayChain([mockConnection]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><Social /></MemoryRouter>);
    await waitFor(() => {
      const calls = (from as any).mock.calls.map((c: string[]) => c[0]);
      expect(calls).toContain("social_posts");
    }, { timeout: 3000 });
  });

  it("4. queries social_connections on mount", async () => {
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeArrayChain([mockPost]);
      if (table === "social_connections") return makeArrayChain([mockConnection]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><Social /></MemoryRouter>);
    await waitFor(() => {
      const calls = (from as any).mock.calls.map((c: string[]) => c[0]);
      expect(calls).toContain("social_connections");
    }, { timeout: 3000 });
  });

  it("5. shows post status pill when posts exist", async () => {
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeArrayChain([mockPost]);
      if (table === "social_connections") return makeArrayChain([mockConnection]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><Social /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Needs approval")).toBeTruthy();
    }, { timeout: 3000 });
  });

  it("6. DB error on social_posts fetch renders without crashing", async () => {
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeArrayChain([], { message: "db error" } as any);
      if (table === "social_connections") return makeArrayChain([mockConnection]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><Social /></MemoryRouter>);
    await waitFor(() => expect(from).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("7. post with null content_by_platform renders without crashing", async () => {
    const nullContentPost = { ...mockPost, content_by_platform: null };
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeArrayChain([nullContentPost]);
      if (table === "social_connections") return makeArrayChain([mockConnection]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><Social /></MemoryRouter>);
    await waitFor(() => expect(from).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("8. post with null platforms array renders without crashing", async () => {
    const nullPlatformsPost = { ...mockPost, platforms: null };
    from.mockImplementation((table: string) => {
      if (table === "social_posts") return makeArrayChain([nullPlatformsPost]);
      if (table === "social_connections") return makeArrayChain([mockConnection]);
      return makeArrayChain([]);
    });
    render(<MemoryRouter><Social /></MemoryRouter>);
    await waitFor(() => expect(from).toHaveBeenCalled(), { timeout: 3000 });
  });
});
