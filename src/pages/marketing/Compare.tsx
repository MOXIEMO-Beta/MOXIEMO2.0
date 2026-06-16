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

      <main className="flex-1">
        {/* In-page comparison switcher, sits above the hero */}
        <div className="bg-background pt-8 md:pt-12">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            {/* Mobile: select */}
            <div className="flex justify-center md:hidden">
              <label htmlFor="compare-select" className="sr-only">
                Choose comparison
              </label>
              <select
                id="compare-select"
                value={activeSlug}
                onChange={(e) => navigate(`/compare/${e.target.value}`)}
                className="w-full max-w-md rounded-full border border-[#15171C]/10 bg-[#15171C] px-4 py-2.5 text-sm font-semibold text-white"
              >
                {tabs.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    MOXIEMO vs {t.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Desktop: filled segmented control */}
            <div className="hidden md:flex md:justify-center">
              <div
                role="tablist"
                aria-label="Compare MOXIEMO with"
                className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[#15171C]/10 bg-[#15171C] p-1.5 shadow-sm"
              >
                {tabs.map((t) => {
                  const isActive = t.slug === activeSlug;
                  return (
                    <button
                      key={t.slug}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => navigate(`/compare/${t.slug}`)}
                      className={cn(
                        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-[#F7F5F1] text-[#15171C]"
                          : "text-white/70 hover:bg-white/10 hover:text-white",
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

        <ComparisonView competitor={competitor ?? competitorMap.chatgpt} />
      </main>

      <SiteFooter />
    </div>
  );
}