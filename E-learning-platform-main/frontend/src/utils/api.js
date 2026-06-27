// src/utils/api.js — Axios instance with auth token interceptor
// IMPORTANT: The response interceptor does NOT clear auth or redirect.
// Auth failures are handled by React components (ProtectedRoute, refreshUser).
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — only reject the promise, NO side effects.
// No localStorage clearing, no redirects, no logouts.
// Each component handles its own errors via try/catch.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Simply pass the error through — let the calling component handle it
    return Promise.reject(error);
  }
);

export default API;
