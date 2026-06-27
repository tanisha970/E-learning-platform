// components/course/ReviewSection.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import API from "../../utils/api";
import toast from "react-hot-toast";
import { FiStar, FiEdit2 } from "react-icons/fi";

// Star Rating Component
const StarRating = ({ value, onChange, readOnly = false, size = "md" }) => {
  const [hovered, setHovered] = useState(0);
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`${sizes[size]} transition-colors ${
            readOnly ? "cursor-default" : "cursor-pointer"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className={`w-full h-full transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            }`}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const ReviewSection = ({ courseId, isEnrolled }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [avgRating, setAvgRating] = useState(0);
  const [distribution, setDistribution] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    rating: 0,
    review: "",
    teacherRating: 0,
    teacherFeedback: "",
  });

  // Fetch all reviews
  const fetchReviews = async () => {
    try {
      const { data } = await API.get(`/reviews/${courseId}`);
      setReviews(data.reviews);
      setAvgRating(data.avgRating);
      setDistribution(data.distribution);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the current user's review
  const fetchMyReview = async () => {
    if (!user) return;
    try {
      const { data } = await API.get(`/reviews/${courseId}/my`);
      if (data.review) {
        setMyReview(data.review);
        setForm({
          rating: data.review.rating,
          review: data.review.review,
          teacherRating: data.review.teacherRating || 0,
          teacherFeedback: data.review.teacherFeedback || "",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchMyReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating === 0) return toast.error("Please select a rating!");
    if (!form.review.trim()) return toast.error("Please write a review!");

    setSubmitting(true);
    try {
      await API.post(`/reviews/${courseId}`, form);
      toast.success(myReview ? "Review updated! ✅" : "Review submitted! 🎉");
      addNotification(
        myReview
          ? "Your review has been updated! Admin has been notified. ✅"
          : "Review submitted successfully! Admin has been notified. 🎉",
        { type: "success" }
      );
      setShowForm(false);
      fetchReviews();
      fetchMyReview();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 mt-6 transition-colors">
      <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-6">
        Student Reviews
      </h2>

      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-8 p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          {/* Average */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 dark:text-white">{avgRating}</div>
            <StarRating value={Math.round(avgRating)} readOnly size="sm" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reviews.length} reviews</p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const percent =
                reviews.length > 0
                  ? Math.round((count / reviews.length) * 100)
                  : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-gray-600 dark:text-gray-400">{star}</span>
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-amber-400">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-amber-400 h-2 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-6 text-gray-500 dark:text-gray-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {isEnrolled && user && (
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm"
            >
              <FiStar size={15} />
              {myReview ? "Edit Your Review" : "Write a Review"}
            </button>
          ) : (
            /* Review Form */
            <form
              onSubmit={handleSubmit}
              className="border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-5 space-y-4"
            >
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {myReview ? "Edit Your Review" : "Write a Review"}
              </h3>

              {/* Course Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Rating <span className="text-red-500">*</span>
                </label>
                <StarRating
                  value={form.rating}
                  onChange={(val) => setForm({ ...form, rating: val })}
                  size="lg"
                />
              </div>

              {/* Course Review */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Course Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.review}
                  onChange={(e) =>
                    setForm({ ...form, review: e.target.value })
                  }
                  rows={3}
                  maxLength={500}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="What did you think about the course? Was it helpful?"
                  required
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-1">
                  {form.review.length}/500
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-blue-200 dark:border-blue-900/30 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  📝 Teacher Feedback (Optional)
                </p>

                {/* Teacher Rating */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teacher Rating
                  </label>
                  <StarRating
                    value={form.teacherRating}
                    onChange={(val) =>
                      setForm({ ...form, teacherRating: val })
                    }
                    size="md"
                  />
                </div>

                {/* Teacher Feedback */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Feedback about the Teacher
                  </label>
                  <textarea
                    value={form.teacherFeedback}
                    onChange={(e) =>
                      setForm({ ...form, teacherFeedback: e.target.value })
                    }
                    rows={3}
                    maxLength={500}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="Share your thoughts on the teacher's style, clarity, and helpfulness..."
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400 dark:text-gray-500">
          <FiStar size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No reviews yet.</p>
          {isEnrolled && (
            <p className="text-xs mt-1">Be the first to write a review!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r._id}
              className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {r.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {r.user?.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <StarRating value={r.rating} readOnly size="sm" />
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {r.review}
              </p>

              {/* Teacher feedback section */}
              {r.teacherFeedback && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <FiEdit2 size={12} className="text-indigo-500" />
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Teacher Feedback
                    </span>
                    {r.teacherRating && (
                      <StarRating
                        value={r.teacherRating}
                        readOnly
                        size="sm"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {r.teacherFeedback}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;