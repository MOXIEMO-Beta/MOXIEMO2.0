import { getCtaLabel, trackCtaClick } from "@/lib/ctaVariant";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { Menu, X } from "lucide-react";

const logoDark = { url: "/moxiemo-logo-header.png" };

const CREAM = "#f4efe5";
const INK = "#13130f";
const mono: CSSProperties = { fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace" };

type SiteHeaderProps = {
  featuredImageSrc?: string;
};

export function SiteHeader(_props: SiteHeaderProps = {}) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock scroll when mobile nav open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const links: Array<readonly [string, string]> = [
    ["Platform", "/platform"],
    ["Solutions", "/solutions"],
    ["Why MOXIEMO", "/why-moxiemo"],
    ["Pricing", "/pricing"],
    ["Community", "/community"],
    ["About", "/about"],
  ];

  const linkStyle: CSSProperties = {
    ...mono, fontSize: 12, letterSpacing: "0.14em", color: INK,
    textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
  };
  const pill: CSSProperties = {
    ...mono, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
    padding: "10px 16px", borderRadius: 999, background: INK, color: CREAM,
    border: "1px solid " + INK, textDecoration: "none", display: "inline-block",
    whiteSpace: "nowrap",
  };

  return (
    <>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: CREAM, borderBottom: "1px solid rgba(19,19,15,0.08)", margin: 0 }}>
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1280, padding: "16px clamp(16px, 4vw, 32px)", flexWrap: "nowrap", gap: 16 }}>
          {/* Logo */}
          <Link to="/" className="flex items-center" style={{ flexShrink: 0 }}>
            <img src={logoDark.url} alt="MOXIEMO" style={{ height: 40, display: "block" }} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center" style={{ gap: 22, flexWrap: "nowrap", flexShrink: 0 }}>
            {links.map(([l, h]) => {
              const active = pathname === h;
              return (
                <Link
                  key={l}
                  to={h}
                  className="hover:text-[#ef6f53] transition-colors uppercase"
                  style={active ? { ...linkStyle, color: "#ef6f53", paddingBottom: 3, borderBottom: "2px solid #ef6f53" } : linkStyle}
                >
                  {l}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center" style={{ gap: 16, flexShrink: 0 }}>
            <Link to="/auth?mode=signin" className="hover:text-[#ef6f53] uppercase" style={linkStyle}>Sign in</Link>
            <Link to="/founding" onClick={trackCtaClick} style={pill}>{getCtaLabel()}</Link>
          </div>

          {/* Mobile: CTA + hamburger */}
          <div className="flex lg:hidden items-center" style={{ gap: 12, flexShrink: 0 }}>
            <Link to="/founding" onClick={trackCtaClick} style={{ ...pill, fontSize: 11, padding: "8px 12px" }}>{getCtaLabel()}</Link>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", color: INK }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed", inset: 0, top: 73, zIndex: 99,
            background: CREAM, display: "flex", flexDirection: "column",
            padding: "24px clamp(16px, 4vw, 32px)",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {links.map(([l, h]) => (
              <Link
                key={l}
                to={h}
                onClick={() => setMobileOpen(false)}
                style={{
                  ...mono, fontSize: 24, fontWeight: 600, color: pathname === h ? "#ef6f53" : INK,
                  textDecoration: "none", padding: "12px 0",
                  borderBottom: "1px solid rgba(19,19,15,0.08)",
                  letterSpacing: "-0.3px",
                }}
              >
                {l}
              </Link>
            ))}
            <Link
              to="/auth?mode=signin"
              onClick={() => setMobileOpen(false)}
              style={{
                ...mono, fontSize: 24, fontWeight: 600, color: INK,
                textDecoration: "none", padding: "12px 0",
                borderBottom: "1px solid rgba(19,19,15,0.08)",
                letterSpacing: "-0.3px",
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
