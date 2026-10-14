import { request } from "../lib/api";
import type { AuthPayload, User } from "../types/models";

export const authService = {
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    role: "worker" | "employer";
    companyName?: string;
    phone?: string;
    location?: string;
  }) => request<AuthPayload>("post", "/auth/register", { data: payload }),

  login: (payload: { email: string; password: string }) =>
    request<AuthPayload>("post", "/auth/login", { data: payload }),

  me: () => request<User>("get", "/auth/me"),

  logout: () => request<undefined>("post", "/auth/logout"),

  forgotPassword: (email: string) =>
    request<undefined>("post", "/auth/forgot-password", { data: { email } }),

  verifyOtp: (email: string, otp: string) =>
    request<{ resetToken: string }>("post", "/auth/verify-reset-otp", {
      data: { email, otp },
    }),

  resetPassword: (payload: {
    email: string;
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
  }) => request<undefined>("post", "/auth/reset-password", { data: payload }),
};
