import { request } from "../lib/api";
import type {
  AdminDashboard,
  Notification,
  User,
  WorkerProfile,
} from "../types/models";

export const workerService = {
  me: () => request<WorkerProfile>("get", "/workers/me"),
  update: (payload: Record<string, unknown>) =>
    request<WorkerProfile>("patch", "/workers/me", { data: payload }),
};

export const applicantService = {
  me: () => request<Record<string, unknown>>("get", "/applicants/me"),
  create: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>("post", "/applicants", { data: payload }),
};

export const notificationService = {
  my: () => request<Notification[]>("get", "/notification/my"),
  unreadCount: () =>
    request<{ count?: number } | number>("get", "/notification/my/unread/count"),
  markRead: (id: string) =>
    request<Notification>("patch", `/notification/${id}/read`),
  markAll: () => request<undefined>("patch", "/notification/my/read-all"),
};

export const adminService = {
  dashboard: () => request<AdminDashboard>("get", "/admin/dashboard"),
  usersByRole: (role: string) =>
    request<User[]>("get", "/users/role", { params: { role } }),
  suspendUser: (userId: string) =>
    request<User>("patch", `/admin/users/${userId}/suspend`),
  unsuspendUser: (userId: string) =>
    request<User>("patch", `/admin/users/${userId}/unsuspend`),
  verifyEmployer: (id: string) =>
    request<unknown>("patch", `/admin/employers/${id}/verify`),
  rejectEmployer: (id: string) =>
    request<unknown>("patch", `/admin/employers/${id}/reject`),
  publishJob: (id: string) =>
    request<unknown>("patch", `/admin/jobs/${id}/publish`),
  rejectJob: (id: string) =>
    request<unknown>("patch", `/admin/jobs/${id}/reject`),
  closeJob: (id: string) =>
    request<unknown>("patch", `/admin/jobs/${id}/close`),
};

export const reportService = {
  create: (payload: {
    resourceType: "user" | "employer" | "job" | "content";
    resourceId: string;
    reason: string;
    description?: string;
  }) => request<unknown>("post", "/report", { data: payload }),
  my: () => request<unknown[]>("get", "/report/my"),
  all: () => request<unknown[]>("get", "/report"),
};

export const userService = {
  update: (id: string, payload: Record<string, unknown>) =>
    request<User>("patch", `/users/${id}`, { data: payload }),
};
