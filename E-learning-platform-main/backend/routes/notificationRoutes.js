// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAllRead,
  markRead,
  deleteNotification,
  clearAll,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAllRead);
router.delete("/clear-all", protect, clearAll);
router.put("/:id/read", protect, markRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
