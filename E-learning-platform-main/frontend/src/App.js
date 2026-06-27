// src/App.js — Updated with all new routes + ThemeProvider + NotificationProvider
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CourseFormPage from "./pages/CourseFormPage";
import QuizFormPage from "./pages/QuizFormPage";
import QuizPage from "./pages/QuizPage";
import ProfilePage from "./pages/ProfilePage";
import CertificatePage from "./pages/CertificatePage";
import ProgressReportPage from "./pages/ProgressReportPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen font-sans dark:bg-gray-950 transition-colors">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* ── Public Routes ── */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/courses/:id" element={<CourseDetailPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />

                  {/* ── Student Protected Routes ── */}
                  <Route path="/dashboard" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
                  <Route path="/courses/:id/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
                  <Route path="/courses/:id/certificate" element={<ProtectedRoute><CertificatePage /></ProtectedRoute>} />
                  <Route path="/courses/:id/progress" element={<ProtectedRoute><ProgressReportPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                  {/* ── Admin Protected Routes ── */}
                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>} />
                  <Route path="/admin/courses/new" element={<ProtectedRoute adminOnly><CourseFormPage /></ProtectedRoute>} />
                  <Route path="/admin/courses/edit/:id" element={<ProtectedRoute adminOnly><CourseFormPage /></ProtectedRoute>} />
                  <Route path="/admin/courses/:id/quiz" element={<ProtectedRoute adminOnly><QuizFormPage /></ProtectedRoute>} />

                  {/* ── 404 ── */}
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                      <div className="text-center">
                        <h1 className="text-7xl font-display font-bold text-gray-200 dark:text-gray-700 mb-4">404</h1>
                        <p className="text-gray-500 text-lg mb-6">Page not found.</p>
                        <a href="/" className="text-blue-600 hover:underline text-sm font-medium">← Go back home</a>
                      </div>
                    </div>
                  } />
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster position="top-right" toastOptions={{ duration: 3500, style: { borderRadius: "12px", fontSize: "14px" } }} />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;