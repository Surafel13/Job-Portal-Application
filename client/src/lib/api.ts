import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "../types/api";

const TOKEN_KEY = "jobverse.accessToken";
const REFRESH_KEY = "jobverse.refreshToken";

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? "/api/v1";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiClientError extends Error {
  status: number;
  errors: { field?: string; message: string }[];

  constructor(
    message: string,
    status = 500,
    errors: { field?: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await axios.post<
    ApiResponse<{ accessToken: string; refreshToken: string }>
  >(`${API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });

  const tokens = response.data.data;
  if (!tokens?.accessToken || !tokens.refreshToken) return null;
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

/** Shared, de-duplicated token refresh (also used by the SSE client). */
export async function refreshSession(): Promise<string | null> {
  try {
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });
    return await refreshing;
  } catch {
    clearTokens();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const token = await refreshSession();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }

    const payload = error.response?.data;
    throw new ApiClientError(
      payload?.message ?? error.message ?? "Request failed",
      error.response?.status ?? 500,
      payload?.errors ?? [],
    );
  },
);

export async function request<T>(
  method: "get" | "post" | "patch" | "delete",
  url: string,
  options?: {
    data?: unknown;
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
  },
) {
  const response = await api.request<ApiResponse<T>>({
    method,
    url,
    data: options?.data,
    params: options?.params,
    headers: options?.headers,
  });

  return {
    data: response.data.data as T,
    message: response.data.message,
    meta: response.data.meta,
  };
}

export default api;
