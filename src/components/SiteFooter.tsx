import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import { MoxieLogo } from "@/components/MoxieLogo";

export function SiteFooter() {
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
              <li><Link to="/why-moxie" className="moxie-footer-link">Why MOXIE</Link></li>
              <li><Link to="/pricing" className="moxie-footer-link">Pricing</Link></li>
              <li><Link to="/community" className="moxie-footer-link">Community</Link></li>
              <li><Link to="/about" className="moxie-footer-link">About</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="moxie-footer-heading mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/blog" className="moxie-footer-link">Building with MOXIE</Link></li>
              <li><Link to="/changelog" className="moxie-footer-link">Changelog</Link></li>
              <li><Link to="/resources" className="moxie-footer-link">Resources</Link></li>
              <li><a href="mailto:hello@buildwithmoxie.co" className="moxie-footer-link">Contact</a></li>
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
          <p className="text-xs text-muted-foreground">© 2026 MOXIE. One platform. Confident marketing.</p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a
              href="https://www.instagram.com/buildwithmoxie"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="moxie-footer-social"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/buildwithmoxie"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="moxie-footer-social"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/company/buildwithmoxie"
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