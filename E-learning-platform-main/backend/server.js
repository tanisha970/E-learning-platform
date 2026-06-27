// server.js — Main Express application entry point
const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Ensure uploads/videos directory exists for file storage
const fs = require("fs");
const uploadDir = path.join(__dirname, "uploads", "videos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost on any port (for development)
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "50mb" })); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded videos as static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth",        require("./routes/authRoutes"));
app.use("/api/courses",     require("./routes/courseRoutes"));
app.use("/api/enrollments", require("./routes/enrollmentRoutes"));
app.use("/api/payments",    require("./routes/paymentRoutes")); // Razorpay payment flow
app.use("/api/dashboard",   require("./routes/dashboardRoutes"));
app.use("/api/quizzes",     require("./routes/quizRoutes"));
app.use("/api/reviews",     require("./routes/reviewRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/upload",      require("./routes/uploadRoutes"));
app.use("/api/community",   require("./routes/communityRoutes"));
app.use("/api/progress",    require("./routes/progressRoutes"));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "E-Learning API is running 🚀", env: process.env.NODE_ENV });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});
