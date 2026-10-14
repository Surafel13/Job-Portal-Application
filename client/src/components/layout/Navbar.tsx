import { Bell, Menu, Search } from "lucide-react";
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
  { to: "/jobs", label: "Employers", hash: "employers" },
  { to: "/login", label: "For Workers" },
];

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                isActive && link.label === "Home"
                  ? "text-brand-600"
                  : "hover:text-ink"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <form
          className="ml-auto hidden max-w-sm flex-1 items-center rounded-full border border-line bg-white px-3 py-2 lg:flex"
          onSubmit={(event) => {
            event.preventDefault();
            void navigate(`/jobs?keyword=${encodeURIComponent(q)}`);
          }}
        >
          <Search className="h-4 w-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jobs, companies"
            className="ml-2 w-full bg-transparent text-sm outline-none"
          />
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {user ? (
            <>
              <Link
                to="/messages"
                className="rounded-full p-2 text-muted hover:bg-brand-50"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link to={dashboardPath(user.role)} className="hidden sm:block">
                <Avatar name={user.fullName} src={user.profileImage} />
              </Link>
              <Button variant="ghost" size="sm" onClick={() => logout.mutate()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm font-semibold text-ink sm:block">
                Login
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
          <button
            className="rounded-full p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open ? (
        <div className="space-y-2 border-t border-line px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link key={link.label} to={link.to} className="block py-1 text-sm">
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
