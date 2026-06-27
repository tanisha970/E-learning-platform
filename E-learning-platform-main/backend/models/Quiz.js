// models/Quiz.js — MCQ-based quiz linked to a course
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    validate: [(arr) => arr.length === 4, "Exactly 4 options required"],
  },
  correctAnswer: {
    type: Number, // Index of correct option (0-3)
    required: true,
    min: 0,
    max: 3,
  },
});

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: "Course Quiz",
    },
    questions: [questionSchema],
    passingScore: {
      type: Number,
      default: 60, // 60% to pass
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
