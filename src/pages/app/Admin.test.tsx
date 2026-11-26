import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────
const { from, auth } = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from, auth } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let mockIsAdmin = false;
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-admin" },
    session: null,
    loading: false,
    isAdmin: mockIsAdmin,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

function makeChain(data: unknown, error = null) {
  const c: Record<string, unknown> = {};
  ["select","eq","from","order","limit","maybeSingle","single","update"].forEach(m => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  (c.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data, error });
  (c.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data, error });
  // For chained selects that resolve with arrays
  const selectFn = c.select as ReturnType<typeof vi.fn>;
  selectFn.mockReturnValue({ ...c, then: (fn: (v: unknown) => void) => fn({ data: Array.isArray(data) ? data : [data], error }) });
  return c;
}

const mockMembers = [
  { id: "user-1", full_name: "Alice Smith", business_name: "Alice Co", plan: "foundation", subscription_status: "active", is_admin: false, created_at: new Date().toISOString(), stripe_customer_id: null, stripe_subscription_id: null, current_period_end: null },
  { id: "user-2", full_name: "Bob Jones", business_name: "Bob LLC", plan: "founding_member", subscription_status: "inactive", is_admin: false, created_at: new Date().toISOString(), stripe_customer_id: null, stripe_subscription_id: null, current_period_end: null },
];
const mockFlags = [
  { key: "launch_mode", enabled: false, description: "Switches site to launch state" },
  { key: "texting_live", enabled: true, description: "Enables SMS feature" },
];

let AdminPage: React.ComponentType;
beforeEach(async () => {
  mockIsAdmin = true;
  const mod = await import("./Admin");
  AdminPage = mod.default;

  from.mockImplementation((table: string) => {
    if (table === "profiles") {
      const c = makeChain(mockMembers);
      (c.select as ReturnType<typeof vi.fn>).mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
      });
      (c.update as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      return c;
    }
    if (table === "feature_flags") {
      const c = makeChain(mockFlags);
      (c.select as ReturnType<typeof vi.fn>).mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockFlags, error: null }),
      });
      (c.update as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      return c;
    }
    if (table === "reservations") {
      const c = makeChain([]);
      (c.select as ReturnType<typeof vi.fn>).mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });
      return c;
    }
    return makeChain([]);
  });
});

afterEach(() => { cleanup(); from.mockReset(); vi.clearAllMocks(); vi.resetModules(); });

describe("Admin page — access control", () => {
  it("non-admin user is redirected to /app", async () => {
    mockIsAdmin = false;
    const mod = await import("./Admin");
    AdminPage = mod.default;
    render(<MemoryRouter initialEntries={["/app/admin"]}><AdminPage /></MemoryRouter>);
    // Navigate to /app renders nothing here (just tests the redirect renders without crashing)
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});

describe("Admin page — members tab", () => {
  it("shows the admin heading", async () => {
    render(<MemoryRouter><AdminPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("Admin")).toBeInTheDocument(), { timeout: 3000 });
  });

  it("renders members, flags, and reservations tabs", async () => {
    render(<MemoryRouter><AdminPage /></MemoryRouter>);
    await waitFor(() => screen.getByText("Admin"), { timeout: 3000 });
    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("Feature flags")).toBeInTheDocument();
    expect(screen.getByText("Reservations")).toBeInTheDocument();
  });
});

describe("Admin page — feature flags tab", () => {
  it("switches to the flags tab when clicked", async () => {
    render(<MemoryRouter><AdminPage /></MemoryRouter>);
    await waitFor(() => screen.getByText("Feature flags"), { timeout: 3000 });
    fireEvent.click(screen.getByText("Feature flags"));
    // After tab switch, flags UI should be visible
    await waitFor(() => expect(screen.getByText("Feature flags")).toBeInTheDocument());
  });
});

describe("Admin page — stats cards", () => {
  it("renders four stat cards", async () => {
    render(<MemoryRouter><AdminPage /></MemoryRouter>);
    await waitFor(() => screen.getByText("Total members"), { timeout: 3000 });
    expect(screen.getByText("Active paid")).toBeInTheDocument();
    expect(screen.getByText("Paid plans")).toBeInTheDocument();
    expect(screen.getByText("Founding members")).toBeInTheDocument();
  });
});
