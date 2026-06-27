// routes/quizRoutes.js
const express = require("express");
const router = express.Router();
const { getQuiz, submitQuiz, createQuiz, deleteQuiz } = require("../controllers/quizController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/:courseId", protect, getQuiz);
router.post("/:courseId/submit", protect, submitQuiz);
router.post("/:courseId", protect, adminOnly, createQuiz);
router.delete("/:courseId", protect, adminOnly, deleteQuiz);

module.exports = router;
