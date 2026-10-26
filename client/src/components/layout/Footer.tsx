import { Link } from "react-router";
import { Logo } from "./Logo";

const FOOTER_NAV_LINKS = [
  { label: "Find Jobs", to: "/jobs" },
  { label: "For Employers", to: "/employer" },
  { label: "Pricing & Plans", to: "/pricing" },
];

const FOOTER_LEGAL_LINKS = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
  { label: "Support & Help", to: "/support" },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Brand & Mission Column */}
          <div className="max-w-xs space-y-2">
            <Logo />
            <p className="text-xs text-muted leading-relaxed">
              AI-powered career matching platform connecting talented
              professionals with top companies worldwide.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="flex flex-wrap gap-8 sm:gap-12 text-xs font-semibold">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
                Platform
              </span>
              <ul className="space-y-1.5">
                {FOOTER_NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
                Resources
              </span>
              <ul className="space-y-1.5">
                {FOOTER_LEGAL_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar & Copyright */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-line/60 pt-5 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} JobVerse. All rights reserved.</p>
          <p className="text-[11px]">
            Designed for seamless hiring and career growth.
          </p>
        </div>
      </div>
    </footer>
  );
}
