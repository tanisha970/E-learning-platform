// models/Course.js — Course schema with videos and metadata
const mongoose = require("mongoose");

// Sub-schema for individual video lessons
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },      // YouTube embed URL or uploaded file path
  duration: { type: String, default: "0:00" }, // e.g., "12:34"
  videoType: { type: String, enum: ["link", "upload"], default: "link" }, // "link" = YouTube, "upload" = local file
  order: { type: Number, default: 0 },
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    instructor: {
      type: String,
      required: [true, "Instructor name is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    thumbnail: {
      type: String,
      default: "", // Course cover image URL
    },
    category: {
      type: String,
      required: true,
      enum: ["Web Development", "Data Science", "Mobile Development", "DevOps", "Design", "Business", "Other"],
      default: "Other",
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    videos: [videoSchema], // Array of video lessons
    studentsEnrolled: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    communityEnabled: {
      type: Boolean,
      default: true, // Community chat is open by default
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
