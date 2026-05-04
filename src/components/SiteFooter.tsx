import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import { MoxieLogo } from "@/components/MoxieLogo";

const ComingSoonBadge = () => (
  <span className="ml-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
    Coming Soon
  </span>
);

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
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/platform" className="hover:text-foreground">How It Works</Link></li>
              <li><Link to="/platform" className="hover:text-foreground">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link to="/pricing#faq" className="hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li>
                <Link to="/blog" className="hover:text-foreground">Blog</Link>
                <ComingSoonBadge />
              </li>
              <li>
                <Link to="/resources" className="hover:text-foreground">Resources</Link>
                <ComingSoonBadge />
              </li>
              <li><a href="mailto:hello@buildwithmoxie.co" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link to="/data-deletion" className="hover:text-foreground">Data Deletion</Link></li>
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
              className="hover:text-foreground"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/buildwithmoxie"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-foreground"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/company/buildwithmoxie"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-foreground"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}