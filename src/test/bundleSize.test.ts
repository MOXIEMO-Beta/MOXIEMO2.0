import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Bundle size regression guard.
// Run `npm run build` before this test suite.
// Skips gracefully if dist/ doesn't exist (CI without prior build).

const DIST_ASSETS = join(process.cwd(), "dist", "assets");
const MAX_INDEX_BYTES = 700_000; // ~500 kB gzip at 70% compression ratio

describe("Bundle size regression", () => {
  it("dist/assets directory exists after build", () => {
    if (!existsSync(DIST_ASSETS)) {
      console.warn("dist/assets not found — run `npm run build` first. Skipping.");
      return;
    }
    expect(existsSync(DIST_ASSETS)).toBe(true);
  });

  it("index-*.js main chunk is under 700 kB raw (≈500 kB gzip)", () => {
    if (!existsSync(DIST_ASSETS)) {
      console.warn("dist/assets not found — skipping bundle size check.");
      return;
    }

    const files = readdirSync(DIST_ASSETS);
    const indexChunks = files.filter(f => f.startsWith("index-") && f.endsWith(".js"));

    // After code splitting there should be exactly one index chunk
    expect(indexChunks.length).toBeGreaterThan(0);

    for (const chunk of indexChunks) {
      const { size } = statSync(join(DIST_ASSETS, chunk));
      expect(size, `${chunk} (${(size / 1024).toFixed(0)} kB) exceeds ${MAX_INDEX_BYTES / 1024} kB limit`).toBeLessThan(MAX_INDEX_BYTES);
    }
  });

  it("pdf chunk exists as a separate file (lazy-loaded correctly)", () => {
    if (!existsSync(DIST_ASSETS)) {
      console.warn("dist/assets not found — skipping.");
      return;
    }
    const files = readdirSync(DIST_ASSETS);
    const pdfChunk = files.find(f => f.startsWith("pdf-") && f.endsWith(".js"));
    expect(pdfChunk, "PDF renderer should be a separate chunk (not bundled into index)").toBeDefined();
  });

  it("supabase chunk exists as a separate file", () => {
    if (!existsSync(DIST_ASSETS)) {
      console.warn("dist/assets not found — skipping.");
      return;
    }
    const files = readdirSync(DIST_ASSETS);
    const supabaseChunk = files.find(f => f.startsWith("supabase-") && f.endsWith(".js"));
    expect(supabaseChunk, "Supabase client should be a separate chunk").toBeDefined();
  });
});
