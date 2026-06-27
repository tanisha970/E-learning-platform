// src/pages/CourseDetailPage.jsx — Course info, video player, Razorpay payment + free enrollment
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import API from "../utils/api";
import toast from "react-hot-toast";
import {
  FiUsers, FiBookOpen, FiClock, FiStar, FiPlay,
  FiLock, FiCheckCircle, FiArrowLeft
} from "react-icons/fi";
import { LoadingSpinner } from "../components/common/UIComponents";
import ReviewSection from "../components/course/ReviewSection";
import CommunityChat from "../components/course/CommunityChat";

const FALLBACK = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80";

// Safety net: convert YouTube URLs to embed format at display time
const toEmbedUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  if (url.includes("youtube.com/embed/")) return url;
  let videoId = null;
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) videoId = watchMatch[1];
  if (!videoId) { const m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/); if (m) videoId = m[1]; }
  if (!videoId) { const m = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/); if (m) videoId = m[1]; }
  if (!videoId) { const m = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/); if (m) videoId = m[1]; }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

const CourseDetailPage = () => {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await API.get(`/courses/${id}`);
        setCourse(data.course);
        setIsEnrolled(data.isEnrolled);
        setEnrollment(data.enrollment);
        if (data.course.videos?.length > 0) {
          setActiveVideo(data.course.videos[0]);
        }
      } catch (err) {
        toast.error("Course not found.");
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id, navigate]);

  // Mark video as completed
  const markVideoCompleted = async (videoId) => {
    try {
      await API.put(`/enrollments/${id}/progress`, { videoId });
      const { data } = await API.get(`/courses/${id}`);
      setEnrollment(data.enrollment);
    } catch (err) {
      console.error(err);
    }
  };

  const isVideoCompleted = (videoId) => {
    return enrollment?.completedVideos?.includes(videoId);
  };

  // Helper — re-fetch course after enrollment to refresh UI
  const refreshCourseData = async () => {
    await refreshUser();
    const { data } = await API.get(`/courses/${id}`);
    setCourse(data.course);
    setIsEnrolled(data.isEnrolled);
    setEnrollment(data.enrollment);
    if (data.course.videos?.length > 0) {
      setActiveVideo(data.course.videos[0]);
    }
  };

  // Load Razorpay checkout SDK dynamically
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Smart enroll: Razorpay for paid courses, direct for free
  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please login to enroll in this course.");
      return navigate("/login", { state: { from: `/courses/${id}` } });
    }

    // ── FREE COURSE ──────────────────────────────────────────────
    if (course.price === 0) {
      setEnrolling(true);
      try {
        await API.post("/enrollments", { courseId: id });
        toast.success("Enrolled successfully! 🎉");
        addNotification(`You've enrolled in "${course.title}"! Start learning now. 🎉`, { type: "success" });
        await refreshCourseData();
      } catch (err) {
        toast.error(err.response?.data?.message || "Enrollment failed.");
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // ── PAID COURSE — Razorpay ───────────────────────────────────
    setEnrolling(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        setEnrolling(false);
        return;
      }

      // Step 1: Create order on backend
      const { data: orderData } = await API.post("/payments/create-order", { courseId: id });

      // Detect simulation mode (dummy credentials)
      if (orderData.key === "rzp_test_dummy" || (orderData.order?.id && orderData.order.id.startsWith("order_mock_"))) {
        toast("Development Mode: Simulating payment flow...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        try {
          await API.post("/payments/verify", {
            razorpay_order_id: orderData.order.id,
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
            razorpay_signature: "mock_signature",
            courseId: id,
          });
          toast.success("Payment successful! You're now enrolled (Mocked). 🎉");
          addNotification(`You've purchased "${course.title}"! Start learning now. 🎉`, { type: "success" });
          await refreshCourseData();
        } catch (err) {
          toast.error(err.response?.data?.message || "Mock payment verification failed.");
        } finally {
          setEnrolling(false);
        }
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "LearnHub",
        description: orderData.course.title,
        order_id: orderData.order.id,
        handler: async (response) => {
          // Step 2: Verify payment on backend
          try {
            await API.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: id,
            });
            toast.success("Payment successful! You're now enrolled. 🎉");
            addNotification(`You've purchased "${course.title}"! Start learning now. 🎉`, { type: "success" });
            await refreshCourseData();
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed.");
          } finally {
            setEnrolling(false);
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: { color: "#2563EB" },
        modal: {
          ondismiss: () => {
            setEnrolling(false);
            toast("Payment cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setEnrolling(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not initiate payment.");
      setEnrolling(false);
    }
  };

  if (loading) return <LoadingSpinner center />;
  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Back Button */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
            <FiArrowLeft size={14} /> Back to Courses
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── Left: Course Details + Video Player ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          {isEnrolled && activeVideo ? (
            <div className="bg-black rounded-2xl overflow-hidden aspect-video">
              {activeVideo.videoType === "upload" ? (
                <video
                  key={activeVideo._id}
                  src={`${process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000'}${activeVideo.url}`}
                  title={activeVideo.title}
                  className="w-full h-full"
                  controls
                  controlsList="nodownload"
                />
              ) : (
                <iframe
                  src={toEmbedUrl(activeVideo.url)}
                  title={activeVideo.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              )}
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden aspect-video">
              <img src={course.thumbnail || FALLBACK} alt={course.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <FiLock size={40} className="mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-medium">Enroll to unlock course content</p>
                </div>
              </div>
            </div>
          )}

          {/* Active video title */}
          {isEnrolled && activeVideo && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Now Playing</p>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{activeVideo.title}</h3>
              </div>
              {!isVideoCompleted(activeVideo._id) && (
                <button
                  onClick={() => markVideoCompleted(activeVideo._id)}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 flex items-center gap-1"
                >
                  <FiCheckCircle size={12} /> Mark Complete
                </button>
              )}
              {isVideoCompleted(activeVideo._id) && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full flex items-center gap-1">
                  <FiCheckCircle size={12} /> Completed
                </span>
              )}
            </div>
          )}

          {/* Course Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full">{course.category}</span>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">{course.level}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">{course.description}</p>

            <div className="flex flex-wrap gap-5 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5"><FiUsers size={15} /> {course.studentsEnrolled?.length || 0} students</span>
              <span className="flex items-center gap-1.5"><FiBookOpen size={15} /> {course.videos?.length || 0} lessons</span>
              <span className="flex items-center gap-1.5"><FiStar size={15} className="text-amber-400" /> {course.rating?.toFixed(1) || "4.5"} rating</span>
              <span className="flex items-center gap-1.5"><FiClock size={15} /> Instructor: {course.instructor}</span>
            </div>
          </div>

          {/* Video Curriculum */}
          {course.videos && course.videos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Course Curriculum</h2>
              <div className="space-y-2">
                {course.videos.map((video, idx) => (
                  <div
                    key={video._id}
                    onClick={() => isEnrolled && setActiveVideo(video)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition ${
                      isEnrolled ? "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20" : "cursor-not-allowed opacity-60"
                    } ${activeVideo?._id === video._id ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" : "border border-transparent"}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isVideoCompleted(video._id) ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}>
                      {isVideoCompleted(video._id) ? <FiCheckCircle size={14} /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{video.title}</p>
                      {video.duration && <p className="text-xs text-gray-400 dark:text-gray-500">{video.duration}</p>}
                    </div>
                    {isEnrolled ? (
                      <FiPlay size={14} className="text-blue-500 flex-shrink-0" />
                    ) : (
                      <FiLock size={14} className="text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right: Enrollment Card & Chat ─── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 flex flex-col">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-md">
            <img
              src={course.thumbnail || FALLBACK}
              alt={course.title}
              className="w-full h-40 object-cover rounded-xl mb-5"
            />

            {isEnrolled ? (
              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Your Progress</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{enrollment?.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${enrollment?.progress || 0}%` }}
                    />
                  </div>
                </div>

                {enrollment?.isCompleted ? (
                  <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-center py-3 rounded-xl text-sm font-semibold border border-green-200 dark:border-green-800">
                    🎉 Course Completed!
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {enrollment?.completedVideos?.length || 0} of {course.videos?.length || 0} lessons completed
                    </p>
                  </div>
                )}

                <Link
                  to={`/courses/${id}/progress`}
                  className="w-full block text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition text-sm"
                >
                  📊 View Progress Report
                </Link>

                <Link
                  to={`/courses/${id}/quiz`}
                  className="w-full block text-center bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition text-sm"
                >
                  Take Quiz
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {course.price === 0 ? "Free" : `₹${course.price.toLocaleString()}`}
                  </span>
                  {course.price > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">One-time enrollment</p>
                  )}
                </div>

                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {enrolling ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {course.price === 0 ? "Enrolling..." : "Processing..."}</>
                  ) : course.price === 0 ? "Enroll for Free" : `Pay ₹${course.price.toLocaleString()} & Enroll`}
                </button>

                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2"><FiCheckCircle className="text-green-500" size={14} /> Full lifetime access</li>
                  <li className="flex items-center gap-2"><FiCheckCircle className="text-green-500" size={14} /> {course.videos?.length || 0} video lessons</li>
                  <li className="flex items-center gap-2"><FiCheckCircle className="text-green-500" size={14} /> Quiz & certificate</li>
                  <li className="flex items-center gap-2"><FiCheckCircle className="text-green-500" size={14} /> Mobile & desktop access</li>
                </ul>
              </div>
            )}
          </div>

          {/* Community Chat — only for enrolled students and admins */}
          {(isEnrolled || user?.role === "admin") && (
            <CommunityChat
              courseId={id}
              isEnrolled={isEnrolled}
              communityEnabled={course.communityEnabled}
            />
          )}
          </div>
        </div>
        {/* Reviews Section */}
        <div className="lg:col-span-2">
          <ReviewSection courseId={id} isEnrolled={isEnrolled} />
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
