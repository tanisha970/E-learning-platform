// src/pages/HomePage.jsx — Landing page with dark mode support
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBookOpen, FiUsers, FiAward, FiTrendingUp } from "react-icons/fi";
import API from "../utils/api";
import CourseCard from "../components/course/CourseCard";
import { LoadingSpinner } from "../components/common/UIComponents";

const CATEGORIES = ["Web Development", "Data Science", "Mobile Development", "DevOps", "Design", "Business"];

const HomePage = () => {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await API.get("/courses?sort=popular");
        setFeaturedCourses(data.courses.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900 text-white py-24 px-6 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
            🚀 Start Learning Today
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6">
            Unlock Your Potential <br />
            <span className="text-amber-300">with Expert Courses</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 dark:text-blue-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Learn in-demand skills from industry experts. Join thousands of students already leveling up their careers on LearnHub.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-full hover:bg-blue-50 transition shadow-lg"
            >
              Browse Courses <FiArrowRight />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/10 transition"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: FiUsers, value: "10,000+", label: "Students" },
            { icon: FiBookOpen, value: "200+", label: "Courses" },
            { icon: FiAward, value: "50+", label: "Expert Instructors" },
            { icon: FiTrendingUp, value: "95%", label: "Completion Rate" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="text-blue-500 mb-1" size={22} />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-14 px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">Browse by Category</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/courses?category=${encodeURIComponent(cat)}`}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ── */}
      <section className="py-14 px-6 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Popular Courses</h2>
            <Link to="/courses" className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
              View all <FiArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner center />
          ) : featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-16">No courses available yet. Check back soon!</p>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-900 dark:to-blue-900 text-white py-16 px-6 text-center">
        <h2 className="font-display text-3xl font-bold mb-4">Ready to start learning?</h2>
        <p className="text-blue-100 mb-8 max-w-xl mx-auto">
          Join thousands of learners building real-world skills. Create your free account today.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-full hover:bg-blue-50 transition shadow-lg"
        >
          Create Free Account <FiArrowRight />
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
