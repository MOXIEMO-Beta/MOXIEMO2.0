import { Link } from "react-router-dom";
import logoLight from "@/assets/redesign/moxiemo-logo-light.png.asset.json";

const C = {
  bg: "#13130f",
  white: "#ffffff",
  tagline: "#86847a",
  muted: "#55534a",
  link: "#c8c6bc",
  linkHover: "#f4efe5",
  coral: "#ef6f53",
  coralHover: "#d85f44",
  hairline: "rgba(244,239,229,0.1)",
};

const fontBody = { fontFamily: "'Hanken Grotesk', system-ui, sans-serif" } as const;
const fontItalic = { fontFamily: "'Newsreader', Georgia, serif" } as const;
const fontMono = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" } as const;

const IconInstagram = () => (
  <svg width="15" height="15" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="16" height="16" rx="5"/><circle cx="11" cy="11" r="4"/><circle cx="16.2" cy="5.8" r="1" fill="currentColor" stroke="none"/></svg>
);
const IconFacebook = () => (
  <svg width="15" height="15" viewBox="0 0 22 22" fill="currentColor"><path d="M17 3h-3a5 5 0 0 0-5 5v3H6v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V3z"/></svg>
);
const IconLinkedIn = () => (
  <svg width="15" height="15" viewBox="0 0 22 22" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
);

const productLinks: Array<[string, string]> = [
  ["Platform", "/platform"],
  ["Solutions", "/solutions"],
  ["Why MOXIEMO", "/why-moxiemo"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
];
const resourceLinks: Array<[string, string, boolean?]> = [
  ["Building with MOXIEMO", "/blog"],
  ["Changelog", "/changelog"],
  ["Free Brand Audit", "/brand-audit"],
  ["Free Brand Kit", "/brand-kit", true],
  ["Contact", "mailto:hello@buildwithmoxiemo.com"],
];
const legalLinks: Array<[string, string]> = [
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Data Deletion", "/data-deletion"],
];

const socials = [
  { Icon: IconInstagram, href: "https://www.instagram.com/buildwithmoxiemo", label: "Instagram" },
  { Icon: IconFacebook, href: "https://www.facebook.com/buildwithmoxiemo", label: "Facebook" },
  { Icon: IconLinkedIn, href: "https://www.linkedin.com/company/moxiemo", label: "LinkedIn" },
];

const headerStyle: React.CSSProperties = {
  ...fontMono, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.16em",
  color: C.muted, marginBottom: 18,
};

function FooterLink({ to, children, coral }: { to: string; children: React.ReactNode; coral?: boolean }) {
  return (
    <Link
      to={to}
      className="sf-link"
      style={{ ...fontBody, fontSize: 15, color: coral ? C.coral : C.link, textDecoration: "none" }}
      onClick={(e) => {
        if (typeof window !== "undefined" && window.location.pathname === to) {
          e.preventDefault();
          window.location.reload();
        }
      }}
    >
      {children}
    </Link>
  );
}

export function SiteFooter() {
  const letters = "MOXIEMO".split("");
  return (
    <footer style={{ background: C.bg, color: C.linkHover, position: "relative", overflow: "hidden" }}>
      <style>{`
        .sf-link:hover { color: ${C.linkHover} !important; }
        .sf-coral:hover { background: ${C.coralHover} !important; }
        .sf-social { color: rgba(244,239,229,0.4); border: 1.5px solid rgba(244,239,229,0.2); }
        .sf-social:hover { color: ${C.linkHover}; border-color: rgba(244,239,229,0.6); }
        @media (max-width: 900px) {
          .sf-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .sf-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* 1. Wordmark block */}
      <div style={{ borderBottom: `1px solid ${C.hairline}`, paddingTop: 72 }}>
        <div
          style={{
            ...fontBody, fontWeight: 700,
            fontSize: "clamp(140px, 22vw, 320px)",
            lineHeight: 0.9, letterSpacing: "0.04em", color: C.white,
            whiteSpace: "nowrap", width: "100%",
            display: "flex", justifyContent: "space-between", padding: "0 2px",
          }}
        >
          {letters.map((l, i) => <span key={i}>{l}</span>)}
        </div>

        <div style={{ padding: "32px 40px 56px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div>
            <div style={{ ...fontItalic, fontStyle: "italic", fontSize: "clamp(22px, 2.8vw, 36px)", color: C.tagline, maxWidth: 560, lineHeight: 1.15 }}>
              Built on strategy. Powered to execute.
            </div>
            <div style={{ ...fontBody, fontSize: 16, color: C.muted, maxWidth: 460, marginTop: 14, lineHeight: 1.55 }}>
              The strategy-led marketing system for founders and growing businesses. MOXIEMO finds what moves your brand forward. MOXIE makes sure it happens.
            </div>
          </div>
          <Link
            to="/founding"
            className="sf-coral"
            style={{
              ...fontBody, background: C.coral, color: "#fff", fontWeight: 600, fontSize: 15,
              padding: "16px 28px", borderRadius: 999, textDecoration: "none",
              flex: "none", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 8,
              transition: "background 0.2s ease",
            }}
          >
            Claim a first-100 spot
          </Link>
        </div>
      </div>

      {/* 2. Nav grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "52px 40px 40px" }}>
        <div
          className="sf-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
            gap: 40,
            paddingBottom: 40,
            borderBottom: `1px solid ${C.hairline}`,
          }}
        >
          {/* Column 1 — brand */}
          <div>
            <img src={logoLight.url} alt="MOXIEMO" style={{ height: 32, display: "block" }} />
            <div style={{ ...fontMono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: C.muted, lineHeight: 1.8, marginTop: 18 }}>
              MOXIEMO 2.0 BETA<br />50% OFF FOR OUR FIRST 100 CUSTOMERS
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="sf-social"
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    transition: "color 0.2s ease, border-color 0.2s ease",
                  }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Product */}
          <div>
            <div style={headerStyle}>Product</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {productLinks.map(([l, h]) => <FooterLink key={l} to={h}>{l}</FooterLink>)}
            </div>
          </div>

          {/* Column 3 — Resources */}
          <div>
            <div style={headerStyle}>Resources</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {resourceLinks.map(([l, h, coral]) => <FooterLink key={l} to={h} coral={coral}>{l}</FooterLink>)}
            </div>
          </div>

          {/* Column 4 — Legal */}
          <div>
            <div style={headerStyle}>Legal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {legalLinks.map(([l, h]) => <FooterLink key={l} to={h}>{l}</FooterLink>)}
            </div>
          </div>
        </div>

        {/* 3. Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 22, flexWrap: "wrap", gap: 14 }}>
          <span style={{ ...fontMono, fontSize: 11, letterSpacing: "0.1em", color: C.muted }}>
            © 2026 MOXIEMO. All rights reserved.
          </span>
          <span style={{ ...fontMono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: C.muted, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, background: C.coral, display: "inline-block" }} />
            Built with care
          </span>
        </div>
      </div>
    </footer>
  );
}