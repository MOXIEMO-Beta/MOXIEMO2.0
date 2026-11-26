import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoxieChatCard } from "./MoxieChatCard";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke } },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

afterEach(() => { cleanup(); invoke.mockReset(); vi.clearAllMocks(); });

describe("MoxieChatCard — bubble list", () => {
  it("renders exactly 5 visible bubbles (bubbles 1 and 3 are hidden pre-launch)", () => {
    render(<MoxieChatCard />);
    // visible bubbles: 2,4,5,6,7 → 5 items
    const buttons = screen.getAllByRole("listitem");
    expect(buttons).toHaveLength(5);
  });

  it("shows the opening MOXIE greeting", () => {
    render(<MoxieChatCard />);
    expect(screen.getByText(/I'm MOXIE/i)).toBeInTheDocument();
  });

  it("clicking 'Hold a spot for me' shows the reservation form", async () => {
    render(<MoxieChatCard />);
    fireEvent.click(screen.getByText("Hold a spot for me"));
    await waitFor(() => expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument());
  });

  it("clicking 'Common questions' shows FAQ items", async () => {
    render(<MoxieChatCard />);
    fireEvent.click(screen.getByText("Common questions"));
    await waitFor(() => expect(screen.getByText("Is this for my industry?")).toBeInTheDocument());
  });

  it("clicking 'Walk me through how it works' shows 5 loop steps", async () => {
    render(<MoxieChatCard />);
    fireEvent.click(screen.getByText("Walk me through how it works"));
    await waitFor(() => expect(screen.getByText(/1\. Discovery/i)).toBeInTheDocument());
    expect(screen.getByText(/5\. Grow/i)).toBeInTheDocument();
  });

  it("clicking '← Back to questions' returns to bubble list", async () => {
    render(<MoxieChatCard />);
    fireEvent.click(screen.getByText("Common questions"));
    await waitFor(() => screen.getByText("← Back to questions"));
    fireEvent.click(screen.getByText("← Back to questions"));
    expect(screen.getByText("Hold a spot for me")).toBeInTheDocument();
  });
});

describe("MoxieChatCard — HoldSpotCard form", () => {
  it("shows validation error when email is blank", async () => {
    const { toast } = await import("sonner");
    render(<MoxieChatCard />);
    fireEvent.click(screen.getByText("Hold a spot for me"));
    await waitFor(() => screen.getByText("Hold my spot →"));
    fireEvent.click(screen.getByText("Hold my spot →"));
    expect(toast.error).toHaveBeenCalledWith("Enter a valid email.");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("submits to reserve-spot edge function with correct payload", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    render(<MoxieChatCard />);
    fireEvent.click(screen.getByText("Hold a spot for me"));
    await waitFor(() => screen.getByPlaceholderText("you@example.com"));

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText("Hold my spot →"));

    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith("reserve-spot", {
        body: expect.objectContaining({ email: "test@example.com" }),
      })
    );
  });

  it("shows success state after successful reservation", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    render(<MoxieChatCard />);
    fireEvent.click(screen.getByText("Hold a spot for me"));
    await waitFor(() => screen.getByPlaceholderText("you@example.com"));

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "founder@test.com" } });
    fireEvent.click(screen.getByText("Hold my spot →"));

    await waitFor(() => expect(screen.getByText("Spot reserved.")).toBeInTheDocument());
  });

  it("shows error toast when edge function returns an error", async () => {
    invoke.mockResolvedValue({ data: { error: "Already reserved" }, error: null });
    const { toast } = await import("sonner");
    render(<MoxieChatCard />);
    fireEvent.click(screen.getByText("Hold a spot for me"));
    await waitFor(() => screen.getByPlaceholderText("you@example.com"));

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "x@y.com" } });
    fireEvent.click(screen.getByText("Hold my spot →"));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Already reserved"));
  });

  it("renders all 4 session date options in the session picker", async () => {
    render(<MoxieChatCard />);
    fireEvent.click(screen.getByText("Hold a spot for me"));
    await waitFor(() => screen.getByText(/December 2, 2026/));
    expect(screen.getByText(/December 4, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/December 9, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/December 11, 2026/)).toBeInTheDocument();
  });
});
