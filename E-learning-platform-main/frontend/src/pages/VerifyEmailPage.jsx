// src/pages/VerifyEmailPage.jsx
import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import API from "../utils/api";
import { FiCheckCircle, FiAlertTriangle, FiLoader, FiBookOpen } from "react-icons/fi";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("");
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    const verify = async () => {
      if (!token || !email) {
        setStatus("error");
        setMessage("Invalid verification link. Token or email is missing.");
        return;
      }

      try {
        const { data } = await API.get(`/auth/verify-email?token=${token}&email=${email}`);
        setStatus("success");
        setMessage(data.message || "Your email has been verified successfully!");
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification link is invalid or has expired.");
      }
    };

    verify();
  }, [token, email]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12 transition-all">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
          
          {/* Logo header */}
          <div className="inline-flex items-center gap-2 text-blue-700 font-display font-bold text-2xl mb-8">
            <FiBookOpen className="text-blue-500" size={28} />
            LearnHub
          </div>

          {/* Verification states */}
          {status === "loading" && (
            <div className="flex flex-col items-center py-6">
              <FiLoader className="text-blue-600 animate-spin mb-4" size={48} />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying your email</h1>
              <p className="text-gray-500 text-sm">Please hold on while we validate your credentials...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-5 border border-green-100">
                <FiCheckCircle className="text-green-500" size={36} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Email Verified!</h1>
              <p className="text-gray-600 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
                {message} You can now log in to your account and start learning.
              </p>
              <Link
                to="/login"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 block text-center"
              >
                Log In to Your Account
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 border border-red-100">
                <FiAlertTriangle className="text-red-500" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Verification Failed</h1>
              <p className="text-gray-600 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
                {message}
              </p>
              <div className="w-full space-y-3">
                <Link
                  to="/login"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 block text-center"
                >
                  Back to Login
                </Link>
                <Link
                  to="/register"
                  className="w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition block text-center text-sm"
                >
                  Create another account
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
