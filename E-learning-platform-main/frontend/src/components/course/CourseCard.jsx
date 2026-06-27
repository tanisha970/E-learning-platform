// src/components/course/CourseCard.jsx — Reusable card for course listings (with dark mode)
import { Link } from "react-router-dom";
import { FiUsers, FiStar } from "react-icons/fi";

const FALLBACK_THUMBNAIL = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80";

const levelColors = {
  Beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const CourseCard = ({ course }) => {
  const { _id, title, instructor, price, thumbnail, category, level, studentsEnrolled, rating } = course;

  return (
    <Link to={`/courses/${_id}`} className="group block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1">
      {/* Thumbnail */}
      <div className="relative overflow-hidden h-44">
        <img
          src={thumbnail || FALLBACK_THUMBNAIL}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = FALLBACK_THUMBNAIL; }}
        />
        <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
          {category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelColors[level] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
            {level}
          </span>
          <div className="flex items-center gap-1 text-amber-500 text-xs">
            <FiStar size={12} className="fill-current" />
            <span>{rating?.toFixed(1) || "4.5"}</span>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mt-2 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>

        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{instructor}</p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs">
            <FiUsers size={12} />
            <span>{studentsEnrolled?.length || 0} students</span>
          </div>
          <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">
            {price === 0 ? "Free" : `₹${price.toLocaleString()}`}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
