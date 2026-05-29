import { Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { MoxieLogo } from "@/components/MoxieLogo";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/platform", label: "Platform" },
  { to: "/solutions", label: "Solutions" },
  { to: "/why-moxie", label: "Why MOXIEMO" },
  { to: "/pricing", label: "Pricing" },
  { to: "/community", label: "Community" },
  { to: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
        <Link to="/" className="flex-shrink-0">
          <MoxieLogo />
        </Link>

        <nav className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
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
          <Link
            to="/auth?mode=signin"
            className="hidden sm:inline text-[15px] font-medium text-foreground/70 rounded-[50px] border-[1.5px] border-transparent px-[18px] py-2 transition-all duration-200 ease hover:border-[#ff6b6b] hover:text-[#ff6b6b]"
          >
            Sign in
          </Link>
            className="hidden sm:inline text-[15px] font-medium text-foreground/70 rounded-[50px] transition-all duration-200 ease hover:border-[1.5px] hover:border-[#ff6b6b] hover:px-[18px] hover:py-2 hover:text-[#ff6b6b]"
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
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "moxie-nav-link relative px-3 py-2.5 rounded-md",
                    isActive && "moxie-nav-link-active",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}