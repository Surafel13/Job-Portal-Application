import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { catalogService, jobsService } from "../services/jobs.service";
import { adminService } from "../services/platform.service";
import type { UserRole } from "../types/models";

/** Same key + shape as AdminUsersPage, so the cache is shared. */
export function useUsersByRole(role: UserRole) {
  return useQuery({
    queryKey: queryKeys.usersByRole(role),
    queryFn: () => adminService.usersByRole(role).then((r) => r.data ?? []),
  });
}

/** Same key + shape as the other employer queries (first 100 employers). */
export function useEmployerList() {
  return useQuery({
    queryKey: queryKeys.employers,
    queryFn: () => catalogService.employers().then((r) => r.data ?? []),
  });
}

/** Newest 100 published jobs plus the total published count in `meta`. */
export function usePublishedJobs() {
  return useQuery({
    queryKey: queryKeys.jobs({ page: 1, limit: 100, scope: "super-admin" }),
    queryFn: () => jobsService.search({ page: 1, limit: 100 }),
  });
}
