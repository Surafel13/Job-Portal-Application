import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/models";
import { clearTokens, setTokens } from "../lib/api";

interface AuthState {
  user: User | null;
  setSession: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setSession: (user, accessToken, refreshToken) => {
        setTokens(accessToken, refreshToken);
        set({ user });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        clearTokens();
        set({ user: null });
      },
    }),
    {
      name: "jobverse.auth",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
