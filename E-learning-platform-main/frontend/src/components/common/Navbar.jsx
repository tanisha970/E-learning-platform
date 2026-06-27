// src/components/common/Navbar.jsx — With dark mode toggle + persistent notifications
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import {
  FiMenu, FiX, FiBookOpen, FiUser, FiLogOut,
  FiGrid, FiMoon, FiSun, FiBell, FiAward, FiCheck, FiTrash2
} from "react-icons/fi";

// Format time ago
const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Notification type border colors
const typeBorders = {
  success: "border-l-green-500",
  info: "border-l-blue-500",
  warning: "border-l-amber-500",
  error: "border-l-red-500",
};

const typeBg = {
  success: "bg-green-50 dark:bg-green-900/20",
  info: "bg-blue-50 dark:bg-blue-900/20",
  warning: "bg-amber-50 dark:bg-amber-900/20",
  error: "bg-red-50 dark:bg-red-900/20",
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { notifications, unreadCount, dismissNotification, markAllRead, clearAll, stopPolling } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    stopPolling();   // Clear all notifications & stop background fetching
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-blue-700 dark:text-blue-400">
            <FiBookOpen className="text-2xl text-blue-500" />
            <span>LearnHub</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/courses"
              className={`text-sm font-medium transition-colors ${isActive("/courses") ? "text-blue-600" : "text-gray-600 dark:text-gray-300 hover:text-blue-600"}`}>
              Browse Courses
            </Link>

            {/* Dark Mode Toggle */}
            <button onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title={darkMode ? "Light Mode" : "Dark Mode"}>
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                    className="relative p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <FiBell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
                      style={{ maxHeight: "520px" }}>
                      
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</p>
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllRead}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 transition flex items-center gap-1 font-medium"
                              title="Mark all as read"
                            >
                              <FiCheck size={12} /> Mark read
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button
                              onClick={clearAll}
                              className="text-xs text-gray-400 hover:text-red-500 transition flex items-center gap-1"
                              title="Clear all"
                            >
                              <FiTrash2 size={12} /> Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Notification list */}
                      <div className="overflow-y-auto" style={{ maxHeight: "440px" }}>
                        {notifications.length === 0 ? (
                          <div className="text-center py-14 px-4">
                            <FiBell size={32} className="mx-auto text-gray-200 dark:text-gray-600 mb-3" />
                            <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet</p>
                            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">You'll see notifications here when something happens</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`px-4 py-3 border-l-4 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                                typeBorders[n.type] || typeBorders.info
                              } ${
                                n.unread ? (typeBg[n.type] || typeBg.info) : "bg-white dark:bg-gray-800"
                              } ${
                                n.exiting ? "opacity-0 -translate-x-8 max-h-0 py-0 overflow-hidden" : "opacity-100 max-h-40"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    {n.unread && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                    )}
                                    <p className={`text-sm leading-snug ${n.unread ? "text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-300"}`}>
                                      {n.text}
                                    </p>
                                  </div>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-4">{timeAgo(n.time)}</p>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                                  className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 mt-0.5"
                                  title="Dismiss"
                                >
                                  <FiX size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-full transition">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name.split(" ")[0]}</span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50">
                      <Link to={user.role === "admin" ? "/admin" : "/dashboard"}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700"
                        onClick={() => setDropdownOpen(false)}>
                        <FiGrid size={14} />
                        {user.role === "admin" ? "Admin Dashboard" : "My Dashboard"}
                      </Link>
                      <Link to="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700"
                        onClick={() => setDropdownOpen(false)}>
                        <FiUser size={14} /> My Profile
                      </Link>
                      {user.role === "student" && (
                        <Link to="/dashboard"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700"
                          onClick={() => setDropdownOpen(false)}>
                          <FiAward size={14} /> My Certificates
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100 dark:border-gray-700" />
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <FiLogOut size={14} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 transition">
                  Log In
                </Link>
                <Link to="/register"
                  className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-blue-700 transition">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleDarkMode} className="p-2 text-gray-500 dark:text-gray-300">
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            {user && (
              <button onClick={() => { setNotifOpen(!notifOpen); }}
                className="relative p-2 text-gray-500 dark:text-gray-300">
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <button className="text-gray-600 dark:text-gray-300" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-4 space-y-3">
          <Link to="/courses" className="block text-sm text-gray-700 dark:text-gray-200" onClick={() => setMenuOpen(false)}>Browse Courses</Link>
          {user ? (
            <>
              <Link to={user.role === "admin" ? "/admin" : "/dashboard"} className="block text-sm text-gray-700 dark:text-gray-200" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/profile" className="block text-sm text-gray-700 dark:text-gray-200" onClick={() => setMenuOpen(false)}>Profile</Link>
              <button onClick={handleLogout} className="block text-sm text-red-600">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-sm text-gray-700 dark:text-gray-200" onClick={() => setMenuOpen(false)}>Log In</Link>
              <Link to="/register" className="block text-sm text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;