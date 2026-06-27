// routes/uploadRoutes.js — Video file upload endpoint
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { protect, adminOnly } = require("../middleware/auth");

// @desc    Upload a video file
// @route   POST /api/upload/video
// @access  Admin only
router.post("/video", protect, adminOnly, (req, res, next) => {
  upload.single("video")(req, res, (err) => {
    if (err) {
      // Multer error (file too large, wrong type, etc.)
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large. Maximum size is 500MB."
          : err.message || "Upload failed.";
      return res.status(400).json({ success: false, message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video file provided." });
    }

    // Build the URL path that the frontend will use
    const videoUrl = `/uploads/videos/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: "Video uploaded successfully.",
      url: videoUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  });
});

module.exports = router;
