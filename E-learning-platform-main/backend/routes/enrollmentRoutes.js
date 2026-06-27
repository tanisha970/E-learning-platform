// routes/enrollmentRoutes.js
const express = require("express");
const router = express.Router();
const {
  enrollCourse,
  getMyEnrollments,
  updateProgress,
  getEnrollmentDetails,
  getCourseStudents,
} = require("../controllers/enrollmentController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", protect, enrollCourse);
router.get("/my", protect, getMyEnrollments);
router.get("/course/:courseId", protect, adminOnly, getCourseStudents);
router.get("/:courseId", protect, getEnrollmentDetails);
router.put("/:courseId/progress", protect, updateProgress);

module.exports = router;
