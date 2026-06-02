import axios from "axios";

// Token storage for cross-domain Bearer auth (Vercel client + Render API).
// Cookies can't be shared across different domains, so we keep the JWTs in
// localStorage and send them via the Authorization header.
const ACCESS_TOKEN_KEY = "chitkaracv-access-token";
const REFRESH_TOKEN_KEY = "chitkaracv-refresh-token";
// Lightweight, non-httpOnly flag cookie the Next.js middleware can read on the
// client's own domain to gate protected routes. Real auth is the Bearer token.
const AUTH_FLAG_COOKIE = "is-authed";

export const tokenStore = {
  getAccess: (): string | null =>
    typeof window === "undefined"
      ? null
      : localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: (): string | null =>
    typeof window === "undefined"
      ? null
      : localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (accessToken: string, refreshToken?: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    // Mirror auth presence into a readable cookie for the edge middleware.
    document.cookie = `${AUTH_FLAG_COOKIE}=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  },
  clear: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    document.cookie = `${AUTH_FLAG_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  },
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true, // Still sends cookies for same-domain / local dev
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the Bearer token (if present) to every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto-refresh token on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying and not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/verify-otp")
    ) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStore.getRefresh();
        const res = await api.post("/auth/refresh", { refreshToken });
        const newAccessToken = res.data?.data?.accessToken;
        if (newAccessToken) tokenStore.set(newAccessToken);
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh failed — clear tokens and redirect to login
        tokenStore.clear();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;