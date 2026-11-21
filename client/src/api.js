import axios from "axios";
import { Capacitor } from "@capacitor/core";

const PRODUCTION_API_URL = "https://movieapp-six-lovat.vercel.app/api";

function resolveApiBaseUrl() {
  // 1. Capacitor Native Mobile App (Android / iOS):
  // ALWAYS connect to the cloud production backend because localhost on mobile is the phone itself.
  if (Capacitor.isNativePlatform()) {
    return import.meta.env.VITE_MOBILE_API_URL || PRODUCTION_API_URL;
  }

  // 2. Custom override via localStorage (if set by developer for testing)
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("antarctic_api_url");
    if (custom) return custom;
  }

  // 3. Local Web Development (npm run dev):
  // If VITE_API_URL is specified (e.g. http://localhost:5001/api), use it in dev.
  // Otherwise, fallback to the relative path "/api" which Vite's dev server proxies to http://localhost:5001.
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || "/api";
  }

  // 4. Production Web Deployment (Vercel):
  // Both frontend and backend are hosted on the same origin, so relative "/api" works out-of-the-box.
  return "/api";
}

const api = axios.create({ baseURL: resolveApiBaseUrl() });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("stream_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
