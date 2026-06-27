// src/context/NotificationContext.js — Persistent notifications + backend sync
// Notifications stay in the panel until manually dismissed. No auto-dismiss.
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import API from "../utils/api";

const NotificationContext = createContext();

let nextLocalId = 10000;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const fetchIntervalRef = useRef(null);

  // Fetch notifications from backend — wrapped in safety checks
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      // Only fetch if user is actually logged in
      if (!token || !storedUser) return;

      const { data } = await API.get("/notifications");
      if (data.success) {
        setNotifications((prev) => {
          // Keep only local notifications added DURING this session
          const localOnly = prev.filter((n) => n.isLocal);
          const serverNotifs = data.notifications.map((n) => ({
            id: n._id,
            text: n.message,
            title: n.title,
            type: getTypeFromNotifType(n.type),
            time: n.createdAt,
            unread: !n.read,
            isLocal: false,
          }));
          return [...localOnly, ...serverNotifs];
        });
      }
    } catch (err) {
      // Silently fail — do NOT clear auth, do NOT redirect, just ignore.
      // Could be network error, server restart, etc.
      console.debug("Notification fetch failed (non-critical):", err.message);
    }
  }, []);

  const getTypeFromNotifType = (type) => {
    switch (type) {
      case "course_added": return "info";
      case "enrollment": return "success";
      case "feedback": return "warning";
      default: return "info";
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchNotifications();
      fetchIntervalRef.current = setInterval(fetchNotifications, 30000);
    }
    return () => {
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
    };
  }, [fetchNotifications]);

  // Add a LOCAL notification — stays in panel until manual dismiss
  const addNotification = useCallback((text, { type = "info" } = {}) => {
    const id = `local-${nextLocalId++}`;
    const notification = {
      id,
      text,
      type,
      time: new Date().toISOString(),
      unread: true,
      isLocal: true,
    };
    setNotifications((prev) => [notification, ...prev]);
    return id;
  }, []);

  // Dismiss a single notification (manual X click only)
  const dismissNotification = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, exiting: true } : n))
    );

    // If it's a server notification, delete from backend
    if (typeof id === "string" && !id.startsWith("local-")) {
      try {
        await API.delete(`/notifications/${id}`);
      } catch (err) {
        // Silently fail
      }
    }

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 350);
  }, []);

  // Mark all as read — only clears the BADGE COUNT, keeps notifications visible
  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await API.put("/notifications/read-all");
      }
    } catch (err) {
      // Silently fail
    }
  }, []);

  // Clear all notifications (explicit user action)
  const clearAll = useCallback(async () => {
    setNotifications([]);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await API.delete("/notifications/clear-all");
      }
    } catch (err) {
      // Silently fail
    }
  }, []);

  // Re-fetch from server (call after login) — clears old state first
  const refreshNotifications = useCallback(() => {
    // Wipe all old notifications so nothing leaks across accounts
    setNotifications([]);
    fetchNotifications();
    if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
    fetchIntervalRef.current = setInterval(fetchNotifications, 30000);
  }, [fetchNotifications]);

  // Stop polling when logged out
  const stopPolling = useCallback(() => {
    if (fetchIntervalRef.current) {
      clearInterval(fetchIntervalRef.current);
      fetchIntervalRef.current = null;
    }
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread && !n.exiting).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        dismissNotification,
        markAllRead,
        clearAll,
        refreshNotifications,
        stopPolling,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
};
