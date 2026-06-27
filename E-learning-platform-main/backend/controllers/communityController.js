// controllers/communityController.js — Per-course community chat
const CommunityMessage = require("../models/CommunityMessage");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// Helper: Check if user is enrolled or is an admin
const checkAccess = async (userId, userRole, courseId) => {
  if (userRole === "admin") return true;
  const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
  return !!enrollment;
};

// @desc    Get messages for a course community
// @route   GET /api/community/:courseId
// @access  Private (Enrolled students + Admin)
exports.getMessages = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { before } = req.query; // For pagination: load messages before this ID

    // Check access
    const hasAccess = await checkAccess(req.user._id, req.user.role, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to access the community.",
      });
    }

    // Get community status
    const course = await Course.findById(courseId).select("communityEnabled title");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    // Build query
    let query = { course: courseId };
    if (before) {
      query._id = { $lt: before };
    }

    // Fetch messages (newest first, limit 50)
    const messages = await CommunityMessage.find(query)
      .populate("user", "name role avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    // Reverse so oldest is first (for display in chat order)
    messages.reverse();

    // Check if there are older messages for "load more"
    let hasMore = false;
    if (messages.length > 0) {
      const olderCount = await CommunityMessage.countDocuments({
        course: courseId,
        _id: { $lt: messages[0]._id },
      });
      hasMore = olderCount > 0;
    }

    res.status(200).json({
      success: true,
      messages,
      hasMore,
      communityEnabled: course.communityEnabled,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in a course community
// @route   POST /api/community/:courseId
// @access  Private (Enrolled students + Admin)
exports.sendMessage = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty.",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 1000 characters.",
      });
    }

    // Check access
    const hasAccess = await checkAccess(req.user._id, req.user.role, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to post in the community.",
      });
    }

    // Check if community is enabled
    const course = await Course.findById(courseId).select("communityEnabled");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    if (!course.communityEnabled) {
      return res.status(403).json({
        success: false,
        message: "Community chat is currently closed for this course.",
      });
    }

    // Create message
    const newMessage = await CommunityMessage.create({
      course: courseId,
      user: req.user._id,
      message: message.trim(),
    });

    // Populate user details for response
    await newMessage.populate("user", "name role avatar");

    res.status(201).json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message from community
// @route   DELETE /api/community/message/:messageId
// @access  Admin only
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await CommunityMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    await CommunityMessage.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle community open/close for a course
// @route   PUT /api/community/:courseId/toggle
// @access  Admin only
exports.toggleCommunity = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    course.communityEnabled = !course.communityEnabled;
    await course.save();

    res.status(200).json({
      success: true,
      communityEnabled: course.communityEnabled,
      message: course.communityEnabled
        ? "Community chat has been opened."
        : "Community chat has been closed.",
    });
  } catch (error) {
    next(error);
  }
};
