// src/pages/CourseFormPage.jsx — Admin: Create or Edit a course (with video upload support)
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiLink, FiUploadCloud, FiCheck } from "react-icons/fi";
import { LoadingSpinner } from "../components/common/UIComponents";
import { useNotifications } from "../context/NotificationContext";

const CATEGORIES = ["Web Development", "Data Science", "Mobile Development", "DevOps", "Design", "Business", "Other"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const emptyVideo = { title: "", url: "", duration: "", videoType: "link" };

// Convert any YouTube URL format to embed URL
const toYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  try {
    if (url.includes("youtube.com/embed/")) return url;
    let videoId = null;
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) videoId = watchMatch[1];
    if (!videoId) {
      const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (shortMatch) videoId = shortMatch[1];
    }
    if (!videoId) {
      const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) videoId = shortsMatch[1];
    }
    if (!videoId) {
      const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
      if (liveMatch) videoId = liveMatch[1];
    }
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  } catch (e) {}
  return url;
};

// Format file size
const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const CourseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const isEditing = !!id;

  const [form, setForm] = useState({
    title: "", description: "", instructor: "",
    price: 0, thumbnail: "", category: "Web Development",
    level: "Beginner", isPublished: true, videos: [],
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // { [videoIdx]: percentage }

  useEffect(() => {
    if (isEditing) {
      API.get(`/courses/${id}`)
        .then(({ data }) => { setForm(data.course); setLoading(false); })
        .catch(() => { toast.error("Course not found"); navigate("/admin"); });
    }
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleVideoChange = (idx, field, value) => {
    const videos = [...form.videos];
    // Auto-convert YouTube URLs to embed format (only for link-type)
    const finalValue = (field === "url" && videos[idx].videoType === "link") ? toYouTubeEmbedUrl(value) : value;
    videos[idx] = { ...videos[idx], [field]: finalValue };
    setForm({ ...form, videos });
  };

  const toggleVideoType = (idx, type) => {
    const videos = [...form.videos];
    videos[idx] = { ...videos[idx], videoType: type, url: "" };
    setForm({ ...form, videos });
    // Clear upload progress for this index
    setUploadProgress((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const addVideo = () => setForm({ ...form, videos: [...form.videos, { ...emptyVideo }] });

  const removeVideo = (idx) => {
    setForm({ ...form, videos: form.videos.filter((_, i) => i !== idx) });
    // Clean up upload progress
    setUploadProgress((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  // Handle file upload for a specific video index
  const handleFileUpload = async (idx, file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/x-matroska", "video/quicktime", "video/x-msvideo", "video/ogg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only video files (mp4, webm, mkv, mov, avi) are allowed.");
      return;
    }

    // Validate file size (500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 500MB.");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);

    try {
      setUploadProgress((prev) => ({ ...prev, [idx]: 0 }));

      const { data } = await API.post("/upload/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress((prev) => ({ ...prev, [idx]: percent }));
        },
      });

      if (data.success) {
        // Update the video's URL with the uploaded file path
        const videos = [...form.videos];
        videos[idx] = { ...videos[idx], url: data.url };
        setForm({ ...form, videos });
        setUploadProgress((prev) => ({ ...prev, [idx]: 100 }));
        toast.success(`Video uploaded! (${formatSize(data.size)})`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed.");
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.instructor.trim()) {
      return toast.error("Please fill all required fields.");
    }

    // Check if any video is pending upload
    const hasIncompleteUpload = form.videos.some(
      (v) => v.videoType === "upload" && !v.url
    );
    if (hasIncompleteUpload) {
      return toast.error("Please upload all video files before saving.");
    }

    setSaving(true);
    try {
      if (isEditing) {
        await API.put(`/courses/${id}`, form);
        toast.success("Course updated successfully!");
        addNotification(`Course "${form.title}" updated successfully! ✅`, { type: "success" });
      } else {
        await API.post("/courses", form);
        toast.success("Course created successfully!");
        addNotification(`New course "${form.title}" published! All students have been notified. 🎉`, { type: "success" });
      }
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save course.");
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
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 mb-4 transition">
            <FiArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? "Edit Course" : "Create New Course"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-5">
            <h2 className="font-semibold text-gray-800 dark:text-white text-base">Course Details</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title" value={form.title} onChange={handleChange}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., Complete React Developer Course" required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description" value={form.description} onChange={handleChange} rows={4}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition bg-white dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="What will students learn in this course?" required
              />
            </div>

            {/* Instructor & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Instructor Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="instructor" value={form.instructor} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="e.g., Rohit Sharma" required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Price (₹) — Set 0 for free
                </label>
                <input
                  name="price" type="number" min="0" value={form.price} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Category & Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                <select
                  name="category" value={form.category} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 dark:text-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Level</label>
                <select
                  name="level" value={form.level} onChange={handleChange}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 dark:text-white"
                >
                  {LEVELS.map((l) => (
                    <option key={l} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thumbnail URL</label>
              <input
                name="thumbnail" value={form.thumbnail} onChange={handleChange}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="https://images.unsplash.com/photo-...?w=600"
              />
              {form.thumbnail && (
                <img src={form.thumbnail} alt="preview" className="mt-2 h-28 w-full object-cover rounded-xl"
                  onError={(e) => { e.target.style.display = "none"; }} />
              )}
            </div>

            {/* Published Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox" name="isPublished" id="isPublished"
                checked={form.isPublished} onChange={handleChange}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <label htmlFor="isPublished" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Publish course (visible to students)
              </label>
            </div>
          </div>

          {/* Videos Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white text-base">Video Lessons</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Add lessons via YouTube link or upload from your computer</p>
              </div>
              <button
                type="button" onClick={addVideo}
                className="inline-flex items-center gap-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition font-medium"
              >
                <FiPlus size={14} /> Add Video
              </button>
            </div>

            {form.videos.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                <FiUploadCloud size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No videos yet.</p>
                <button type="button" onClick={addVideo} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  + Add your first lesson
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {form.videos.map((video, idx) => (
                  <div key={idx} className="border border-gray-100 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full">
                        Lesson {idx + 1}
                      </span>
                      <button type="button" onClick={() => removeVideo(idx)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition">
                        <FiTrash2 size={14} />
                      </button>
                    </div>

                    {/* Video Title */}
                    <input
                      value={video.title}
                      onChange={(e) => handleVideoChange(idx, "title", e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white mb-2.5 placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Lesson title (e.g., Introduction to React Hooks)"
                    />

                    {/* Video Source Toggle */}
                    <div className="flex gap-2 mb-2.5">
                      <button
                        type="button"
                        onClick={() => toggleVideoType(idx, "link")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          video.videoType === "link"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500"
                        }`}
                      >
                        <FiLink size={12} /> YouTube Link
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleVideoType(idx, "upload")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          video.videoType === "upload"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500"
                        }`}
                      >
                        <FiUploadCloud size={12} /> Upload File
                      </button>
                    </div>

                    {/* YouTube Link Input */}
                    {video.videoType === "link" && (
                      <input
                        value={video.url}
                        onChange={(e) => handleVideoChange(idx, "url", e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white mb-2.5 placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Paste YouTube link (e.g., https://www.youtube.com/watch?v=VIDEO_ID)"
                      />
                    )}

                    {/* File Upload Area */}
                    {video.videoType === "upload" && (
                      <div className="mb-2.5">
                        {video.url ? (
                          /* File uploaded successfully */
                          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3">
                            <FiCheck size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">
                                Video uploaded successfully
                              </p>
                              <p className="text-xs text-emerald-500 dark:text-emerald-400 truncate">{video.url}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const videos = [...form.videos];
                                videos[idx] = { ...videos[idx], url: "" };
                                setForm({ ...form, videos });
                                setUploadProgress((prev) => {
                                  const next = { ...prev };
                                  delete next[idx];
                                  return next;
                                });
                              }}
                              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-red-500 font-medium"
                            >
                              Replace
                            </button>
                          </div>
                        ) : uploadProgress[idx] !== undefined && uploadProgress[idx] < 100 ? (
                          /* Upload in progress */
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Uploading...</p>
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{uploadProgress[idx]}%</span>
                            </div>
                            <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[idx]}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          /* File picker / drop zone */
                          <FileDropZone
                            onFile={(file) => handleFileUpload(idx, file)}
                          />
                        )}
                      </div>
                    )}

                    {/* Duration */}
                    <input
                      value={video.duration}
                      onChange={(e) => handleVideoChange(idx, "duration", e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Duration (e.g., 12:34)"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-8">
            <button
              type="button" onClick={() => navigate("/admin")}
              className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : (
                <><FiSave size={15} /> {isEditing ? "Save Changes" : "Create Course"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── File Drop Zone Component ───
const FileDropZone = ({ onFile }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-all ${
        isDragging
          ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
          : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/x-matroska,video/quicktime,video/x-msvideo,video/ogg"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) onFile(file);
          e.target.value = ""; // Reset so same file can be re-selected
        }}
        className="hidden"
      />
      <FiUploadCloud size={24} className={`mx-auto mb-2 ${isDragging ? "text-emerald-500" : "text-gray-300 dark:text-gray-500"}`} />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isDragging ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Drop to upload</span>
        ) : (
          <>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Click to browse</span> or drag & drop
          </>
        )}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">MP4, WebM, MKV, MOV, AVI (max 500MB)</p>
    </div>
  );
};

export default CourseFormPage;
