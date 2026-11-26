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

let useAuthMock = { user: { id: "user-1" }, session: { access_token: "tok" }, loading: false, isAdmin: false };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => useAuthMock,
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

vi.mock("@/components/media/MediaLibrary", () => ({
  default: ({ userId, mode }: any) => (
    <div data-testid="media-library" data-user={userId} data-mode={mode}>MediaLibrary</div>
  ),
}));

import Media from "./Media";

describe("Media page", () => {
  beforeEach(() => {
    useAuthMock = { user: { id: "user-1" }, session: { access_token: "tok" }, loading: false, isAdmin: false };
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    from.mockReset();
  });

  it("1. renders MediaLibrary with userId from useAuth", async () => {
    render(<MemoryRouter><Media /></MemoryRouter>);
    await waitFor(() => {
      const el = screen.getByTestId("media-library");
      expect(el.getAttribute("data-user")).toBe("user-1");
    }, { timeout: 3000 });
  });

  it("2. renders MediaLibrary with mode='page'", async () => {
    render(<MemoryRouter><Media /></MemoryRouter>);
    await waitFor(() => {
      const el = screen.getByTestId("media-library");
      expect(el.getAttribute("data-mode")).toBe("page");
    }, { timeout: 3000 });
  });

  it("3. renders without crashing when user is null (userId becomes null)", async () => {
    useAuthMock = { user: null as any, session: null as any, loading: false, isAdmin: false };
    render(<MemoryRouter><Media /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByTestId("media-library")).toBeTruthy();
    }, { timeout: 3000 });
  });

  it("4. null user passes null userId to MediaLibrary (does not crash)", async () => {
    useAuthMock = { user: null as any, session: null as any, loading: false, isAdmin: false };
    render(<MemoryRouter><Media /></MemoryRouter>);
    await waitFor(() => {
      const el = screen.getByTestId("media-library");
      expect(el.getAttribute("data-user")).toBeNull();
    }, { timeout: 3000 });
  });
});
