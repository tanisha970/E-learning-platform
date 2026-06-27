// controllers/reviewController.js — Reviews + notifications to admin on feedback
const Review = require("../models/Review");
const Enrollment = require("../models/Enrollment");
const { notifyAdmins } = require("./notificationController");

// @desc    Submit Review + Feedback
// @route   POST /api/reviews/:courseId
// @access  Private (Enrolled Student only)
exports.submitReview = async (req, res, next) => {
  try {
    const { rating, review, teacherFeedback, teacherRating } = req.body;
    const courseId = req.params.courseId;

    // Only enrolled students can submit a review
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "Only enrolled students can submit a review.",
      });
    }

    // Validation
    if (!rating || !review) {
      return res.status(400).json({
        success: false,
        message: "Both rating and review are required.",
      });
    }

    // If a review already exists, update it
    const existingReview = await Review.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.review = review;
      existingReview.teacherFeedback = teacherFeedback || "";
      existingReview.teacherRating = teacherRating || null;
      await existingReview.save();

      // 🔔 Notify admins about updated feedback
      try {
        const Course = require("../models/Course");
        const course = await Course.findById(courseId).select("title");
        await notifyAdmins({
          type: "feedback",
          title: "Review Updated 📝",
          message: `${req.user.name} updated their review for "${course?.title || "a course"}" — Rating: ${rating}/5`,
          relatedCourse: courseId,
          relatedUser: req.user._id,
        });
      } catch (notifErr) {
        console.error("Notification error:", notifErr);
      }

      return res.status(200).json({
        success: true,
        message: "Review updated successfully!",
        review: existingReview,
      });
    }

    // Create a new review
    const newReview = await Review.create({
      user: req.user._id,
      course: courseId,
      rating,
      review,
      teacherFeedback: teacherFeedback || "",
      teacherRating: teacherRating || null,
    });

    // 🔔 Notify admins about new feedback/review
    try {
      const Course = require("../models/Course");
      const course = await Course.findById(courseId).select("title");
      await notifyAdmins({
        type: "feedback",
        title: "New Student Feedback! 💬",
        message: `${req.user.name} reviewed "${course?.title || "a course"}" — Rating: ${rating}/5${teacherFeedback ? " (includes teacher feedback)" : ""}`,
        relatedCourse: courseId,
        relatedUser: req.user._id,
      });
    } catch (notifErr) {
      console.error("Notification error:", notifErr);
    }

    res.status(201).json({
      success: true,
      message: "Review submitted successfully! 🎉",
      review: newReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a course
// @route   GET /api/reviews/:courseId
// @access  Public
exports.getCourseReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ course: req.params.courseId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Rating distribution (count of 5-star, 4-star, etc.)
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => distribution[r.rating]++);

    res.status(200).json({
      success: true,
      count: reviews.length,
      avgRating: Math.round(avgRating * 10) / 10,
      distribution,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the logged-in student's own review
// @route   GET /api/reviews/:courseId/my
// @access  Private
exports.getMyReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      user: req.user._id,
      course: req.params.courseId,
    });

    res.status(200).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin - delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Admin only
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    await Review.findByIdAndDelete(req.params.reviewId);

    // Update the course's average rating
    const Course = require("../models/Course");
    const reviews = await Review.find({ course: review.course });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    await Course.findByIdAndUpdate(review.course, {
      rating: Math.round(avgRating * 10) / 10,
    });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin - view all feedbacks
// @route   GET /api/reviews/admin/all
// @access  Admin only
exports.getAllFeedbacks = async (req, res, next) => {
  try {
    const reviews = await Review.find({ teacherFeedback: { $ne: "" } })
      .populate("user", "name email")
      .populate("course", "title instructor")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};