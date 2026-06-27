// controllers/dashboardController.js — Admin & User dashboard data
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Payment = require("../models/Payment");

// @desc    Admin dashboard analytics
// @route   GET /api/dashboard/admin
// @access  Admin only
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      revenueData,
      recentUsers,
      recentEnrollments,
      topCourses,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.find({ role: "student" }).sort({ createdAt: -1 }).limit(5).select("name email createdAt"),
      Enrollment.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email")
        .populate("course", "title price"),
      Course.find()
        .sort({ studentsEnrolled: -1 })
        .limit(5)
        .select("title studentsEnrolled price thumbnail"),
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total / 100 : 0; // Convert paise to INR

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalRevenue,
      },
      recentUsers,
      recentEnrollments,
      topCourses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User dashboard — enrolled courses + progress
// @route   GET /api/dashboard/user
// @access  Private (Student)
exports.getUserDashboard = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate("course", "title thumbnail instructor category level videos")
      .sort({ updatedAt: -1 });

    const stats = {
      totalEnrolled: enrollments.length,
      inProgress: enrollments.filter((e) => !e.isCompleted && e.progress > 0).length,
      completed: enrollments.filter((e) => e.isCompleted).length,
      notStarted: enrollments.filter((e) => e.progress === 0).length,
    };

    res.status(200).json({ success: true, stats, enrollments });
  } catch (error) {
    next(error);
  }
};
