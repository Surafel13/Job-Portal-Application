import { request } from "../lib/api";
import type {
  AdminDashboard,
  Notification,
  User,
  WorkerProfile,
} from "../types/models";
import type{ Report } from "../types/models";

export const workerService = {
  me: () => request<WorkerProfile>("get", "/workers/me"),
  byUserId: (userId: string) =>
    request<WorkerProfile>("get", `/workers/${userId}`),
  create: (payload: Record<string, unknown>) =>
    request<WorkerProfile>("post", "/workers", { data: payload }),
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
    request<{ count?: number } | number>(
      "get",
      "/notification/my/unread/count",
    ),
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
  suspendJob: (id: string) =>
    request<unknown>("patch", `/admin/jobs/${id}/suspend`),
  unsuspendJob: (id: string) =>
    request<unknown>("patch", `/admin/jobs/${id}/unsuspend`),
};

export const reportService = {
  create: (payload: {
    resourceType: "user" | "employer" | "job" | "content";
    resourceId: string;
    reason: string;
    description?: string;
  }) => request<Report>("post", "/report", { data: payload }),
  my: () => request<Report[]>("get", "/report/my"),
  all: () => request<Report[]>("get", "/report"),
  start: (id: string) => request<Report>("patch", `/report/${id}/review`),
  resolve: (id: string, adminDecision: string) =>
    request<Report>("patch", `/report/${id}/resolve`, {
      data: { adminDecision },
    }),
  reject: (id: string, adminDecision: string) =>
    request<Report>("patch", `/report/${id}/reject`, {
      data: { adminDecision },
    }),
  remove: (id: string) => request<undefined>("delete", `/report/${id}`),
};

export const userService = {
  byId: (id: string) => request<User>("get", `/users/${id}`),
  update: (id: string, payload: Record<string, unknown>) =>
    request<User>("patch", `/users/${id}`, { data: payload }),
};
