require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Course = require("./models/Course");
const Quiz = require("./models/Quiz");

const seed = async () => {
  await connectDB();
  console.log("🌱 Starting database seed...\n");

  await User.deleteMany({});
  await Course.deleteMany({});
  await Quiz.deleteMany({});
  console.log("🗑️  Cleared existing data");

  // Use User.create() so that the bcrypt pre-save hook gets triggered
  const admin = await User.create({
    name: "Admin User",
    email: "admin@learnhub.com",
    password: "admin123",
    role: "admin",
    isVerified: true,
  });

  const student1 = await User.create({
    name: "Rohit Sharma",
    email: "student@learnhub.com",
    password: "student123",
    role: "student",
    isVerified: true,
  });

  const student2 = await User.create({
    name: "Priya Patel",
    email: "priya@example.com",
    password: "student123",
    role: "student",
    isVerified: true,
  });

  console.log("✅ Created users");

  const courses = await Course.insertMany([
    {
      title: "Complete React.js Developer Course 2024",
      description: "Master React.js from scratch to advanced. Learn hooks, context API, Redux, React Router.",
      instructor: "Rahul Verma", price: 999,
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80",
      category: "Web Development", level: "Beginner", rating: 4.8,
      studentsEnrolled: [student1._id],
      videos: [
        { title: "Introduction to React", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "15:20", order: 1 },
        { title: "JSX and Components", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "22:10", order: 2 },
        { title: "State and Props", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "18:45", order: 3 },
        { title: "React Hooks", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "28:30", order: 4 },
        { title: "Building Your First App", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "35:00", order: 5 },
      ],
    },
    {
      title: "Node.js & Express — Backend Development",
      description: "Learn server-side JavaScript with Node.js and Express. Build REST APIs, connect to MongoDB.",
      instructor: "Amit Kumar", price: 1299,
      thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
      category: "Web Development", level: "Intermediate", rating: 4.7,
      studentsEnrolled: [],
      videos: [
        { title: "Node.js Fundamentals", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "20:00", order: 1 },
        { title: "Express.js Routing", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "25:15", order: 2 },
        { title: "MongoDB with Mongoose", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "30:00", order: 3 },
      ],
    },
    {
      title: "DSA in C++ — Crack Placement Interviews",
      description: "Master DSA in C++ with 200+ problems. TCS NQT and Infosys DSE ready.",
      instructor: "Vikash Gupta", price: 799,
      thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80",
      category: "Other", level: "Beginner", rating: 4.6,
      studentsEnrolled: [student1._id, student2._id],
      videos: [
        { title: "Arrays & Two Pointers", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "32:00", order: 1 },
        { title: "Recursion & Backtracking", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "45:30", order: 2 },
        { title: "Binary Search", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "28:00", order: 3 },
        { title: "Trees & Graphs", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "55:00", order: 4 },
      ],
    },
    {
      title: "UI/UX Design with Figma — Zero to Pro",
      description: "Learn UI/UX design principles, Figma fundamentals, wireframing and prototyping.",
      instructor: "Sneha Kapoor", price: 0,
      thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80",
      category: "Design", level: "Beginner", rating: 4.5,
      studentsEnrolled: [],
      videos: [
        { title: "Design Thinking", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "20:00", order: 1 },
        { title: "Figma Basics", url: "https://www.youtube.com/embed/SqcY0GlETPk", duration: "25:00", order: 2 },
      ],
    },
  ]);

  console.log(`✅ Created ${courses.length} courses`);

  await Quiz.create({
    course: courses[0]._id,
    title: "React.js Fundamentals Quiz",
    passingScore: 60,
    questions: [
      { question: "What is JSX in React?", options: ["A JavaScript library", "A syntax extension that looks like HTML", "A CSS framework", "A database language"], correctAnswer: 1 },
      { question: "Which hook manages state in functional components?", options: ["useEffect", "useRef", "useState", "useContext"], correctAnswer: 2 },
      { question: "What does useEffect do?", options: ["Creates state", "Runs side effects after render", "Passes props", "Creates DOM refs"], correctAnswer: 1 },
      { question: "How to pass data from parent to child?", options: ["Using state", "Using props", "Using refs", "Using context"], correctAnswer: 1 },
      { question: "What is Virtual DOM?", options: ["A copy of real DOM in memory for efficient updates", "A JS engine", "A CSS method", "A testing tool"], correctAnswer: 0 },
    ],
  });

  await Quiz.create({
    course: courses[2]._id,
    title: "DSA Concepts Quiz",
    passingScore: 70,
    questions: [
      { question: "Time complexity of binary search?", options: ["O(n)", "O(n²)", "O(log n)", "O(1)"], correctAnswer: 2 },
      { question: "Which uses LIFO?", options: ["Queue", "Stack", "Linked List", "Tree"], correctAnswer: 1 },
      { question: "Worst case of QuickSort?", options: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"], correctAnswer: 2 },
      { question: "Preorder traversal visits?", options: ["Left, Root, Right", "Left, Right, Root", "Root, Left, Right", "Right, Left, Root"], correctAnswer: 2 },
    ],
  });

  console.log("✅ Created quizzes");
  console.log("\n🎉 Database seeded successfully!");
  console.log("📧 Admin:   admin@learnhub.com / admin123");
  console.log("📧 Student: student@learnhub.com / student123\n");
  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});