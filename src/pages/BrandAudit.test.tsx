import { render, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BrandAudit from "./BrandAudit";
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));
vi.mock("@/components/SiteHeader", () => ({ SiteHeader: () => null }));
vi.mock("@/components/SiteFooter", () => ({ SiteFooter: () => null }));
afterEach(() => { cleanup(); invoke.mockReset(); });
it("starts the existing assessment with the site query value", async () => {
  invoke.mockResolvedValue({ data: { brand_name: "Example" }, error: null });
  const view = render(<MemoryRouter initialEntries={["/brand-audit?site=example.com&entry=start"]}><BrandAudit /></MemoryRouter>);
  await waitFor(() => expect(invoke).toHaveBeenCalledWith("scrape-initial", { body: { url: "example.com" } }));
  await waitFor(() => expect(view.getByText("Here is what we found. Edit anything that is off.")).toBeInTheDocument());
  expect(invoke).toHaveBeenCalledTimes(1);
});
it("leaves normal and blank-query visits at the existing website form", () => {
  const view = render(<MemoryRouter initialEntries={["/brand-audit?site="]}><BrandAudit /></MemoryRouter>);
  expect(view.getByPlaceholderText("https://yourbrand.com")).toHaveValue("");
  expect(invoke).not.toHaveBeenCalled();
});
