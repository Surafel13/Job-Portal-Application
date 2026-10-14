import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../../store/authStore";
import { getAccessToken } from "../../lib/api";
import { dashboardPath, useMe } from "../../hooks/useAuth";
import { Spinner } from "../ui/States";
import type { UserRole } from "../../types/models";

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const token = getAccessToken();
  const me = useMe();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (me.isLoading && !user) {
    return <Spinner label="Restoring session" />;
  }

  const current = me.data ?? user;
  if (!current) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(current.role)) {
    return <Navigate to={dashboardPath(current.role)} replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const user = useAuthStore((s) => s.user);
  const token = getAccessToken();
  if (token && user) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }
  return <Outlet />;
}
