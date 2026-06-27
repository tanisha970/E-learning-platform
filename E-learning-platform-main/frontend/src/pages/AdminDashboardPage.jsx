// src/pages/AdminDashboardPage.jsx — with dark mode support
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import toast from "react-hot-toast";
import {
  FiUsers, FiBookOpen, FiDollarSign, FiTrendingUp,
  FiPlus, FiEdit2, FiTrash2, FiMessageSquare, FiHelpCircle
} from "react-icons/fi";
import { LoadingSpinner, StatCard } from "../components/common/UIComponents";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, courseRes, feedbackRes, studentsRes] = await Promise.all([
        API.get("/dashboard/admin"),
        API.get("/courses/admin/all"),
        API.get("/reviews/admin/all"),
        API.get("/auth/students"),
      ]);
      setStats(dashRes.data);
      setCourses(courseRes.data.courses);
      setFeedbacks(feedbackRes.data.reviews || []);
      setStudents(studentsRes.data.students || []);
    } catch (err) {
      toast.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/courses/${id}`);
      toast.success("Course deleted.");
      setCourses((prev) => prev.filter((c) => c._id !== id));
    } catch {
      toast.error("Failed to delete course.");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await API.delete(`/reviews/admin/${reviewId}`);
      toast.success("Review deleted!");
      setFeedbacks((prev) => prev.filter((r) => r._id !== reviewId));
    } catch {
      toast.error("Failed to delete review.");
    }
  };

  const handleToggleCommunity = async (courseId, currentStatus) => {
    try {
      const { data } = await API.put(`/community/${courseId}/toggle`);
      setCourses((prev) =>
        prev.map((c) =>
          c._id === courseId
            ? { ...c, communityEnabled: data.communityEnabled }
            : c
        )
      );
      toast.success(data.message);
    } catch {
      toast.error("Failed to toggle community.");
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Delete student "${studentName}"? This action cannot be undone and will remove all their enrollments.`)) return;
    try {
      await API.delete(`/auth/students/${studentId}`);
      toast.success("Student deleted successfully.");
      setStudents((prev) => prev.filter((s) => s._id !== studentId));
      // Refresh stats to update counts
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete student.");
    }
  };

  if (loading) return <LoadingSpinner center />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-6 transition-colors">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage courses, users, revenue and feedback</p>
          </div>
          <Link to="/admin/courses/new" className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-blue-700 transition text-sm">
            <FiPlus size={16} /> New Course
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit mb-8 flex-wrap">
          {["overview", "courses", "students", "feedback"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}>
              {tab}
              {tab === "feedback" && feedbacks.length > 0 && (
                <span className="ml-1.5 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {feedbacks.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={FiUsers} label="Total Students" value={stats?.stats?.totalUsers || 0} color="blue" />
              <StatCard icon={FiBookOpen} label="Total Courses" value={stats?.stats?.totalCourses || 0} color="green" />
              <StatCard icon={FiTrendingUp} label="Enrollments" value={stats?.stats?.totalEnrollments || 0} color="purple" />
              <StatCard icon={FiDollarSign} label="Revenue" value={`₹${(stats?.stats?.totalRevenue || 0).toLocaleString()}`} color="amber" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Enrollments</h2>
              {stats?.recentEnrollments?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentEnrollments.map((e) => (
                    <div key={e._id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{e.user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{e.course?.title}</p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(e.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No enrollments yet.</p>}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top Courses by Enrollment</h2>
              {stats?.topCourses?.length > 0 ? (
                <div className="space-y-3">
                  {stats.topCourses.map((c, idx) => (
                    <div key={c._id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">{c.title}</p>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full flex-shrink-0">{c.studentsEnrolled?.length || 0} students</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No course data yet.</p>}
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-semibold">Course</th>
                    <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-semibold hidden md:table-cell">Category</th>
                    <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-semibold">Price</th>
                    <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-semibold hidden sm:table-cell">Students</th>
                    <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-semibold hidden md:table-cell">Community</th>
                    <th className="text-right px-5 py-3 text-gray-600 dark:text-gray-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c._id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{c.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{c.instructor}</p>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">{c.category}</span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-800 dark:text-gray-200">
                        {c.price === 0 ? <span className="text-green-600 dark:text-green-400">Free</span> : `₹${c.price.toLocaleString()}`}
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-400">{c.studentsEnrolled?.length || 0}</td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <button
                          onClick={() => handleToggleCommunity(c._id, c.communityEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                            c.communityEnabled !== false
                              ? "bg-indigo-600"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                          title={c.communityEnabled !== false ? "Community Open — Click to close" : "Community Closed — Click to open"}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                              c.communityEnabled !== false ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/courses/${c._id}/quiz`} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition" title="Manage Quiz">
                            <FiHelpCircle size={15} />
                          </Link>
                          <Link to={`/admin/courses/edit/${c._id}`} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Edit">
                            <FiEdit2 size={15} />
                          </Link>
                          <button onClick={() => handleDeleteCourse(c._id, c.title)} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete">
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {courses.length === 0 && (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400 text-sm">
                  No courses yet.{" "}
                  <Link to="/admin/courses/new" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Create your first course</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white text-lg">All Students</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage student accounts</p>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold px-3 py-1 rounded-full">
                  {students.length} total
                </span>
              </div>
            </div>
            
            {students.length === 0 ? (
              <div className="text-center py-16">
                <FiUsers size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No students registered yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-semibold">Student</th>
                      <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-semibold hidden md:table-cell">Email</th>
                      <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-semibold hidden sm:table-cell">Enrolled Courses</th>
                      <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-400 font-semibold hidden lg:table-cell">Joined</th>
                      <th className="text-right px-5 py-3 text-gray-600 dark:text-gray-400 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 md:hidden">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">{student.email}</td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {student.enrolledCourses?.length || 0} courses
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs hidden lg:table-cell">
                          {new Date(student.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteStudent(student._id, student.name)} 
                            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition inline-flex items-center gap-1" 
                            title="Delete Student"
                          >
                            <FiTrash2 size={15} />
                            <span className="text-xs hidden sm:inline">Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white text-lg">All Reviews & Feedback</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Student course and teacher reviews</p>
              </div>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold px-3 py-1 rounded-full">
                {feedbacks.length} total
              </span>
            </div>

            {feedbacks.length === 0 ? (
              <div className="text-center py-16">
                <FiMessageSquare size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No feedback received yet.</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Students will submit reviews after enrolling in courses.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((r) => (
                  <div key={r._id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {r.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.user?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{r.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <button onClick={() => handleDeleteReview(r._id)}
                          className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-500 rounded-lg transition" title="Delete Review">
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 mb-3 text-xs flex flex-wrap gap-2">
                      <span><span className="text-blue-700 dark:text-blue-400 font-semibold">Course: </span><span className="text-blue-900 dark:text-blue-300">{r.course?.title}</span></span>
                      <span className="text-blue-400 dark:text-blue-500">•</span>
                      <span><span className="text-blue-700 dark:text-blue-400 font-semibold">Instructor: </span><span className="text-blue-900 dark:text-blue-300">{r.course?.instructor}</span></span>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Course Rating:</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <svg key={s} viewBox="0 0 24 24" className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-amber-400" : "fill-gray-200 dark:fill-gray-600"}`}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{r.rating}/5</span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">"{r.review}"</p>
                    </div>

                    {r.teacherFeedback && (
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">👨‍🏫 Teacher Feedback:</span>
                          {r.teacherRating && (
                            <>
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map((s) => (
                                  <svg key={s} viewBox="0 0 24 24" className={`w-3 h-3 ${s <= r.teacherRating ? "fill-indigo-400" : "fill-gray-200 dark:fill-gray-600"}`}>
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                  </svg>
                                ))}
                              </div>
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{r.teacherRating}/5</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2">"{r.teacherFeedback}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboardPage;