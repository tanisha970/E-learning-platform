// src/context/AuthContext.js — Global auth state (cleaned up — no more destructive side effects)
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, restore user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Register
  const register = async (name, email, password) => {
    const { data } = await API.post("/auth/register", { name, email, password });
    return data;
  };

  // Login — Returns data but does NOT persist to localStorage/state yet.
  // Caller must call confirmLogin(data) to commit.
  const login = async (email, password) => {
    const { data } = await API.post("/auth/login", { email, password });
    return data;
  };

  // Confirm login — actually persist user and token after validation passes
  const confirmLogin = useCallback((data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await API.get("/auth/me");
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (err) {
      // Only logout if the error is specifically a 401 (token expired/invalid)
      if (err.response?.status === 401) {
        logout();
      }
      // For other errors (network, 500), keep the user logged in
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, confirmLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
