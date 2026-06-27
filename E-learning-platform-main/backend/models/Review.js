// models/Review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      required: true,
      maxlength: [500, "Review 500 characters se zyada nahi ho sakti"],
      trim: true,
    },
    // Teacher ke baare mein feedback
    teacherFeedback: {
      type: String,
      maxlength: [500, "Feedback 500 characters se zyada nahi ho sakti"],
      trim: true,
      default: "",
    },
    teacherRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  { timestamps: true }
);

// Ek student ek course ko sirf ek baar review kar sakta hai
reviewSchema.index({ user: 1, course: 1 }, { unique: true });

// Review save hone ke baad course ki average rating update karo
reviewSchema.post("save", async function () {
  const Course = require("./Course");
  const reviews = await this.constructor.find({ course: this.course });
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Course.findByIdAndUpdate(this.course, {
    rating: Math.round(avgRating * 10) / 10,
  });
});

module.exports = mongoose.model("Review", reviewSchema);