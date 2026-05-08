import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from './authStore';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token refresh on 401
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry && original.url !== '/auth/refresh') {
      original._retry = true;
      const { refreshToken, setAuth, clear, user } = useAuthStore.getState();
      if (!refreshToken || !user) {
        clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        refreshPromise = refreshPromise ?? (async () => {
          const resp = await axios.post('/api/auth/refresh', { refreshToken });
          setAuth(resp.data.user, resp.data.accessToken, resp.data.refreshToken);
          return resp.data.accessToken as string;
        })();
        const newToken = await refreshPromise;
        refreshPromise = null;
        if (newToken && original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch (e) {
        refreshPromise = null;
        clear();
        window.location.href = '/login';
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);
