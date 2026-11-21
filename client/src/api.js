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

  // Capacitor Native Android Detection
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
    // 10.0.2.2 is the Android emulator's loopback alias to the host computer
    return "http://10.0.2.2:5001/api";
  }

  return "http://localhost:5001/api";
}

const api = axios.create({ baseURL: resolveApiBaseUrl() });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("stream_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
