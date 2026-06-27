// routes/authRoutes.js — Updated with profile + password routes
const express = require("express");
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, getAllStudents, deleteStudent, verifyEmail, resendVerification } = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.get("/me", protect, getMe);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Admin routes for managing students
router.get("/students", protect, adminOnly, getAllStudents);
router.delete("/students/:id", protect, adminOnly, deleteStudent);

module.exports = router;