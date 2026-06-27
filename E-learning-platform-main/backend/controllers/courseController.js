// controllers/courseController.js — Course CRUD + search/filter + notifications
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const { createNotificationsForUsers } = require("./notificationController");

// Helper: Convert any YouTube URL format to embed URL
// Supports: watch?v=, youtu.be/, shorts/, embed/ (already), and /live/
const toYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  try {
    // Already an embed URL
    if (url.includes("youtube.com/embed/")) return url;

    let videoId = null;

    // https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) videoId = watchMatch[1];

    // https://youtu.be/VIDEO_ID
    if (!videoId) {
      const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (shortMatch) videoId = shortMatch[1];
    }

    // https://www.youtube.com/shorts/VIDEO_ID
    if (!videoId) {
      const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) videoId = shortsMatch[1];
    }

    // https://www.youtube.com/live/VIDEO_ID
    if (!videoId) {
      const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
      if (liveMatch) videoId = liveMatch[1];
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch (e) {
    // If parsing fails, return original URL
  }
  return url;
};

// Convert video URLs in an array of video objects (only for link-type videos)
const convertVideoUrls = (videos) => {
  if (!Array.isArray(videos)) return videos;
  return videos.map((video) => ({
    ...video,
    url: video.videoType === "upload" ? video.url : toYouTubeEmbedUrl(video.url),
  }));
};

// @desc    Get all published courses (with search & filter)
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = async (req, res, next) => {
  try {
    const { search, category, level, sort } = req.query;

    // Build query object
    let query = { isPublished: true };

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { instructor: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category && category !== "All") {
      query.category = category;
    }

    // Filter by level
    if (level && level !== "All") {
      query.level = level;
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === "price-low") sortOption = { price: 1 };
    if (sort === "price-high") sortOption = { price: -1 };
    if (sort === "popular") sortOption = { studentsEnrolled: -1 };

    const courses = await Course.find(query).sort(sortOption).select("-videos"); // Exclude videos in listing

    res.status(200).json({ success: true, count: courses.length, courses });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course details (with videos — only for enrolled users or admin)
// @route   GET /api/courses/:id
// @access  Public (basic info), Private (videos)
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    // Check if current user is enrolled (to show videos)
    let isEnrolled = false;
    let enrollment = null;

    if (req.user) {
      enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
      isEnrolled = !!enrollment || req.user.role === "admin";
    }

    // Return videos only if enrolled or admin
    const courseData = course.toObject();
    if (!isEnrolled) {
      delete courseData.videos; // Hide videos for non-enrolled users
    }

    res.status(200).json({
      success: true,
      course: courseData,
      isEnrolled,
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Admin only
exports.createCourse = async (req, res, next) => {
  try {
    const { title, description, instructor, price, thumbnail, category, level, videos } = req.body;

    if (!title || !description || !instructor || price === undefined) {
      return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }

    const course = await Course.create({
      title,
      description,
      instructor,
      price,
      thumbnail: thumbnail || "",
      category: category || "Other",
      level: level || "Beginner",
      videos: convertVideoUrls(videos || []),
    });

    //  Notify all students about the new course
    try {
      const students = await User.find({ role: "student" }).select("_id");
      const studentIds = students.map((s) => s._id);
      if (studentIds.length > 0) {
        await createNotificationsForUsers(studentIds, {
          type: "course_added",
          title: "New Course Available! 🎉",
          message: `A new course "${title}" by ${instructor} has been added. ${price === 0 ? "It's FREE!" : `Price: ₹${price}`}`,
          relatedCourse: course._id,
          audience: "student",
        });
      }
    } catch (notifErr) {
      console.error("Notification error:", notifErr);
    }

    res.status(201).json({ success: true, message: "Course created successfully.", course });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Admin only
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    // Convert YouTube URLs if videos are being updated
    const updateData = { ...req.body };
    if (updateData.videos) {
      updateData.videos = convertVideoUrls(updateData.videos);
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: "Course updated successfully.", course: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Admin only
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    await Course.findByIdAndDelete(req.params.id);

    // Also clean up enrollments for this course
    await Enrollment.deleteMany({ course: req.params.id });

    res.status(200).json({ success: true, message: "Course deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all courses for admin (including unpublished)
// @route   GET /api/courses/admin/all
// @access  Admin only
exports.getAdminCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: courses.length, courses });
  } catch (error) {
    next(error);
  }
};
