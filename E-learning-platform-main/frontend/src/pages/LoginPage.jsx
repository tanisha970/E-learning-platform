// src/pages/LoginPage.jsx — Fixed: role validation before persisting + redirect back support
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import API from "../utils/api";
import toast from "react-hot-toast";
import { FiMail, FiLock, FiBookOpen, FiEye, FiEyeOff, FiShield, FiUser } from "react-icons/fi";

const LoginPage = () => {
  const { login, confirmLogin } = useAuth();
  const { addNotification, refreshNotifications } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state (set when redirected from purchase)
  const redirectTo = location.state?.from || null;

  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const { data } = await API.post("/auth/resend-verification", { email: form.email });
      toast.success(data.message || "Verification email sent!");
      setShowResend(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password)
      return toast.error("Please fill in all fields.");

    setLoading(true);
    try {
      // login() now only fetches data, does NOT persist
      const data = await login(form.email, form.password);

      // Role mismatch check — user is NOT stored yet, so safe to reject
      if (role === "admin" && data.user.role !== "admin") {
        toast.error("❌ You are not an admin! Use Student Login.");
        setLoading(false);
        return;
      }
      if (role === "student" && data.user.role === "admin") {
        toast.error("❌ Admin account! Use Admin Login tab.");
        setLoading(false);
        return;
      }

      // Role check passed — now persist login
      confirmLogin(data);
      refreshNotifications();

      toast.success(`Welcome back, ${data.user.name}! 👋`);
      addNotification(`Welcome back, ${data.user.name}! 👋`, { type: "success" });

      // Redirect: if came from a page (e.g., course purchase), go back there
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else {
        navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
      }
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.isVerified === false) {
        setShowResend(true);
        toast.error("Please verify your email address to log in.");
      } else {
        toast.error(err.response?.data?.message || "Login failed. Check credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === "admin";

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-all duration-500 ${
      isAdmin
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900"
        : "bg-gradient-to-br from-blue-50 to-indigo-100"
    }`}>
      <div className="w-full max-w-md">

        {/* Redirect notice */}
        {redirectTo && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            🔒 Please log in to continue. You'll be redirected back after login.
          </div>
        )}

        {/* Resend verification notice */}
        {showResend && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex flex-col gap-2">
            <div className="font-medium">
              ⚠️ Email not verified. Please activate your account using the verification link sent to your email.
            </div>
            <button
              onClick={handleResendEmail}
              disabled={resending}
              type="button"
              className="text-left text-xs text-blue-600 hover:text-blue-700 font-semibold underline disabled:opacity-60 flex items-center gap-1.5"
            >
              {resending ? "Resending link..." : "Resend verification email"}
            </button>
          </div>
        )}

        {/* Role Toggle */}
        <div className={`flex p-1 rounded-2xl mb-6 border ${
          isAdmin ? "bg-white/10 border-white/20" : "bg-white border-gray-200 shadow-sm"
        }`}>
          <button
            onClick={() => { setRole("student"); setForm({ email: "", password: "" }); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              !isAdmin
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <FiUser size={16} /> Student Login
          </button>
          <button
            onClick={() => { setRole("admin"); setForm({ email: "", password: "" }); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              isAdmin
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FiShield size={16} /> Admin Login
          </button>
        </div>

        {/* Card */}
        <div className={`rounded-3xl shadow-2xl p-8 transition-all duration-300 ${
          isAdmin ? "bg-slate-800 border border-slate-700" : "bg-white"
        }`}>
          {/* Logo */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 font-display font-bold text-2xl mb-3 ${
              isAdmin ? "text-white" : "text-blue-700"
            }`}>
              {isAdmin ? <FiShield className="text-indigo-400" size={28} /> : <FiBookOpen className="text-blue-500" size={28} />}
              LearnHub
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-2 ${
              isAdmin ? "bg-indigo-900 text-indigo-300 border border-indigo-700" : "bg-blue-50 text-blue-600 border border-blue-100"
            }`}>
              {isAdmin ? "🔐 Admin Portal" : "🎓 Student Portal"}
            </div>
            <h1 className={`text-xl font-bold ${isAdmin ? "text-white" : "text-gray-900"}`}>
              Welcome back!
            </h1>
            <p className={`text-sm mt-1 ${isAdmin ? "text-slate-400" : "text-gray-500"}`}>
              {isAdmin ? "Access your admin dashboard" : "Continue your learning journey"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isAdmin ? "text-slate-300" : "text-gray-700"}`}>
                Email
              </label>
              <div className="relative">
                <FiMail className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isAdmin ? "text-slate-400" : "text-gray-400"}`} size={16} />
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange}
                  placeholder={isAdmin ? "admin@learnhub.com" : "you@example.com"}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                    isAdmin
                      ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:ring-indigo-500"
                      : "bg-white text-gray-900 placeholder-gray-400 border border-gray-200 focus:ring-blue-500 focus:border-transparent"
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isAdmin ? "text-slate-300" : "text-gray-700"}`}>
                Password
              </label>
              <div className="relative">
                <FiLock className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isAdmin ? "text-slate-400" : "text-gray-400"}`} size={16} />
                <input
                  type={showPass ? "text" : "password"} name="password" value={form.password}
                  onChange={handleChange} placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                    isAdmin
                      ? "bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:ring-indigo-500"
                      : "bg-white text-gray-900 placeholder-gray-400 border border-gray-200 focus:ring-blue-500 focus:border-transparent"
                  }`}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${isAdmin ? "text-slate-400" : "text-gray-400"}`}>
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className={`w-full font-semibold py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 ${
                isAdmin
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}>
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging in...</>
              ) : isAdmin ? "Access Dashboard" : "Log In"}
            </button>

            {/* Demo Hint */}
            <div className={`rounded-xl p-3 text-xs ${
              isAdmin ? "bg-slate-700 text-slate-300 border border-slate-600" : "bg-blue-50 text-blue-700"
            }`}>
              {isAdmin ? (
                <><strong>Demo Admin:</strong> admin@learnhub.com / admin123</>
              ) : (
                <><strong>Demo Student:</strong> student@learnhub.com / student123</>
              )}
            </div>
          </form>

          {/* Footer */}
          {!isAdmin && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 font-medium hover:underline">Sign up free</Link>
            </p>
          )}
          {isAdmin && (
            <p className="text-center text-xs text-slate-500 mt-6">
              Admin accounts are managed by system administrator
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;