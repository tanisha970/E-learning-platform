// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getAdminCourses,
} = require("../controllers/courseController");
const { protect, adminOnly } = require("../middleware/auth");

// Public routes
router.get("/", getAllCourses);

// Admin routes — must be defined BEFORE /:id to avoid conflicts
router.get("/admin/all", protect, adminOnly, getAdminCourses);
router.post("/", protect, adminOnly, createCourse);

// Route with optional auth (to check enrollment for video access)
router.get("/:id", (req, res, next) => {
  // Try to authenticate but don't fail if no token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer")) {
    const jwt = require("jsonwebtoken");
    const User = require("../models/User");
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      User.findById(decoded.id).then((user) => {
        req.user = user;
        next();
      });
    } catch {
      next();
    }
  } else {
    next();
  }
}, getCourse);

router.put("/:id", protect, adminOnly, updateCourse);
router.delete("/:id", protect, adminOnly, deleteCourse);

module.exports = router;
