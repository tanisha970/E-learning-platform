// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitReview,
  getCourseReviews,
  getMyReview,
  getAllFeedbacks,
  deleteReview,
} = require("../controllers/reviewController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/admin/all", protect, adminOnly, getAllFeedbacks);
router.delete("/admin/:reviewId", protect, adminOnly, deleteReview);
router.get("/:courseId", getCourseReviews);
router.get("/:courseId/my", protect, getMyReview);
router.post("/:courseId", protect, submitReview);

module.exports = router;