import {
  Bell,
  Briefcase,
  FileText,
  Flag,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PlusCircle,
  Settings,
  Shield,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { superAdminNav } from "../../config/superAdminNav";
import { useLogout } from "../../hooks/useAuth";
import { cn } from "../../lib/cn";
import { useAuthStore } from "../../store/authStore";
import type { UserRole } from "../../types/models";
import { Avatar } from "../ui/Avatar";
import { Logo } from "./Logo";

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  /** Page exists but is still a placeholder */
  soon?: boolean;
}

const ROOT_PATHS = ["/worker", "/employer", "/admin", "/super-admin"];

function itemsFor(role?: UserRole): NavItem[] {
  if (role === "employer") {
    return [
      { to: "/employer", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/employer/jobs/new", icon: PlusCircle, label: "Post a Job" },
      { to: "/employer/applicants", icon: Users, label: "Applicants" },
      { to: "/messages", icon: MessageSquare, label: "Messages" },
      { to: "/employer/settings", icon: Settings, label: "Settings" },
    ];
  }
  if (role === "superAdmin") {
    return superAdminNav.map((item) => ({
      to: item.to,
      icon: item.icon,
      label: item.label,
      soon: !item.ready,
    }));
  }
  if (role === "admin") {
    return [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/users", icon: Users, label: "Users" },
      { to: "/admin/companies", icon: Briefcase, label: "Employers" },
      { to: "/admin/jobs", icon: Briefcase, label: "Jobs" },
      { to: "/admin/reports", icon: Flag, label: "Reports" },
      { to: "/messages", icon: Bell, label: "Alerts" },
      { to: "/admin/settings", icon: Shield, label: "Settings" },
    ];
  }
  return [
    { to: "/worker", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/worker/profile", icon: UserRound, label: "My Profile" },
    { to: "/jobs", icon: Briefcase, label: "Find Jobs" },
    { to: "/worker/applications", icon: FileText, label: "Applications" },
    { to: "/messages", icon: MessageSquare, label: "Messages" },
    { to: "/worker/settings", icon: Settings, label: "Settings" },
  ];
}

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const items = itemsFor(user?.role);

  return (
    <div className="flex min-h-screen bg-surface/40">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#110e2e] p-6 text-white shadow-xl lg:flex">
        <div className="px-2">
          <Logo light />
        </div>

        <nav className="mt-8 flex-1 space-y-1.5 overflow-y-auto scrollbar-thin">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={ROOT_PATHS.includes(item.to)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white",
                  isActive &&
                    "bg-white/15 text-white ring-1 ring-white/20 shadow-sm",
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.soon ? (
                <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-white/80">
                  Soon
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-rose-300/80 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/80 px-4 py-3.5 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Logo />
          </div>

          <div className="ml-auto flex items-center gap-4">
            <NavLink
              to="/messages"
              className="relative rounded-full p-2.5 text-muted transition-colors hover:bg-surface hover:text-ink"
              aria-label="View messages and alerts"
            >
              <Bell className="h-5 w-5" />
            </NavLink>

            <div className="h-6 w-px bg-line" />

            <div className="flex items-center gap-3">
              <Avatar
                name={user?.fullName}
                src={user?.profileImage}
                className="h-9 w-9 shadow-sm"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-ink leading-tight">
                  {user?.fullName}
                </p>
                <p className="text-xs font-medium capitalize text-muted mt-0.5">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Scrollable Horizontal Navigation */}
        <nav className="flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-2.5 scrollbar-thin lg:hidden">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={ROOT_PATHS.includes(item.to)}
              className={({ isActive }) =>
                cn(
                  "inline-flex whitespace-nowrap items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-surface text-muted hover:bg-brand-50 hover:text-brand-700",
                )
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {item.soon ? <span className="opacity-70">· Soon</span> : null}
            </NavLink>
          ))}
        </nav>

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
