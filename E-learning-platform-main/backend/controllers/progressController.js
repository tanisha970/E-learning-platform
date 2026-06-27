// controllers/progressController.js — Study progress analytics for enrolled students
const StudySession = require("../models/StudySession");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

// Helper: get start of day in UTC
const startOfDay = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// Helper: get end of day in UTC
const endOfDay = (d) => {
  const date = new Date(d);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

// Helper: parse "mm:ss" or "h:mm:ss" duration string to minutes
const parseDuration = (str) => {
  if (!str || typeof str !== "string") return 5; // default 5 minutes
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return 5;
};

// @desc    Log a study session (auto or manual)
// @route   POST /api/progress/session
// @access  Private
exports.logSession = async (req, res, next) => {
  try {
    const { courseId, duration, videosCompleted, sessionType } = req.body;

    const session = await StudySession.create({
      user: req.user._id,
      course: courseId,
      date: startOfDay(new Date()),
      duration: duration || 5,
      videosCompleted: videosCompleted || 1,
      sessionType: sessionType || "video_complete",
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's progress for a course
// @route   GET /api/progress/:courseId/today
// @access  Private
exports.getTodayProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Get today's sessions
    const todaySessions = await StudySession.find({
      user: req.user._id,
      course: courseId,
      date: { $gte: today, $lte: todayEnd },
    });

    const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const sessionsCount = todaySessions.length;
    const videosCompletedToday = todaySessions.reduce((sum, s) => sum + s.videosCompleted, 0);

    // Get enrollment for overall progress
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    const course = await Course.findById(courseId);
    const totalVideos = course?.videos?.length || 0;
    const completedVideos = enrollment?.completedVideos?.length || 0;

    // Calculate focus percentage (completed / total * 100)
    const focusPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    // Calculate streak — consecutive days with sessions
    let streak = 0;
    const checkDate = new Date(today);

    // Check if there's a session today first
    if (todaySessions.length > 0) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Look back for consecutive days
    for (let i = 0; i < 365; i++) {
      const dayStart = startOfDay(checkDate);
      const dayEnd = endOfDay(checkDate);
      const count = await StudySession.countDocuments({
        user: req.user._id,
        course: courseId,
        date: { $gte: dayStart, $lte: dayEnd },
      });
      if (count > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Get this week's activity (7 days)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekSessions = await StudySession.find({
      user: req.user._id,
      course: courseId,
      date: { $gte: weekStart, $lte: todayEnd },
    });

    // Build week dots (last 7 days, true/false for each)
    const weekDots = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayS = startOfDay(d);
      const dayE = endOfDay(d);
      const hasSession = weekSessions.some(
        (s) => s.date >= dayS && s.date <= dayE
      );
      weekDots.push(hasSession);
    }

    // Sessions this week
    const weekSessionsCount = weekSessions.length;
    const weekCompletedSessions = weekSessions.reduce((sum, s) => sum + s.videosCompleted, 0);

    res.status(200).json({
      success: true,
      today: {
        totalMinutes,
        sessionsCount,
        videosCompletedToday,
        focusPercent,
        streak,
        overallProgress: enrollment?.progress || 0,
        completedVideos,
        totalVideos,
      },
      week: {
        dots: weekDots,
        sessionsCount: weekSessionsCount,
        videosCompleted: weekCompletedSessions,
        activeDays: weekDots.filter(Boolean).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weekly rhythm data
// @route   GET /api/progress/:courseId/weekly
// @access  Private
exports.getWeeklyProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const today = startOfDay(new Date());

    // Get the start of this week (Monday)
    const dayOfWeek = today.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - mondayOffset);

    const weekEnd = endOfDay(new Date());

    const sessions = await StudySession.find({
      user: req.user._id,
      course: courseId,
      date: { $gte: weekStart, $lte: weekEnd },
    });

    // Build daily breakdown (Mon-Sun)
    const dailyData = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    let totalStudyMinutes = 0;
    let activeDays = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dayS = startOfDay(d);
      const dayE = endOfDay(d);

      const daySessions = sessions.filter(
        (s) => s.date >= dayS && s.date <= dayE
      );

      const minutes = daySessions.reduce((sum, s) => sum + s.duration, 0);
      totalStudyMinutes += minutes;
      if (minutes > 0) activeDays++;

      dailyData.push({
        day: dayNames[i],
        minutes,
        sessions: daySessions.length,
        videosCompleted: daySessions.reduce((sum, s) => sum + s.videosCompleted, 0),
      });
    }

    // Previous week for comparison (study hours trend)
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setMilliseconds(-1);

    const prevSessions = await StudySession.find({
      user: req.user._id,
      course: courseId,
      date: { $gte: prevWeekStart, $lte: prevWeekEnd },
    });

    const prevWeekMinutes = prevSessions.reduce((sum, s) => sum + s.duration, 0);

    // Format the week range
    const weekRangeLabel = `${weekStart.getDate()} ${weekStart.toLocaleString("en", { month: "short" })} – ${new Date().getDate()} ${new Date().toLocaleString("en", { month: "short" })}`;

    res.status(200).json({
      success: true,
      weekly: {
        totalMinutes: totalStudyMinutes,
        activeDays,
        avgPerDay: activeDays > 0 ? Math.round(totalStudyMinutes / activeDays) : 0,
        startDay: dayNames[0],
        dailyData,
        prevWeekMinutes,
        weekRange: weekRangeLabel,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly calendar data
// @route   GET /api/progress/:courseId/monthly?month=3&year=2026
// @access  Private
exports.getMonthlyProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1; // 1-indexed
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const sessions = await StudySession.find({
      user: req.user._id,
      course: courseId,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    // Build day-by-day breakdown
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendarData = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStart = new Date(Date.UTC(year, month - 1, d));
      const dayEnd = new Date(Date.UTC(year, month - 1, d, 23, 59, 59, 999));

      const daySessions = sessions.filter(
        (s) => s.date >= dayStart && s.date <= dayEnd
      );

      const minutes = daySessions.reduce((sum, s) => sum + s.duration, 0);

      calendarData.push({
        day: d,
        date: dayStart.toISOString().split("T")[0],
        minutes,
        sessions: daySessions.length,
        videosCompleted: daySessions.reduce((sum, s) => sum + s.videosCompleted, 0),
      });
    }

    res.status(200).json({
      success: true,
      month,
      year,
      calendar: calendarData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregate stats for a course
// @route   GET /api/progress/:courseId/stats
// @access  Private
exports.getAggregateStats = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // All-time stats
    const allSessions = await StudySession.find({
      user: req.user._id,
      course: courseId,
    });

    const totalMinutes = allSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = allSessions.length;

    // Get unique study days
    const uniqueDays = new Set(
      allSessions.map((s) => s.date.toISOString().split("T")[0])
    );
    const totalStudyDays = uniqueDays.size;
    const avgPerDay = totalStudyDays > 0 ? Math.round(totalMinutes / totalStudyDays) : 0;

    // Current month stats
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = endOfDay(now);

    const monthSessions = allSessions.filter(
      (s) => s.date >= monthStart && s.date <= monthEnd
    );
    const monthMinutes = monthSessions.reduce((sum, s) => sum + s.duration, 0);
    const monthSessionsCount = monthSessions.length;
    const monthDays = new Set(
      monthSessions.map((s) => s.date.toISOString().split("T")[0])
    ).size;
    const monthAvgPerDay = monthDays > 0 ? Math.round(monthMinutes / monthDays) : 0;

    // Enrollment date
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    res.status(200).json({
      success: true,
      stats: {
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        totalSessions,
        totalStudyDays,
        avgPerDay,
        month: {
          totalMinutes: monthMinutes,
          totalHours: Math.round((monthMinutes / 60) * 10) / 10,
          sessions: monthSessionsCount,
          avgPerDay: monthAvgPerDay,
        },
        enrolledAt: enrollment?.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export parseDuration helper for use in enrollmentController
exports.parseDuration = parseDuration;
