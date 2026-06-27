// controllers/notificationController.js — CRUD for notifications (role-separated)
const Notification = require("../models/Notification");

// @desc    Get notifications for the logged-in user (filtered by their role)
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const userRole = req.user.role; // "student" or "admin"

    const notifications = await Notification.find({
      recipient: req.user._id,
      audience: userRole,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("relatedCourse", "title")
      .populate("relatedUser", "name");

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      audience: userRole,
      read: false,
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read (scoped by role)
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, audience: req.user.role, read: false },
      { read: true }
    );
    res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });
    res.status(200).json({ success: true, message: "Notification deleted." });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all notifications for user (scoped by role)
// @route   DELETE /api/notifications/clear-all
// @access  Private
exports.clearAll = async (req, res, next) => {
  try {
    await Notification.deleteMany({
      recipient: req.user._id,
      audience: req.user.role,
    });
    res.status(200).json({ success: true, message: "All notifications cleared." });
  } catch (error) {
    next(error);
  }
};

// ─── Helper: Create notifications for multiple users ───
// Used internally by other controllers. `notifData` MUST include `audience`.
exports.createNotificationsForUsers = async (userIds, notifData) => {
  try {
    const notifications = userIds.map((userId) => ({
      recipient: userId,
      ...notifData,
    }));
    await Notification.insertMany(notifications);
  } catch (err) {
    console.error("Failed to create notifications:", err);
  }
};

// ─── Helper: Notify all admins (auto-sets audience to "admin") ───
exports.notifyAdmins = async (notifData) => {
  try {
    const User = require("../models/User");
    const admins = await User.find({ role: "admin" }).select("_id");
    const adminIds = admins.map((a) => a._id);
    await exports.createNotificationsForUsers(adminIds, {
      ...notifData,
      audience: "admin",
    });
  } catch (err) {
    console.error("Failed to notify admins:", err);
  }
};
