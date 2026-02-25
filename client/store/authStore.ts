import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string | null;
  rollNumber: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (data: {
    email: string;
    otp: string;
    name: string;
    rollNumber: string;
  }) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      sendOtp: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.post("/auth/send-otp", { email });
          set({ isLoading: false });
        } catch (err: any) {
          const message =
            err.response?.data?.error?.message || "Failed to send OTP";
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      verifyOtp: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post("/auth/verify-otp", data);
          const user = res.data.data.user;
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: any) {
          const message =
            err.response?.data?.error?.message || "Verification failed";
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      fetchMe: async () => {
        try {
          const res = await api.get("/auth/me");
          const user = res.data.data.user;
          set({ user, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // Ignore errors — clear local state regardless
        }
        set({ user: null, isAuthenticated: false });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "chitkaracv-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);