import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
vi.mock("@/lib/ctaVariant", () => ({
  getCtaLabel: vi.fn(() => "Get started"),
  trackCtaClick: vi.fn(),
  getCtaVariant: vi.fn(() => "seat"),
}));

vi.mock("@/components/SiteHeader", () => ({ SiteHeader: () => null }));
vi.mock("@/components/SiteFooter", () => ({ SiteFooter: () => null }));
vi.mock("@/components/MoxieAvatar", () => ({ MoxieAvatar: () => null }));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import Pricing from "./Pricing";
import { plans, pricingFaqs, getPlanPrice, formatPrice } from "./pricingData";

function renderPricing() {
  return render(
    <MemoryRouter>
      <Pricing />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Pricing page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ---- Positive ----------------------------------------------------------

  it("renders without crashing", () => {
    renderPricing();
    // Page hero heading should be present
    expect(screen.getByText(/Simple pricing/i)).toBeInTheDocument();
  });

  it("shows Monthly and Annual billing tabs", () => {
    renderPricing();
    expect(screen.getByRole("button", { name: /Monthly/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Annual/i })).toBeInTheDocument();
  });

  it("plan names appear from pricingData", () => {
    renderPricing();
    for (const plan of plans) {
      // Plan names are rendered as uppercase mono text; getByText with regex
      expect(screen.getAllByText(new RegExp(plan.name, "i")).length).toBeGreaterThan(0);
    }
  });

  it("monthly prices are shown by default", () => {
    renderPricing();
    for (const plan of plans) {
      const { first100 } = getPlanPrice(plan, "monthly");
      const priceText = formatPrice(first100);
      expect(screen.getAllByText(new RegExp(priceText.replace("$", "\\$"), "")).length).toBeGreaterThan(0);
    }
  });

  it("switching to Annual shows annual founding prices", () => {
    renderPricing();
    const annualBtn = screen.getByRole("button", { name: /Annual/i });
    fireEvent.click(annualBtn);
    for (const plan of plans) {
      const { first100 } = getPlanPrice(plan, "annual");
      const priceText = formatPrice(first100);
      expect(screen.getAllByText(new RegExp(priceText.replace("$", "\\$"), "")).length).toBeGreaterThan(0);
    }
  });

  it("FAQ section renders with at least one question", () => {
    renderPricing();
    expect(pricingFaqs.length).toBeGreaterThan(0);
    // The first FAQ question text should appear somewhere on the page
    expect(screen.getByText(pricingFaqs[0].q)).toBeInTheDocument();
  });

  it("founding member offer section is visible", () => {
    renderPricing();
    // "50% OFF FOR LIFE" appears in both the marquee and the beta section heading;
    // "founding members" appears in the h2 and in the paragraph below it.
    // Use getAllByText for both since the content is intentionally duplicated.
    expect(screen.getAllByText(/50% off for life/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/founding members/i).length).toBeGreaterThan(0);
  });

  // ---- Negative ----------------------------------------------------------

  it("switching to annual billing shows different prices than monthly", () => {
    renderPricing();
    // Collect all text before switching
    const monthlyBtn = screen.getByRole("button", { name: /Monthly/i });
    const annualBtn = screen.getByRole("button", { name: /Annual/i });

    // Start on monthly (default) — grab a plan's monthly founding price
    const samplePlan = plans[0];
    const { first100: monthlyFirst100 } = getPlanPrice(samplePlan, "monthly");
    const { first100: annualFirst100 } = getPlanPrice(samplePlan, "annual");

    // The two values must differ
    expect(monthlyFirst100).not.toBe(annualFirst100);

    // After clicking annual the annual price should appear
    fireEvent.click(annualBtn);
    const annualText = formatPrice(annualFirst100);
    expect(screen.getAllByText(new RegExp(annualText.replace("$", "\\$"), "")).length).toBeGreaterThan(0);

    // After clicking back to monthly the monthly price should appear
    fireEvent.click(monthlyBtn);
    const monthlyText = formatPrice(monthlyFirst100);
    expect(screen.getAllByText(new RegExp(monthlyText.replace("$", "\\$"), "")).length).toBeGreaterThan(0);
  });
});
