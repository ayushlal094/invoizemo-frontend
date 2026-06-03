import axios, { type AxiosRequestConfig } from 'axios';
import { tokenStore } from '../../auth/tokenStore';
import { refreshClient } from './refreshClient';
import { env } from '../env';

export const client = axios.create({
  baseURL: env.VITE_API_BASE_URL + '/api/v1',
  withCredentials: true,
  timeout: 10_000,
});

// Attach current access token to every outgoing request
client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh queue — prevents duplicate /auth/refresh calls
// when multiple requests fire simultaneously with an expired token.
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

client.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const original = error.config as RetryableConfig | undefined;
    const isTokenExpired =
      error.response?.status === 401 &&
      (error.response?.data as { error?: { code?: string } })?.error?.code === 'TOKEN_EXPIRED';

    if (!isTokenExpired || !original || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    // Queue concurrent requests while refresh is in flight
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        if (original.headers) {
          original.headers.Authorization = `Bearer ${token}`;
        }
        return client(original);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await refreshClient.post<{ data: { accessToken: string } }>('/auth/refresh');
      const newToken = data.data.accessToken;

      tokenStore.set(newToken);
      refreshQueue.forEach((p) => p.resolve(newToken));
      refreshQueue = [];

      if (original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`;
      }
      return client(original);
    } catch (refreshError) {
      refreshQueue.forEach((p) => p.reject(refreshError));
      refreshQueue = [];
      tokenStore.clear();
      // Redirect to login, preserving the intended destination
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
