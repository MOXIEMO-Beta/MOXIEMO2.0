import { act, render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { RouteMetadata } from "./RouteMetadata";

it("removes route metadata and Article data and restores the next route's fallback", async () => {
  document.title = "Original route";
  const fallback = document.createElement("meta");
  fallback.name = "description";
  fallback.content = "Original route description";
  document.head.appendChild(fallback);
  const { unmount } = render(<HelmetProvider><RouteMetadata title="Comparison route" description="Comparison details" canonicalPath="/compare/claude" articleHeadline="Comparison" /></HelmetProvider>);
  await waitFor(() => expect(document.title).toBe("Comparison route"));
  expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  expect(document.head.querySelectorAll('script[data-article-jsonld]')).toHaveLength(1);
  act(() => unmount());
  await waitFor(() => expect(document.head.querySelectorAll('script[data-article-jsonld]')).toHaveLength(0));
  expect(document.title).toBe("Original route");
  expect(document.head.querySelector('meta[name="description"]')).toBe(fallback);
  fallback.remove();
});