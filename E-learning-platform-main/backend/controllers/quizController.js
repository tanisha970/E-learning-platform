// controllers/quizController.js — Create, get, and submit quizzes
const Quiz = require("../models/Quiz");
const Enrollment = require("../models/Enrollment");

// @desc    Get quiz for a course (questions without correct answers unless admin)
// @route   GET /api/quizzes/:courseId
// @access  Private (Enrolled student or Admin)
exports.getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ course: req.params.courseId });

    if (!quiz) {
      return res.status(404).json({ success: false, message: "No quiz found for this course." });
    }

    const isAdmin = req.user && req.user.role === "admin";

    // Remove correct answers before sending to student, keep for admin
    const sanitizedQuestions = quiz.questions.map((q) => {
      const questionData = {
        _id: q._id,
        question: q.question,
        options: q.options,
      };
      if (isAdmin) {
        questionData.correctAnswer = q.correctAnswer;
      }
      return questionData;
    });

    res.status(200).json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz answers and get score
// @route   POST /api/quizzes/:courseId/submit
// @access  Private (Enrolled student)
exports.submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body; // { questionId: selectedIndex }

    const quiz = await Quiz.findOne({ course: req.params.courseId });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId,
    });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: "You are not enrolled in this course." });
    }

    // Grade the quiz
    let correctCount = 0;
    const results = quiz.questions.map((q) => {
      const selectedAnswer = answers[q._id.toString()];
      const isCorrect = selectedAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
      };
    });

    const scorePercent = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = scorePercent >= quiz.passingScore;

    res.status(200).json({
      success: true,
      score: scorePercent,
      passed,
      correctCount,
      totalQuestions: quiz.questions.length,
      passingScore: quiz.passingScore,
      results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create quiz for a course
// @route   POST /api/quizzes/:courseId
// @access  Admin only
exports.createQuiz = async (req, res, next) => {
  try {
    const { title, questions, passingScore } = req.body;

    // Remove existing quiz if any
    await Quiz.findOneAndDelete({ course: req.params.courseId });

    const quiz = await Quiz.create({
      course: req.params.courseId,
      title: title || "Course Quiz",
      questions,
      passingScore: passingScore || 60,
    });

    res.status(201).json({ success: true, message: "Quiz created.", quiz });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quiz for a course
// @route   DELETE /api/quizzes/:courseId
// @access  Admin only
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ course: req.params.courseId });

    if (!quiz) {
      return res.status(404).json({ success: false, message: "No quiz found for this course." });
    }

    res.status(200).json({ success: true, message: "Quiz deleted successfully." });
  } catch (error) {
    next(error);
  }
};

