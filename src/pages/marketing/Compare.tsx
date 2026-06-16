import { useMemo } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ComparisonView } from "@/components/ComparisonView";
import { competitors, competitorMap } from "@/data/compareData";
import { cn } from "@/lib/utils";

export default function Compare() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const activeSlug = slug ?? "chatgpt";
  const competitor = competitorMap[activeSlug];

  const tabs = useMemo(() => competitors.map((c) => ({ slug: c.slug, name: c.name })), []);

  if (slug && !competitor) {
    return <Navigate to="/compare" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* Tab bar */}
      <div className="sticky top-[64px] z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          {/* Mobile: select */}
          <div className="py-3 md:hidden">
            <label htmlFor="compare-select" className="sr-only">
              Choose comparison
            </label>
            <select
              id="compare-select"
              value={activeSlug}
              onChange={(e) => navigate(`/compare/${e.target.value}`)}
              className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground"
            >
              {tabs.map((t) => (
                <option key={t.slug} value={t.slug}>
                  MOXIEMO vs {t.name}
                </option>
              ))}
            </select>
          </div>
          {/* Desktop: scroll row */}
          <div className="hidden md:block">
            <div className="flex gap-1 overflow-x-auto py-2">
              {tabs.map((t) => {
                const isActive = t.slug === activeSlug;
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => navigate(`/compare/${t.slug}`)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-[#15171C] text-white"
                        : "text-[#15171C]/65 hover:bg-[#15171C]/5 hover:text-[#15171C]",
                    )}
                  >
                    vs {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <ComparisonView competitor={competitor ?? competitorMap.chatgpt} />
      </main>

      <SiteFooter />
    </div>
  );
}