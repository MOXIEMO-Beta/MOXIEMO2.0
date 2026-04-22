import { Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoxieLogo } from "@/components/MoxieLogo";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/platform", label: "Platform" },
  { to: "/solutions", label: "Solutions" },
  { to: "/why-moxie", label: "Why MOXIE" },
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
                  "px-3.5 py-2 text-[15px] rounded-md transition-colors",
                  active
                    ? "text-foreground font-semibold"
                    : "text-foreground/70 font-medium hover:text-foreground",
                )}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="hidden sm:inline text-[15px] font-medium text-foreground/70 hover:text-foreground px-2"
          >
            Sign in
          </Link>
          <Button
            asChild
            className="bg-foreground hover:bg-foreground/90 text-background h-10 px-5 rounded-full font-semibold text-[15px]"
          >
            <Link to="/auth">
              Get started <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
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
                    "px-3 py-2.5 text-[15px] rounded-md",
                    isActive ? "bg-muted text-foreground font-semibold" : "text-foreground/75 font-medium hover:bg-muted/60",
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