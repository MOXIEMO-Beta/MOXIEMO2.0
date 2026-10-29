import { getCtaLabel, getCtaVariant, trackCtaClick } from "@/lib/ctaVariant";
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import logoDark from "@/assets/redesign/moxiemo-logo.png.asset.json";
import { useLocation } from "react-router-dom";

const CREAM = "#f4efe5";
const INK = "#13130f";
const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };

type SiteHeaderProps = {
  /** Kept for backwards compatibility with prior API; unused in new design. */
  featuredImageSrc?: string;
};

export function SiteHeader(_props: SiteHeaderProps = {}) {
  const { pathname } = useLocation();
  const links: Array<readonly [string, string]> = [
    ["Solutions", "/solutions"],
    ["Why MOXIEMO", "/why-moxiemo"],
    ["Pricing", "/pricing"],
    ["Community", "/community"],
    ["About", "/about"],
  ];
  const linkStyle: CSSProperties = {
    ...mono,
    fontSize: 12,
    letterSpacing: "0.14em",
    color: INK,
    textDecoration: "none",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
  const pill: CSSProperties = {
    ...mono,
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "10px 12px",
    borderRadius: 999,
    background: INK,
    color: CREAM,
    border: "1px solid " + INK,
    textDecoration: "none",
    display: "inline-block",
    whiteSpace: "nowrap",
  };
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: CREAM,
        borderBottom: "1px solid rgba(19,19,15,0.08)",
        margin: 0,
      }}
    >
      <div
        className="mx-auto flex items-center justify-between"
        style={{ maxWidth: 1280, padding: "16px 32px", flexWrap: "nowrap", gap: 24 }}
      >
        <Link to="/" className="flex items-center" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
          <img src={logoDark.url} alt="MOXIEMO" style={{ height: 44, display: "block" }} />
        </Link>
        <div
          className="hidden lg:flex items-center"
          style={{ gap: 22, flexWrap: "nowrap", flexShrink: 0 }}
        >
          <Link to="/platform" className="hover:text-[#ef6f53] transition-colors uppercase" style={linkStyle}>
            Platform
          </Link>
          {links.map(([l, h]) => {
            const active = pathname === h;
            return (
              <Link
                key={l}
                to={h}
                className="hover:text-[#ef6f53] transition-colors uppercase"
                style={
                  active
                    ? { ...linkStyle, color: "#ef6f53", paddingBottom: 3, borderBottom: "2px solid #ef6f53" }
                    : linkStyle
                }
              >
                {l}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center" style={{ gap: 16, flexWrap: "nowrap", flexShrink: 0 }}>
          <Link
            to="/auth?mode=signin"
            className="hidden sm:inline hover:text-[#ef6f53] uppercase"
            style={linkStyle}
          >
            Sign in
          </Link>
          <Link to="/founding" onClick={trackCtaClick} style={pill}>{getCtaLabel()}</Link>
        </div>
      </div>
    </nav>
  );
}
