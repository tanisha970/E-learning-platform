// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { getAdminDashboard, getUserDashboard } = require("../controllers/dashboardController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/admin", protect, adminOnly, getAdminDashboard);
router.get("/user", protect, getUserDashboard);

module.exports = router;
