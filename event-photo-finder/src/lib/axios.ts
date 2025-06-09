// src/lib/axios.ts
import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_EXTERNAL_API,
  timeout: 10000000,
});

// Keep track of refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();

  if (session) {
    const tokenResponse = await fetch("/api/auth/token");
    const { token } = await tokenResponse.json();

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh session
        const session = await getSession();
        if (session) {
          processQueue(null, "refreshed");
          return apiClient(originalRequest);
        } else {
          // No session, redirect to login
          await signOut({ redirect: false });
          window.location.href = "/auth/signin";
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        await signOut({ redirect: false });
        window.location.href = "/auth/signin";
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
