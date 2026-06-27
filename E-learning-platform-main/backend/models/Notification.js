// models/Notification.js — Notification schema for cross-user notifications
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    audience: {
      type: String,
      enum: ["student", "admin"],
      required: true,
    },
    type: {
      type: String,
      enum: ["course_added", "enrollment", "feedback", "general"],
      default: "general",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Index for efficient querying
notificationSchema.index({ recipient: 1, audience: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
