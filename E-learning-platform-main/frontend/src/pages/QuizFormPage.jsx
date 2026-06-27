// src/pages/QuizFormPage.jsx — Admin: Create or Edit a quiz for a particular course
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiHelpCircle, FiCheck } from "react-icons/fi";
import { LoadingSpinner } from "../components/common/UIComponents";

const QuizFormPage = () => {
  const { id } = useParams(); // courseId
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [quizExists, setQuizExists] = useState(false);

  const [form, setForm] = useState({
    title: "Course Quiz",
    passingScore: 60,
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ],
  });

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        // Fetch course info
        const courseRes = await API.get(`/courses/${id}`);
        setCourse(courseRes.data.course);

        // Fetch quiz info
        try {
          const quizRes = await API.get(`/quizzes/${id}`);
          if (quizRes.data && quizRes.data.quiz) {
            const loadedQuiz = quizRes.data.quiz;
            // Map questions to ensure options is an array with 4 items
            const questions = loadedQuiz.questions.map((q) => ({
              question: q.question || "",
              options: q.options && q.options.length === 4 ? [...q.options] : ["", "", "", ""],
              correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
            }));

            setForm({
              title: loadedQuiz.title || "Course Quiz",
              passingScore: typeof loadedQuiz.passingScore === "number" ? loadedQuiz.passingScore : 60,
              questions,
            });
            setQuizExists(true);
          }
        } catch (quizErr) {
          // If quiz is not found, we just keep the default empty quiz form
          if (quizErr.response?.status !== 404) {
            console.error("Error loading quiz:", quizErr);
          }
        }
      } catch (err) {
        toast.error("Course not found or failed to load data.");
        navigate("/admin");
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [id, navigate]);

  const handleTitleChange = (e) => {
    setForm({ ...form, title: e.target.value });
  };

  const handlePassingScoreChange = (e) => {
    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
    setForm({ ...form, passingScore: val });
  };

  const handleQuestionTextChange = (qIdx, value) => {
    const questions = [...form.questions];
    questions[qIdx] = { ...questions[qIdx], question: value };
    setForm({ ...form, questions });
  };

  const handleOptionChange = (qIdx, oIdx, value) => {
    const questions = [...form.questions];
    const options = [...questions[qIdx].options];
    options[oIdx] = value;
    questions[qIdx] = { ...questions[qIdx], options };
    setForm({ ...form, questions });
  };

  const handleCorrectAnswerChange = (qIdx, oIdx) => {
    const questions = [...form.questions];
    questions[qIdx] = { ...questions[qIdx], correctAnswer: oIdx };
    setForm({ ...form, questions });
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ],
    });
  };

  const removeQuestion = (qIdx) => {
    if (form.questions.length === 1) {
      toast.error("A quiz must have at least one question.");
      return;
    }
    const questions = form.questions.filter((_, idx) => idx !== qIdx);
    setForm({ ...form, questions });
  };

  const handleDeleteQuiz = async () => {
    if (!window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await API.delete(`/quizzes/${id}`);
      toast.success("Quiz deleted successfully.");
      setQuizExists(false);
      // Reset form to default empty
      setForm({
        title: "Course Quiz",
        passingScore: 60,
        questions: [
          {
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
          },
        ],
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete quiz.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      return toast.error("Quiz title is required.");
    }

    // Validation checks
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.question.trim()) {
        return toast.error(`Question ${i + 1} text cannot be empty.`);
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          return toast.error(`Option ${j + 1} in Question ${i + 1} cannot be empty.`);
        }
      }
      if (q.correctAnswer < 0 || q.correctAnswer > 3) {
        return toast.error(`Please select a valid correct answer for Question ${i + 1}.`);
      }
    }

    setSaving(true);
    try {
      await API.post(`/quizzes/${id}`, form);
      toast.success("Quiz saved successfully!");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save quiz.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner center />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-6 transition-colors">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 mb-4 transition"
          >
            <FiArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                {quizExists ? "Edit Quiz" : "Create Quiz"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                For Course: <span className="font-semibold text-gray-700 dark:text-gray-200">{course?.title}</span>
              </p>
            </div>
            {quizExists && (
              <button
                type="button"
                onClick={handleDeleteQuiz}
                disabled={deleting || saving}
                className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/50 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-semibold transition"
              >
                <FiTrash2 size={14} /> {deleting ? "Deleting..." : "Delete Quiz"}
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quiz Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-5">
            <h2 className="font-semibold text-gray-800 dark:text-white text-base flex items-center gap-2">
              <FiHelpCircle className="text-blue-500" /> Quiz Details
            </h2>

            {/* Quiz Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Quiz Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={handleTitleChange}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., Final Assessment"
                required
              />
            </div>

            {/* Passing Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Passing Score (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.passingScore}
                onChange={handlePassingScoreChange}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                The minimum score percentage required for students to pass the quiz and earn a certificate.
              </p>
            </div>
          </div>

          {/* Quiz Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white text-base">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition font-medium"
              >
                <FiPlus size={14} /> Add Question
              </button>
            </div>

            {form.questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full">
                    Question {qIdx + 1}
                  </span>
                  {form.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition"
                      title="Remove Question"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Question Content
                  </label>
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                    placeholder="e.g., What is the virtual DOM in React?"
                    required
                  />
                </div>

                {/* Question Options */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Options & Correct Answer Selection
                  </label>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-3">
                      {/* Radio button to select correct answer */}
                      <button
                        type="button"
                        onClick={() => handleCorrectAnswerChange(qIdx, oIdx)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          q.correctAnswer === oIdx
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 dark:border-gray-600 hover:border-blue-500"
                        }`}
                        title="Mark as correct answer"
                      >
                        {q.correctAnswer === oIdx && <FiCheck size={12} />}
                      </button>

                      {/* Option Text Input */}
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                        className={`flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                          q.correctAnswer === oIdx
                            ? "border-blue-300 dark:border-blue-600 ring-1 ring-blue-100 dark:ring-blue-900/30"
                            : "border-gray-200 dark:border-gray-600"
                        }`}
                        placeholder={`Option ${oIdx + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || deleting}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={15} /> Save Quiz
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizFormPage;
