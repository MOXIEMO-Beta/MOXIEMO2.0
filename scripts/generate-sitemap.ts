// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://buildwithmoxiemo.com";

const COMPARE_SLUGS = [
  "chatgpt",
  "averi",
  "claude",
  "jasper",
  "blaze",
  "rella",
  "gemini",
  "canva",
];

interface SitemapEntry {
  path: string;
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/platform", changefreq: "monthly", priority: "0.8" },
  { path: "/solutions", changefreq: "monthly", priority: "0.7" },
  { path: "/why-moxiemo", changefreq: "monthly", priority: "0.7" },
  { path: "/pricing", changefreq: "monthly", priority: "0.9" },
  { path: "/community", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/blog/my-website-could-not-explain-moxie", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/why-marketing-isnt-working", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/how-to-know-what-to-post", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/building-a-tech-platform-at-peak-of-ai", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/why-linkedin-posts-arent-landing", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/ai-slop-vs-ai-strategy", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/six-tool-stack-killing-productivity", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/case-for-optimism-best-time-to-build", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/ai-marketing-stack-advice-solo-founders", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/why-your-marketing-feels-like-a-second-job", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/what-happens-when-a-real-founder-sits-down-with-your-product", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/ai-everywhere-how-you-stand-out", changefreq: "monthly", priority: "0.6" },
  { path: "/resources", changefreq: "monthly", priority: "0.6" },
  { path: "/changelog", changefreq: "weekly", priority: "0.5" },
  { path: "/founding", changefreq: "weekly", priority: "0.9" },
  { path: "/brand-kit", changefreq: "monthly", priority: "0.5" },
  { path: "/brand-architecture-method", changefreq: "monthly", priority: "0.7" },
  { path: "/brand-audit", changefreq: "monthly", priority: "0.7" },
  { path: "/compare", changefreq: "weekly", priority: "0.8" },
  ...COMPARE_SLUGS.map((slug) => ({
    path: `/compare/${slug}`,
    changefreq: "monthly" as const,
    priority: "0.7",
  })),
  { path: "/terms", priority: "0.3" },
  { path: "/privacy", priority: "0.3" },
  { path: "/data-deletion", priority: "0.3" },
];

function build(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      "  <url>",
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), build(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
