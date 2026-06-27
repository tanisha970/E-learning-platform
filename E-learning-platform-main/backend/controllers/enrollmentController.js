// controllers/enrollmentController.js — Enroll, track progress, get enrolled courses + notifications
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");
const StudySession = require("../models/StudySession");
const { parseDuration } = require("./progressController");
const { createNotificationsForUsers, notifyAdmins } = require("./notificationController");

// @desc    Enroll user in a course (called after successful payment)
// @route   POST /api/enrollments
// @access  Private (Student)
exports.enrollCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    // Check course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({ success: false, message: "Already enrolled in this course." });
    }

    // Create enrollment record
    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: courseId,
    });

    // Add course to user's enrolled list
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { enrolledCourses: courseId },
    });

    // Add user to course's students list
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { studentsEnrolled: req.user._id },
    });

    //  Notify the student about successful enrollment
    try {
      await createNotificationsForUsers([req.user._id], {
        type: "enrollment",
        title: "Enrollment Successful! 🎉",
        message: `You've been enrolled in "${course.title}". Start learning now!`,
        relatedCourse: courseId,
        audience: "student",
      });
    } catch (notifErr) {
      console.error("Notification error:", notifErr);
    }

    // 🔔 Notify admins about new enrollment
    try {
      await notifyAdmins({
        type: "enrollment",
        title: "New Enrollment",
        message: `${req.user.name} enrolled in "${course.title}"`,
        relatedCourse: courseId,
        relatedUser: req.user._id,
      });
    } catch (notifErr) {
      console.error("Admin notification error:", notifErr);
    }

    res.status(201).json({ success: true, message: "Enrolled successfully!", enrollment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all enrolled courses of logged-in user
// @route   GET /api/enrollments/my
// @access  Private (Student)
exports.getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate("course", "title thumbnail instructor category level videos")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, enrollments });
  } catch (error) {
    next(error);
  }
};

// @desc    Update video progress (mark video as completed)
// @route   PUT /api/enrollments/:courseId/progress
// @access  Private (Student)
exports.updateProgress = async (req, res, next) => {
  try {
    const { videoId } = req.body;
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    // Add video to completed list (avoid duplicates)
    if (!enrollment.completedVideos.includes(videoId)) {
      enrollment.completedVideos.push(videoId);
    }

    // Calculate progress percentage
    const course = await Course.findById(courseId);
    const totalVideos = course.videos.length;
    const completedCount = enrollment.completedVideos.length;

    enrollment.progress = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

    // Mark as completed if all videos done
    if (enrollment.progress === 100) {
      enrollment.isCompleted = true;
      enrollment.completedAt = new Date();

      // 🔔 Notify student about course completion
      try {
        await createNotificationsForUsers([req.user._id], {
          type: "general",
          title: "Course Completed! 🏆",
          message: `Congratulations! You've completed "${course.title}". Get your certificate now!`,
          relatedCourse: courseId,
          audience: "student",
        });
      } catch (notifErr) {
        console.error("Notification error:", notifErr);
      }
    }

    await enrollment.save();

    // 📊 Auto-log a study session for the progress dashboard
    try {
      const video = course.videos.id(videoId);
      const durationMinutes = video ? parseDuration(video.duration) : 5;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      await StudySession.create({
        user: req.user._id,
        course: courseId,
        date: today,
        duration: Math.round(durationMinutes * 10) / 10,
        videosCompleted: 1,
        sessionType: "video_complete",
      });
    } catch (sessionErr) {
      console.error("Study session logging error:", sessionErr);
    }

    res.status(200).json({
      success: true,
      message: "Progress updated.",
      progress: enrollment.progress,
      isCompleted: enrollment.isCompleted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get enrollment details for a specific course
// @route   GET /api/enrollments/:courseId
// @access  Private (Student)
exports.getEnrollmentDetails = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId,
    }).populate("course");

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    res.status(200).json({ success: true, enrollment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students enrolled in a course (Admin)
// @route   GET /api/enrollments/course/:courseId
// @access  Admin only
exports.getCourseStudents = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate("user", "name email createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: enrollments.length, enrollments });
  } catch (error) {
    next(error);
  }
};
