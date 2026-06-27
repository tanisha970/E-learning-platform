// routes/communityRoutes.js — Community chat endpoints
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
  getMessages,
  sendMessage,
  deleteMessage,
  toggleCommunity,
} = require("../controllers/communityController");

// All routes require authentication
router.use(protect);

// Get messages & send message (enrolled students + admin)
router.get("/:courseId", getMessages);
router.post("/:courseId", sendMessage);

// Admin-only routes
router.put("/:courseId/toggle", adminOnly, toggleCommunity);
router.delete("/message/:messageId", adminOnly, deleteMessage);

module.exports = router;
