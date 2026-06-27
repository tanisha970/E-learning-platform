// models/StudySession.js — Tracks individual study sessions for progress analytics
const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    // Day-level date for calendar aggregation (stored as start of day UTC)
    date: {
      type: Date,
      required: true,
    },
    // Duration in minutes
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    // Number of videos completed in this session
    videosCompleted: {
      type: Number,
      default: 1,
    },
    // Session type: "video_complete" (auto) or "manual" (timer)
    sessionType: {
      type: String,
      enum: ["video_complete", "manual"],
      default: "video_complete",
    },
  },
  { timestamps: true }
);

// Index for fast lookups by user + course + date range
studySessionSchema.index({ user: 1, course: 1, date: 1 });
studySessionSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model("StudySession", studySessionSchema);
