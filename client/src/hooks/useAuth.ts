import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";
import { getAccessToken } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import type { UserRole } from "../types/models";

export function dashboardPath(role?: UserRole) {
  if (role === "employer") return "/employer";
  if (role === "admin" || role === "superAdmin") return "/admin";
  return "/worker";
}

export function useMe() {
  const token = getAccessToken();
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  return useQuery({
    queryKey: queryKeys.me,
    enabled: Boolean(token),
    queryFn: async () => {
      try {
        const res = await authService.me();
        setUser(res.data);
        return res.data;
      } catch {
        logout();
        throw new Error("Session expired");
      }
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await authService.logout();
      } catch {
        /* local logout still proceeds */
      }
    },
    onSettled: async () => {
      logout();
      queryClient.clear();
      await navigate("/login");
    },
  });
}
