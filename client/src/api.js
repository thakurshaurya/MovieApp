import axios from "axios";
import { Capacitor } from "@capacitor/core";

function resolveApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const custom = typeof window !== "undefined" ? localStorage.getItem("antarctic_api_url") : null;
  if (custom) {
    return custom;
  }

  // Capacitor Native Android Detection: use production Vercel backend URL
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
    return "https://movieapp-six-lovat.vercel.app/api";
  }

  // In web browsers (Vercel deployment or local Vite proxy), use relative /api
  return "/api";
}

const api = axios.create({ baseURL: resolveApiBaseUrl() });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("stream_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
