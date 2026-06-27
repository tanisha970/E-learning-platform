// models/CommunityMessage.js — Per-course community chat messages
const mongoose = require("mongoose");

const communityMessageSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: [true, "Message cannot be empty"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries: fetch messages for a course sorted by time
communityMessageSchema.index({ course: 1, createdAt: -1 });

module.exports = mongoose.model("CommunityMessage", communityMessageSchema);
