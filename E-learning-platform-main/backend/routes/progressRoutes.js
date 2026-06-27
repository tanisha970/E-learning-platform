// routes/progressRoutes.js — Study progress analytics routes
const express = require("express");
const router = express.Router();
const {
  logSession,
  getTodayProgress,
  getWeeklyProgress,
  getMonthlyProgress,
  getAggregateStats,
} = require("../controllers/progressController");
const { protect } = require("../middleware/auth");

router.post("/session", protect, logSession);
router.get("/:courseId/today", protect, getTodayProgress);
router.get("/:courseId/weekly", protect, getWeeklyProgress);
router.get("/:courseId/monthly", protect, getMonthlyProgress);
router.get("/:courseId/stats", protect, getAggregateStats);

module.exports = router;
