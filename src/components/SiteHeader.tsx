import { Link, NavLink, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useId } from "react";
import { MoxieLogo } from "@/components/MoxieLogo";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import featuredLoadingImage from "@/assets/resources-featured-loading.jpg";

const navItems = [
  { to: "/platform", label: "Platform" },
  { to: "/solutions", label: "Solutions" },
  { to: "/why-moxie", label: "Why MOXIEMO" },
  { to: "/pricing", label: "Pricing" },
  { to: "/community", label: "Community" },
  { to: "/about", label: "About" },
];

type LinkStatus = "live" | "soon" | "new";
type ResourceItem = {
  label: string;
  description: string;
  href?: string;
  status: LinkStatus;
  children?: ResourceItem[];
};

const resourceColumns: { heading: string; items: ResourceItem[] }[] = [
  {
    heading: "Free tools",
    items: [
      { label: "Brand Audit Report", description: "Score your brand and see what to fix first.", href: "/brand-audit", status: "new" },
      { label: "Brand Kit", description: "Turn your site into a polished brand kit.", href: "/brand-kit", status: "live" },
      { label: "Prompt packs", description: "Proven prompts for content that sounds like you.", href: "/resources", status: "live" },
    ],
  },
  {
    heading: "Learn",
    items: [
      { label: "Building with MOXIEMO", description: "Strategy and growth playbooks for founders.", href: "/blog", status: "live" },
      { label: "Field notes", description: "Follow the build in the open, wins and misses.", href: "/changelog", status: "live" },
      { label: "This Is Branding", description: "The method, as a free worksheet or the book.", status: "soon" },
      { label: "Compare", description: "See how MOXIEMO stacks up, head to head.", status: "soon" },
    ],
  },
  {
    heading: "The approach",
    items: [
      { label: "Brand Architecture Method", description: "The strategy-first system that gates every output.", status: "soon" },
      { label: "Why MOXIEMO", description: "The case for getting clear before you create.", status: "soon" },
    ],
  },
];

function StatusPill({ status }: { status: LinkStatus }) {
  if (status === "soon") {
    return (
      <span className="ml-2 inline-flex items-center rounded-full bg-[#15171C]/8 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#15171C]/55">
        Soon
      </span>
    );
  }
  if (status === "new") {
    return (
      <span className="ml-2 inline-flex items-center rounded-full bg-[#FF6B5C] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
        New
      </span>
    );
  }
  return null;
}

function ResourceLink({
  item,
  onNavigate,
  onToggleCompare,
  compareOpen,
}: {
  item: ResourceItem;
  onNavigate?: () => void;
  onToggleCompare?: () => void;
  compareOpen?: boolean;
}) {
  const muted = item.status === "soon";
  const hasChildren = !!item.children?.length;

  const inner = (
    <>
      <div className="flex items-center">
        <span
          className={cn(
            "text-[14px] font-medium",
            muted ? "text-[#15171C]/55" : "text-[#15171C]",
          )}
        >
          {item.label}
        </span>
        <StatusPill status={item.status} />
        {hasChildren && (
          <ChevronRight
            className={cn(
              "ml-1 h-3.5 w-3.5 text-[#15171C]/55 transition-transform",
              compareOpen && "rotate-90",
            )}
          />
        )}
      </div>
      <p className={cn("mt-0.5 text-[12.5px] leading-snug", muted ? "text-[#15171C]/45" : "text-[#15171C]/65")}>
        {item.description}
      </p>
    </>
  );

  if (muted) {
    return (
      <div
        aria-disabled="true"
        className="block rounded-md px-3 py-2 cursor-default select-none"
      >
        {inner}
      </div>
    );
  }

  if (hasChildren) {
    return (
      <button
        type="button"
        onClick={onToggleCompare}
        aria-expanded={!!compareOpen}
        className="block w-full text-left rounded-md px-3 py-2 transition-colors hover:bg-[#15171C]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B5C]/60"
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      to={item.href!}
      onClick={onNavigate}
      className="block rounded-md px-3 py-2 transition-colors hover:bg-[#15171C]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B5C]/60"
    >
      {inner}
    </Link>
  );
}

type SiteHeaderProps = {
  /** Image shown in the Resources mega-menu featured card. Swap for a brand asset when ready. */
  featuredImageSrc?: string;
};

export function SiteHeader({ featuredImageSrc = featuredLoadingImage }: SiteHeaderProps = {}) {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [mobileCompareOpen, setMobileCompareOpen] = useState(false);
  const { pathname } = useLocation();
  const resourcesRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setMegaOpen(false);
      setCompareOpen(false);
    }, 200);
  };
  const openNow = () => {
    cancelClose();
    setMegaOpen(true);
  };

  // Close on route change
  useEffect(() => {
    setMegaOpen(false);
    setCompareOpen(false);
    setOpen(false);
    setMobileResourcesOpen(false);
    setMobileCompareOpen(false);
  }, [pathname]);

  // Outside click + Escape
  useEffect(() => {
    if (!megaOpen) return;
    const onDown = (e: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
        setCompareOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setCompareOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [megaOpen]);

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
        <Link to="/" className="flex-shrink-0">
          <MoxieLogo />
        </Link>

        <nav className="hidden lg:flex items-center gap-2">
          {navItems.map((item, idx) => {
            const active = pathname === item.to;
            const node = (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "moxie-nav-link relative px-3.5 py-2 rounded-md",
                  active && "moxie-nav-link-active",
                )}
              >
                {item.label}
              </NavLink>
            );
            // Insert Resources between Platform (index 0) and Solutions (index 1)
            if (idx === 1) {
              return (
                <span key="with-resources" className="contents">
                  <div
                    ref={resourcesRef}
                    className="relative flex items-center"
                    onMouseEnter={openNow}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      ref={triggerRef}
                      type="button"
                      aria-expanded={megaOpen}
                      aria-controls={panelId}
                      aria-haspopup="true"
                      onClick={() => setMegaOpen((v) => !v)}
                      onFocus={() => setMegaOpen(true)}
                      className={cn(
                        "moxie-nav-link relative px-3.5 py-2 rounded-md inline-flex items-center gap-1 m-0 border-0 bg-transparent appearance-none leading-none align-middle focus:outline-none",
                      )}
                    >
                      <span>Resources</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-[#15171C] transition-transform",
                          megaOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {megaOpen && (
                      <div
                        id={panelId}
                        role="menu"
                        className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3"
                        onMouseEnter={openNow}
                        onMouseLeave={scheduleClose}
                      >
                        <div className="w-[860px] rounded-2xl border border-[#15171C]/10 bg-[#F7F5F1] p-6 shadow-[0_20px_50px_-20px_rgba(21,23,28,0.25)]">
                          <div className="grid grid-cols-[1fr_1fr_1fr_1.1fr] gap-6">
                            {resourceColumns.map((col) => (
                              <div key={col.heading}>
                                <h4 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#15171C]/55">
                                  {col.heading}
                                </h4>
                                <div className="space-y-0.5">
                                  {col.items.map((it) => (
                                    <div key={it.label} className="relative">
                                      <ResourceLink
                                        item={it}
                                        compareOpen={!!it.children && compareOpen}
                                        onToggleCompare={
                                          it.children
                                            ? () => setCompareOpen((v) => !v)
                                            : undefined
                                        }
                                      />
                                      {it.children && compareOpen && (
                                        <div className="ml-3 mt-1 mb-2 rounded-lg border border-[#15171C]/10 bg-white/60 p-2 space-y-0.5">
                                          {it.children.map((sub) => (
                                            <ResourceLink key={sub.label} item={sub} />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {/* Featured card */}
                            <div className="rounded-xl border border-[#15171C]/10 bg-white p-4 flex flex-col">
                              <div className="h-1 w-10 rounded-full bg-[#FF6B5C] mb-3" />
                              <h5 className="text-[15px] font-semibold text-[#15171C] leading-snug">
                                The Founding Round is open.
                              </h5>
                              <p className="mt-1.5 text-[12.5px] leading-snug text-[#15171C]/65">
                                MOXIEMO Beta 2.0 is in the build phase. Limited founding-member spots to build with us early.
                              </p>
                              <div className="mt-3 overflow-hidden rounded-xl">
                                <img
                                  src={featuredImageSrc}
                                  alt="Vintage collage of a figure with a black vinyl record for a head reading LOADING, layered over sheet music in coral and amber"
                                  loading="lazy"
                                  className="block w-full aspect-[4/3] object-cover"
                                  style={{ objectPosition: "center 32%" }}
                                />
                              </div>
                              <Link
                                to="/founding"
                                className="mt-3 inline-flex items-center justify-center rounded-full bg-[#FF6B5C] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#e85555]"
                              >
                                Join the list
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {node}
                </span>
              );
            }
            return node;
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/auth?mode=signin"
            className="hidden sm:inline text-[15px] font-medium text-foreground/70 rounded-[50px] border-[1.5px] border-transparent px-[18px] py-2 transition-all duration-200 ease hover:border-[#ff6b6b] hover:text-[#ff6b6b]"
          >
            Sign in
          </Link>
          <button
            className="lg:hidden p-2 -mr-2 text-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            {navItems.map((item, idx) => (
              <div key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "moxie-nav-link relative px-3 py-2.5 rounded-md block",
                      isActive && "moxie-nav-link-active",
                    )
                  }
                >
                  {item.label}
                </NavLink>
                {idx === 0 && (
                  <div className="mt-1">
                    <button
                      type="button"
                      aria-expanded={mobileResourcesOpen}
                      onClick={() => setMobileResourcesOpen((v) => !v)}
                      className="moxie-nav-link relative px-3 py-2.5 rounded-md w-full flex items-center justify-between"
                    >
                      <span>Resources</span>
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", mobileResourcesOpen && "rotate-180")}
                      />
                    </button>
                    {mobileResourcesOpen && (
                      <div className="mt-1 mb-2 rounded-lg bg-[#F7F5F1] p-3 space-y-3">
                        {resourceColumns.map((col) => (
                          <div key={col.heading}>
                            <h4 className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#15171C]/55">
                              {col.heading}
                            </h4>
                            <div className="space-y-0.5">
                              {col.items.map((it) => (
                                <div key={it.label}>
                                  <ResourceLink
                                    item={it}
                                    onNavigate={() => setOpen(false)}
                                    compareOpen={!!it.children && mobileCompareOpen}
                                    onToggleCompare={
                                      it.children
                                        ? () => setMobileCompareOpen((v) => !v)
                                        : undefined
                                    }
                                  />
                                  {it.children && mobileCompareOpen && (
                                    <div className="ml-3 mt-1 mb-2 rounded-lg border border-[#15171C]/10 bg-white/60 p-2 space-y-0.5">
                                      {it.children.map((sub) => (
                                        <ResourceLink key={sub.label} item={sub} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="rounded-xl border border-[#15171C]/10 bg-white p-4">
                          <div className="h-1 w-10 rounded-full bg-[#FF6B5C] mb-3" />
                          <h5 className="text-[15px] font-semibold text-[#15171C] leading-snug">
                            The Founding Round is open.
                          </h5>
                          <p className="mt-1.5 text-[12.5px] leading-snug text-[#15171C]/65">
                            MOXIEMO Beta 2.0 is in the build phase. Limited founding-member spots to build with us early.
                          </p>
                          <Link
                            to="/founding"
                            onClick={() => setOpen(false)}
                            className="mt-3 inline-flex items-center justify-center rounded-full bg-[#FF6B5C] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#e85555]"
                          >
                            Join the list
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
