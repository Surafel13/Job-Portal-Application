import {
  Bell,
  Briefcase,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PlusCircle,
  Settings,
  Shield,
  UserRound,
  Users,
} from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { Logo } from "./Logo";
import { Avatar } from "../ui/Avatar";
import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../hooks/useAuth";
import { cn } from "../../lib/cn";
import type { UserRole } from "../../types/models";

function itemsFor(role?: UserRole) {
  if (role === "employer") {
    return [
      { to: "/employer", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/employer/jobs/new", icon: PlusCircle, label: "Post a Job" },
      { to: "/employer/applicants", icon: Users, label: "Applicants" },
      { to: "/messages", icon: MessageSquare, label: "Messages" },
      { to: "/employer/settings", icon: Settings, label: "Settings" },
    ];
  }
  if (role === "admin" || role === "superAdmin") {
    return [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/users", icon: Users, label: "Users" },
      { to: "/admin/companies", icon: Briefcase, label: "Companies" },
      { to: "/admin/jobs", icon: Briefcase, label: "Jobs" },
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
    <div className="flex min-h-screen bg-[#f4f2fb]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#1b1545] p-5 text-white lg:flex">
        <Logo light />
        <nav className="mt-8 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/worker" || item.to === "/employer" || item.to === "/admin"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white",
                  isActive && "bg-white/15 text-white",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => logout.mutate()}
          className="mt-auto flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
          <p className="font-semibold text-ink lg:hidden">JobVerse</p>
          <div className="ml-auto flex items-center gap-3">
            <NavLink to="/messages" className="rounded-full p-2 hover:bg-brand-50">
              <Bell className="h-5 w-5 text-muted" />
            </NavLink>
            <div className="flex items-center gap-2">
              <Avatar name={user?.fullName} src={user?.profileImage} />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">{user?.fullName}</p>
                <p className="text-xs capitalize text-muted">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-2 lg:hidden">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-muted hover:bg-brand-50"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
