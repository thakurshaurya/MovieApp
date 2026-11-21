import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("stream_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync with /auth/me on mount to ensure valid session and latest profile
  useEffect(() => {
    const token = localStorage.getItem("stream_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api.get("/auth/me")
      .then(res => {
        if (res.data) {
          setUser(res.data);
          localStorage.setItem("stream_user", JSON.stringify(res.data));
        }
      })
      .catch(err => {
        // If token expired or invalid, clear local storage
        if (err.response?.status === 401) {
          localStorage.removeItem("stream_token");
          localStorage.removeItem("stream_user");
          setUser(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const authenticate = useCallback(async (endpoint, payload) => {
    const { data } = await api.post(`/auth/${endpoint}`, payload);
    localStorage.setItem("stream_token", data.token);
    localStorage.setItem("stream_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem("stream_user", JSON.stringify(updatedUserData));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("stream_token");
    localStorage.removeItem("stream_user");
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login: (p) => authenticate("login", p),
    register: (p) => authenticate("register", p),
    updateUser,
    logout
  }), [user, loading, authenticate, updateUser, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
