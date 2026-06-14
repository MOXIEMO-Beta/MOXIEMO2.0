import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import { MoxieLogo } from "@/components/MoxieLogo";
import { useAuth } from "@/hooks/useAuth";

export function SiteFooter() {
  const { user } = useAuth();
  return (
    <footer className="border-t border-border py-12 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <MoxieLogo />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              One platform. Confident marketing.
            </p>
          </div>

          <div>
            <h4 className="moxie-footer-heading mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/platform" className="moxie-footer-link">Platform</Link></li>
              <li><Link to="/solutions" className="moxie-footer-link">Solutions</Link></li>
              <li><Link to="/why-moxie" className="moxie-footer-link">Why MOXIEMO</Link></li>
              <li><Link to="/pricing" className="moxie-footer-link">Pricing</Link></li>
              <li><Link to="/community" className="moxie-footer-link">Community</Link></li>
              <li><Link to="/about" className="moxie-footer-link">About</Link></li>
              {!user && (
                <li>
                  <Link to="/founding" className="moxie-footer-link" style={{ color: "#ff6b6b" }}>
                    Join as a Founding Member →
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="moxie-footer-heading mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/blog" className="moxie-footer-link">Building with MOXIEMO</Link></li>
              <li><Link to="/changelog" className="moxie-footer-link">Changelog</Link></li>
              <li><Link to="/resources" className="moxie-footer-link">Resources</Link></li>
              <li><Link to="/brand-audit" className="moxie-footer-link">Free Brand Audit</Link></li>
              <li><a href="mailto:hello@buildwithmoxiemo.com" className="moxie-footer-link">Contact</a></li>
              <li>
                <Link to="/brand-kit" className="moxie-footer-link" style={{ color: "#ff6b6b" }}>
                  Free Brand Kit ✨
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="moxie-footer-heading mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="moxie-footer-link">Privacy</Link></li>
              <li><Link to="/terms" className="moxie-footer-link">Terms</Link></li>
              <li><Link to="/data-deletion" className="moxie-footer-link">Data Deletion</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 MOXIEMO. One platform. Confident marketing.</p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a
              href="https://www.instagram.com/buildwithmoxiemo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="moxie-footer-social"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/buildwithmoxiemo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="moxie-footer-social"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/company/moxiemo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="moxie-footer-social"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}