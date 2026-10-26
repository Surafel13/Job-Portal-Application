import { Bell, Menu, Search, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router";
import { Logo } from "./Logo";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { useAuthStore } from "../../store/authStore";
import { dashboardPath, useLogout } from "../../hooks/useAuth";
import { useState } from "react";

const links = [
  { to: "/", label: "Home" },
  { to: "/jobs", label: "Jobs" },
  { to: "/jobs#employers", label: "Employers" },
  { to: "/login", label: "For Workers" },
];

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (q.trim()) {
      void navigate(`/jobs?keyword=${encodeURIComponent(q.trim())}`);
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-white/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        {/* Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted md:flex">
            {links.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  isActive && link.label === "Home"
                    ? "text-brand-700 font-bold"
                    : "transition-colors hover:text-ink"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Desktop Search Form */}
        <form
          className="hidden max-w-sm flex-1 items-center rounded-full border border-line bg-surface/50 px-3.5 py-2 text-sm transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500 lg:flex shadow-2xs"
          onSubmit={handleSearchSubmit}
        >
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jobs, titles, or companies..."
            className="ml-2.5 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </form>

        {/* User Actions & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/messages"
                className="relative rounded-full p-2 text-muted transition-colors hover:bg-surface hover:text-ink"
                aria-label="Messages"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link to={dashboardPath(user.role)} className="hidden sm:block">
                <Avatar
                  name={user.fullName}
                  src={user.profileImage}
                  className="h-9 w-9 shadow-sm"
                />
              </Link>
              <Button variant="ghost" size="sm" onClick={() => logout.mutate()}>
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden text-sm font-bold text-ink hover:text-brand-700 sm:block"
              >
                Login
              </Link>
              <Link to="/register">
                <Button size="sm" className="shadow-xs">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="rounded-full p-2 text-muted hover:bg-surface hover:text-ink md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {open ? (
        <div className="border-t border-line bg-white/95 px-4 py-4 backdrop-blur-md md:hidden space-y-3">
          <form
            className="flex items-center rounded-2xl border border-line bg-surface/60 px-3.5 py-2 text-sm"
            onSubmit={handleSearchSubmit}
          >
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search jobs..."
              className="ml-2 w-full bg-transparent text-sm outline-none"
            />
          </form>

          <nav className="space-y-1 pt-1">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm font-semibold text-ink hover:bg-surface"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {!user ? (
            <div className="pt-2 border-t border-line flex items-center justify-between px-3">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="text-sm font-bold text-ink hover:text-brand-700"
              >
                Sign in
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
