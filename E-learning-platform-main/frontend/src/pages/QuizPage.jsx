// src/pages/QuizPage.jsx — MCQ Quiz with auto-grading
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../utils/api";
import toast from "react-hot-toast";
import { FiCheckCircle, FiXCircle, FiArrowLeft, FiHelpCircle } from "react-icons/fi";
import { LoadingSpinner } from "../components/common/UIComponents";

const QuizPage = () => {
  const { id } = useParams(); // courseId
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    API.get(`/quizzes/${id}`)
      .then(({ data }) => { setQuiz(data.quiz); })
      .catch(() => toast.error("No quiz available for this course."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAnswer = (questionId, optionIdx) => {
    if (result) return; // Don't allow changes after submission
    setAnswers({ ...answers, [questionId]: optionIdx });
  };

  const handleSubmit = async () => {
    const unanswered = quiz.questions.filter((q) => answers[q._id] === undefined);
    if (unanswered.length > 0) {
      return toast.error(`Please answer all ${quiz.questions.length} questions.`);
    }
    setSubmitting(true);
    try {
      const { data } = await API.post(`/quizzes/${id}/submit`, { answers });
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setAnswers({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <LoadingSpinner center />;

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <FiHelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No Quiz Available</h2>
          <p className="text-gray-500 text-sm mb-6">The instructor hasn't added a quiz for this course yet.</p>
          <Link to={`/courses/${id}`} className="text-blue-600 text-sm hover:underline">
            ← Back to Course
          </Link>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-2xl mx-auto">

        {/* Back Button */}
        <Link
          to={`/courses/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-6 transition"
        >
          <FiArrowLeft size={14} /> Back to Course
        </Link>

        {/* Result Banner */}
        {result && (
          <div className={`rounded-2xl p-6 mb-6 text-center ${result.passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 ${result.passed ? "bg-green-100" : "bg-red-100"}`}>
              {result.passed
                ? <FiCheckCircle size={36} className="text-green-600" />
                : <FiXCircle size={36} className="text-red-500" />
              }
            </div>
            <h2 className={`text-4xl font-bold mb-1 ${result.passed ? "text-green-600" : "text-red-500"}`}>
              {result.score}%
            </h2>
            <p className="text-lg font-semibold text-gray-800 mb-1">
              {result.passed ? "🎉 You Passed!" : "😔 Not Passed"}
            </p>
            <p className="text-gray-500 text-sm">
              {result.correctCount} out of {result.totalQuestions} correct · Passing score: {result.passingScore}%
            </p>
            <button
              onClick={handleRetake}
              className="mt-4 bg-white border border-gray-200 text-gray-700 font-medium px-6 py-2 rounded-full text-sm hover:bg-gray-50 transition"
            >
              Retake Quiz
            </button>
          </div>
        )}

        {/* Quiz Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          {/* Quiz Header */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{totalQuestions} Questions</span>
              <span>·</span>
              <span>Pass at {quiz.passingScore}%</span>
              {!result && (
                <>
                  <span>·</span>
                  <span className="text-blue-600 font-medium">{answeredCount}/{totalQuestions} answered</span>
                </>
              )}
            </div>
            {/* Progress bar */}
            {!result && (
              <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {quiz.questions.map((q, idx) => {
              const selectedAnswer = answers[q._id];
              const questionResult = result?.results?.[idx];

              return (
                <div key={q._id} className={`border rounded-xl p-5 ${
                  result
                    ? questionResult?.isCorrect
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                    : selectedAnswer !== undefined
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-100"
                }`}>
                  {/* Question */}
                  <p className="font-medium text-gray-900 mb-4 text-sm leading-relaxed">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold mr-2">
                      {idx + 1}
                    </span>
                    {q.question}
                  </p>

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswer === optIdx;
                      const isCorrect = result && questionResult?.correctAnswer === optIdx;
                      const isWrong = result && isSelected && !questionResult?.isCorrect;

                      let optClass = "border-gray-200 bg-white hover:bg-gray-50";
                      if (result) {
                        if (isCorrect) optClass = "border-green-400 bg-green-50";
                        else if (isWrong) optClass = "border-red-400 bg-red-50";
                        else optClass = "border-gray-100 bg-white opacity-60";
                      } else if (isSelected) {
                        optClass = "border-blue-400 bg-blue-50";
                      }

                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleAnswer(q._id, optIdx)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${optClass} ${result ? "cursor-default" : ""}`}
                        >
                          {/* Custom radio */}
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected && !result ? "border-blue-500 bg-blue-500"
                            : result && isCorrect ? "border-green-500 bg-green-500"
                            : result && isWrong ? "border-red-500 bg-red-500"
                            : "border-gray-300"
                          }`}>
                            {(isSelected || (result && isCorrect)) && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-sm text-gray-800">{opt}</span>

                          {/* Result icons */}
                          {result && isCorrect && <FiCheckCircle size={14} className="ml-auto text-green-600 flex-shrink-0" />}
                          {result && isWrong && <FiXCircle size={14} className="ml-auto text-red-500 flex-shrink-0" />}
                        </label>
                      );
                    })}
                  </div>

                  {/* Explanation if wrong */}
                  {result && !questionResult?.isCorrect && (
                    <p className="mt-3 text-xs text-red-600 bg-red-100 px-3 py-2 rounded-lg">
                      ✗ Correct answer: Option {questionResult.correctAnswer + 1} — {q.options[questionResult.correctAnswer]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          {!result && (
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount < totalQuestions}
              className="mt-8 w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
              ) : answeredCount < totalQuestions ? (
                `Answer all questions (${answeredCount}/${totalQuestions})`
              ) : (
                "Submit Quiz"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
