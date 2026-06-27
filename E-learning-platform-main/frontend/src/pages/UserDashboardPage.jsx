// src/pages/UserDashboardPage.jsx — Updated with certificate download button
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import { FiBookOpen, FiCheckCircle, FiClock, FiPlay, FiAward, FiCreditCard, FiActivity } from "react-icons/fi";
import { LoadingSpinner, StatCard, EmptyState } from "../components/common/UIComponents";

const FALLBACK = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80";

const UserDashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    API.get("/dashboard/user")
      .then(({ data }) => { setData(data); setLoading(false); })
      .catch(() => setLoading(false));

    API.get("/payments/my")
      .then(({ data }) => setPayments(data.payments || []))
      .catch(() => {});
  }, []);

  if (loading) return <LoadingSpinner center />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-6 transition-colors">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Continue your learning journey</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FiBookOpen} label="Enrolled" value={data?.stats?.totalEnrolled || 0} color="blue" />
          <StatCard icon={FiPlay} label="In Progress" value={data?.stats?.inProgress || 0} color="amber" />
          <StatCard icon={FiCheckCircle} label="Completed" value={data?.stats?.completed || 0} color="green" />
          <StatCard icon={FiClock} label="Not Started" value={data?.stats?.notStarted || 0} color="purple" />
        </div>

        {/* Enrolled Courses */}
        <h2 className="font-semibold text-xl text-gray-900 dark:text-white mb-4">My Courses</h2>
        {data?.enrollments?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.enrollments.map(({ _id, course, progress, isCompleted }) => (
              <div key={_id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition">
                <Link to={`/courses/${course?._id}`}>
                  <img
                    src={course?.thumbnail || FALLBACK}
                    alt={course?.title}
                    className="w-full h-36 object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = FALLBACK; }}
                  />
                </Link>
                <div className="p-4">
                  <Link to={`/courses/${course?._id}`}>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2 hover:text-blue-600 transition">
                      {course?.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{course?.instructor}</p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Progress</span>
                      <span className={isCompleted ? "text-green-600 font-semibold" : "text-blue-600 font-semibold"}>
                        {isCompleted ? "Completed ✓" : `${progress}%`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Certificate Button — only if completed */}
                  {isCompleted && (
                    <Link
                      to={`/courses/${course?._id}/certificate`}
                      className="w-full flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700 text-xs font-semibold py-2 rounded-lg hover:bg-amber-100 transition"
                    >
                      <FiAward size={13} /> View Certificate
                    </Link>
                  )}

                  {/* Progress Report Link */}
                  <Link
                    to={`/courses/${course?._id}/progress`}
                    className="w-full flex items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700 text-xs font-semibold py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                  >
                    <FiActivity size={13} /> Progress Report
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FiBookOpen}
            title="No courses yet"
            description="Explore our catalog and start learning today!"
            action={
              <Link to="/courses" className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition">
                Browse Courses
              </Link>
            }
          />
        )}
        {/* ── Payment History ──────────────────────────────── */}
        {payments.length > 0 && (
          <div className="mt-10">
            <h2 className="font-semibold text-xl text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiCreditCard size={20} className="text-blue-500" /> Purchase History
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-5 py-3 font-medium">Course</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.course?.thumbnail || FALLBACK}
                            alt={p.course?.title}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => { e.target.src = FALLBACK; }}
                          />
                          <span className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                            {p.course?.title || "Deleted Course"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300 font-semibold">
                        ₹{(p.amount / 100).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <FiCheckCircle size={11} /> Paid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;