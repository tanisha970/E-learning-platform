// src/pages/CoursesPage.jsx — Browse, search, and filter all courses (with dark mode)
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../utils/api";
import CourseCard from "../components/course/CourseCard";
import { LoadingSpinner, EmptyState } from "../components/common/UIComponents";
import { FiSearch, FiBookOpen } from "react-icons/fi";

const CATEGORIES = ["All", "Web Development", "Data Science", "Mobile Development", "DevOps", "Design", "Business", "Other"];
const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const CoursesPage = () => {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [level, setLevel] = useState("All");
  const [sort, setSort] = useState("newest");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "All") params.set("category", category);
      if (level !== "All") params.set("level", level);
      if (sort) params.set("sort", sort);

      const { data } = await API.get(`/courses?${params.toString()}`);
      setCourses(data.courses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, level, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchCourses, 300);
    return () => clearTimeout(timer);
  }, [fetchCourses]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">Browse Courses</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Explore {courses.length} expert-led courses</p>

          {/* Search */}
          <div className="relative mt-5 max-w-lg">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses, instructors..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200">
                {c === "All" ? "All Categories" : c}
              </option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200">
                {l === "All" ? "All Levels" : l}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200">
                {s.label}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {(search || category !== "All" || level !== "All" || sort !== "newest") && (
            <button
              onClick={() => { setSearch(""); setCategory("All"); setLevel("All"); setSort("newest"); }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline px-2"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSpinner center />
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FiBookOpen}
            title="No courses found"
            description="Try adjusting your search or filter criteria."
          />
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
