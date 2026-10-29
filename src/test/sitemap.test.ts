import { readFileSync } from "node:fs";

it("includes all twelve public blog routes and excludes the legacy Why redirect", () => {
  const sitemap = readFileSync("public/sitemap.xml", "utf8");
  const app = readFileSync("src/App.tsx", "utf8");
  const blogPaths = [...app.matchAll(/path="(\/blog\/[^"\s]+)"/g)].map((match) => match[1]);
  expect(blogPaths).toHaveLength(12);
  for (const path of blogPaths) expect(sitemap).toContain(`<loc>https://buildwithmoxiemo.com${path}</loc>`);
  expect(sitemap).not.toContain("<loc>https://buildwithmoxiemo.com/why-moxie</loc>");
  expect(sitemap).toContain("<loc>https://buildwithmoxiemo.com/why-moxiemo</loc>");
});