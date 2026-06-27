// src/pages/ProgressReportPage.jsx — Dark-themed study progress dashboard
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../utils/api";
import {
  FiArrowLeft, FiActivity, FiCalendar, FiTrendingUp,
  FiClock, FiTarget, FiZap, FiCheckCircle, FiPlay
} from "react-icons/fi";
import { LoadingSpinner } from "../components/common/UIComponents";

// ─── Helpers ──────────────────────────────────────────
const formatTime = (minutes) => {
  if (!minutes || minutes === 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};


const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Circular Progress Ring ──────────────────────────
const CircularProgress = ({ value, max, size = 120, strokeWidth = 8, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(59,130,246,0.12)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

// ─── Mini Bar Chart ──────────────────────────────────
const MiniBarChart = ({ data, maxVal }) => {
  const max = maxVal || Math.max(...data.map(d => d.minutes), 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full relative flex items-end" style={{ height: 80 }}>
            <div
              className="w-full rounded-sm transition-all duration-700"
              style={{
                height: `${Math.max((d.minutes / max) * 100, 3)}%`,
                background: d.minutes > 0
                  ? "linear-gradient(to top, #3b82f6, #8b5cf6)"
                  : "rgba(71,85,105,0.3)",
                minHeight: 3,
              }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-medium">{d.day}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Mini Line Chart (SVG) ───────────────────────────
const MiniLineChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.minutes), 1);
  const w = 200, h = 60, padding = 8;
  const plotW = w - padding * 2;
  const plotH = h - padding * 2;

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * plotW,
    y: padding + plotH - (d.minutes / max) * plotH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(59,130,246,0.3)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0)" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lineGrad)" />
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="#1e293b" strokeWidth="1.5" />
      ))}
    </svg>
  );
};

// ─── Calendar Day Cell ───────────────────────────────
const CalendarDay = ({ day, minutes, isToday, isSelected, onClick }) => {
  let intensity = "bg-transparent";
  let textColor = "text-gray-500";

  if (day) {
    if (minutes > 180) {
      intensity = "bg-blue-500";
      textColor = "text-white";
    } else if (minutes > 60) {
      intensity = "bg-blue-600/60";
      textColor = "text-blue-100";
    } else if (minutes > 0) {
      intensity = "bg-blue-700/30";
      textColor = "text-blue-300";
    }
  }

  return (
    <button
      onClick={() => day && onClick && onClick(day)}
      disabled={!day}
      className={`
        w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium
        transition-all duration-200 relative
        ${day ? "hover:ring-2 hover:ring-blue-400/40 cursor-pointer" : "cursor-default"}
        ${intensity} ${textColor}
        ${isToday ? "ring-2 ring-blue-400" : ""}
        ${isSelected ? "ring-2 ring-purple-400 scale-110" : ""}
      `}
    >
      {day || ""}
    </button>
  );
};

// ─── Dot Indicator (week activity) ───────────────────
const WeekDots = ({ dots }) => (
  <div className="flex gap-1">
    {dots.map((active, i) => (
      <div
        key={i}
        className={`w-2 h-2 rounded-full transition-all ${
          active ? "bg-green-400 shadow-sm shadow-green-400/40" : "bg-gray-600"
        }`}
      />
    ))}
  </div>
);

// ─── Intensity Legend ────────────────────────────────
const IntensityLegend = () => (
  <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
    <span className="w-2.5 h-2.5 rounded-sm bg-gray-700 inline-block" /> 0h
    <span className="w-2.5 h-2.5 rounded-sm bg-blue-700/30 inline-block" /> &lt;1h
    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600/60 inline-block" /> 1-3h
    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> 3h+
  </div>
);

// ─── Stat Pill ───────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, accent = "blue" }) => {
  const colors = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-green-400",
    amber: "text-amber-400",
  };

  return (
    <div className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon size={14} className={colors[accent]} />
        <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <span className={`text-xl font-bold ${colors[accent]}`}>{value}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
const ProgressReportPage = () => {
  const { id: courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");

  // Data states
  const [todayData, setTodayData] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [statsData, setStatsData] = useState(null);

  // Calendar navigation
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, weekRes, monthRes, statsRes, courseRes] = await Promise.all([
        API.get(`/progress/${courseId}/today`),
        API.get(`/progress/${courseId}/weekly`),
        API.get(`/progress/${courseId}/monthly?month=${calMonth}&year=${calYear}`),
        API.get(`/progress/${courseId}/stats`),
        API.get(`/courses/${courseId}`),
      ]);

      setTodayData(todayRes.data);
      setWeekData(weekRes.data.weekly);
      setMonthData(monthRes.data.calendar);
      setStatsData(statsRes.data.stats);
      setCourseName(courseRes.data.course?.title || "Course");
    } catch (err) {
      console.error("Failed to fetch progress data:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId, calMonth, calYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay();
  const todayDate = now.getDate();
  const isCurrentMonth = calMonth === now.getMonth() + 1 && calYear === now.getFullYear();

  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
    setSelectedDay(null);
  };

  const selectedDayData = monthData && selectedDay
    ? monthData.find(d => d.day === selectedDay) || { minutes: 0, sessions: 0, videosCompleted: 0 }
    : null;

  if (loading) return <LoadingSpinner center />;

  const today = todayData?.today || {};
  const week = todayData?.week || {};

  return (
    <div className="min-h-screen bg-gray-950 text-white transition-colors">
      {/* ── Header ─────────────────────────────── */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={`/courses/${courseId}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-400 transition"
            >
              <FiArrowLeft size={14} /> Back to Course
            </Link>
            <span className="text-gray-600">|</span>
            <h1 className="font-semibold text-white text-sm truncate max-w-xs">{courseName}</h1>
          </div>
          <span className="text-xs text-gray-500">
            {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ═══ TOP ROW: Today's Progress + Monthly Overview ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── TODAY'S PROGRESS ─────────────────── */}
          <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <FiActivity size={15} className="text-blue-400" /> Today's Progress
              </h2>
              <span className="text-xs text-gray-500">
                {now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 items-start">
              {/* Circular Progress */}
              <div className="flex flex-col items-center">
                <CircularProgress value={today.totalMinutes || 0} max={Math.max(today.totalMinutes || 1, 120)} size={110} strokeWidth={7}>
                  <span className="text-lg font-bold text-white">{formatTime(today.totalMinutes)}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">Study time</span>
                </CircularProgress>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  <span className="text-gray-400">Focus</span>
                  <span className="text-right text-green-400">{formatTime(today.totalMinutes)}</span>
                  <span className="text-gray-400">Break</span>
                  <span className="text-right text-gray-500">0h 0m</span>
                  <span className="text-gray-400">Progress</span>
                  <span className="text-right text-blue-400">{today.overallProgress || 0}%</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="space-y-3">
                {/* Focus */}
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FiTarget size={12} className="text-red-400" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Focus</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white">{today.focusPercent || 0}%</span>
                    {today.focusPercent > 70 && (
                      <span className="text-[9px] text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded-full">
                        +{today.focusPercent}% avg
                      </span>
                    )}
                  </div>
                </div>
                {/* Sessions */}
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FiPlay size={12} className="text-green-400" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Sessions</span>
                  </div>
                  <span className="text-xl font-bold text-white">
                    {today.completedVideos || 0} <span className="text-xs text-gray-400 font-normal">of {today.totalVideos || 0}</span>
                  </span>
                </div>
              </div>

              {/* This Week */}
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2">This Week</span>
                  <WeekDots dots={week.dots || [false,false,false,false,false,false,false]} />
                  <div className="mt-2 text-[11px] text-gray-400">
                    {week.activeDays || 0}/7 active days
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FiZap size={12} className="text-amber-400" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Streak</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white">{today.streak || 0}</span>
                    <span className="text-xs text-gray-400">days</span>
                  </div>
                  {today.streak > 0 && (
                    <span className="text-[9px] text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                      🔥 Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Completed / Remaining */}
            <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between">
              <div className="text-[11px]">
                <span className="text-gray-400">Completed: </span>
                <span className="text-green-400 font-semibold">{week.videosCompleted || 0}</span>
              </div>
              <div className="text-[11px]">
                <span className="text-gray-400">Remaining: </span>
                <span className="text-amber-400 font-semibold">{Math.max((today.totalVideos || 0) - (today.completedVideos || 0), 0)}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < Math.round((today.overallProgress || 0) / 10) ? "bg-green-400" : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── MONTHLY OVERVIEW ─────────────────── */}
          <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <FiCalendar size={15} className="text-purple-400" /> Monthly Overview
              </h2>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-gray-700/50">
                <FiArrowLeft size={14} />
              </button>
              <span className="text-sm font-medium text-gray-200">
                {MONTH_NAMES[calMonth - 1]} {calYear}
              </span>
              <button onClick={nextMonth} className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-gray-700/50 rotate-180">
                <FiArrowLeft size={14} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-center text-[10px] text-gray-500 font-medium py-1">{d}</div>
              ))}
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const dayData = monthData ? monthData.find(d => d.day === dayNum) : null;
                return (
                  <CalendarDay
                    key={dayNum}
                    day={dayNum}
                    minutes={dayData?.minutes || 0}
                    isToday={isCurrentMonth && dayNum === todayDate}
                    isSelected={dayNum === selectedDay}
                    onClick={setSelectedDay}
                  />
                );
              })}
            </div>

            {/* Intensity Legend */}
            <div className="mb-4">
              <IntensityLegend />
            </div>

            {/* Selected Day Details */}
            {selectedDayData && selectedDay && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Selected Day</span>
                    <p className="text-sm font-medium text-white">
                      {new Date(calYear, calMonth - 1, selectedDay).toLocaleDateString("en-US", {
                        weekday: "short", day: "numeric", month: "short"
                      })}
                    </p>
                  </div>
                  {selectedDayData.minutes > 0 && (
                    <span className="text-[9px] text-green-400 bg-green-900/30 px-2 py-1 rounded-full font-medium">
                      Active
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Study</span>
                    <span className="text-sm font-bold text-blue-400">{formatTime(selectedDayData.minutes)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Sessions</span>
                    <span className="text-sm font-bold text-purple-400">{selectedDayData.sessions}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Videos</span>
                    <span className="text-sm font-bold text-green-400">{selectedDayData.videosCompleted}</span>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min((selectedDayData.minutes / 180) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ BOTTOM ROW: Weekly Rhythm + Month Stats ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── WEEKLY RHYTHM (2/3 width) ────────── */}
          <div className="lg:col-span-2 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <FiTrendingUp size={15} className="text-green-400" /> Weekly Rhythm
              </h2>
              <span className="text-xs text-gray-500">{weekData?.weekRange || ""}</span>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Study Time</span>
                <span className="text-lg font-bold text-blue-400">{formatTime(weekData?.totalMinutes)}</span>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Active Days</span>
                <span className="text-lg font-bold text-green-400">{weekData?.activeDays || 0}/7</span>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Avg / Day</span>
                <span className="text-lg font-bold text-purple-400">{formatTime(weekData?.avgPerDay)}</span>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Start Day</span>
                <span className="text-lg font-bold text-amber-400">{weekData?.startDay || "Mon"}</span>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Study Hours Trend (line chart) */}
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-3 block">Study Hours Trend</span>
                {weekData?.dailyData ? (
                  <MiniLineChart data={weekData.dailyData} />
                ) : (
                  <div className="h-16 bg-gray-800/30 rounded-lg flex items-center justify-center text-xs text-gray-500">
                    No data
                  </div>
                )}
              </div>
              {/* Daily Focus (bar chart) */}
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-3 block">Daily Focus</span>
                {weekData?.dailyData ? (
                  <MiniBarChart data={weekData.dailyData} />
                ) : (
                  <div className="h-24 bg-gray-800/30 rounded-lg flex items-center justify-center text-xs text-gray-500">
                    No data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── THIS MONTH STATS (1/3 width) ─────── */}
          <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-5">
                <FiClock size={15} className="text-amber-400" /> This Month
              </h2>

              <div className="space-y-4">
                <StatPill
                  icon={FiClock}
                  label="Total Hours"
                  value={`${statsData?.month?.totalHours || 0}h`}
                  accent="blue"
                />
                <StatPill
                  icon={FiCheckCircle}
                  label="Sessions"
                  value={statsData?.month?.sessions || 0}
                  accent="green"
                />
                <StatPill
                  icon={FiTrendingUp}
                  label="Avg / Day"
                  value={formatTime(statsData?.month?.avgPerDay)}
                  accent="purple"
                />
              </div>
            </div>

            {/* All-Time Summary */}
            <div className="mt-5 pt-4 border-t border-gray-700/50">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">All Time</span>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-gray-500 block">Total Hours</span>
                  <span className="text-sm font-bold text-blue-400">{statsData?.totalHours || 0}h</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Sessions</span>
                  <span className="text-sm font-bold text-green-400">{statsData?.totalSessions || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Study Days</span>
                  <span className="text-sm font-bold text-purple-400">{statsData?.totalStudyDays || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Avg / Day</span>
                  <span className="text-sm font-bold text-amber-400">{formatTime(statsData?.avgPerDay)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Progress based on target banner ────── */}
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/30 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              ● {today.completedVideos || 0} of {today.totalVideos || 0} sessions completed — score: {today.overallProgress || 0}%
            </span>
            <div className="w-full max-w-md bg-gray-800 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${today.overallProgress || 0}%` }}
              />
            </div>
          </div>
          <Link
            to={`/courses/${courseId}`}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <FiPlay size={12} /> Continue Learning
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProgressReportPage;
