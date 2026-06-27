// components/course/CommunityChat.jsx — Per-course discussion space
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiSend,
  FiMessageCircle,
  FiLock,
  FiChevronUp,
  FiTrash2,
  FiShield,
} from "react-icons/fi";

const CommunityChat = ({ courseId, isEnrolled, communityEnabled: initialEnabled }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [communityEnabled, setCommunityEnabled] = useState(initialEnabled);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const isFirstLoad = useRef(true);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "instant",
      });
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(
    async (before = null, isPolling = false) => {
      try {
        let url = `/community/${courseId}`;
        if (before) url += `?before=${before}`;

        const { data } = await API.get(url);

        if (before) {
          // Prepending older messages
          setMessages((prev) => [...data.messages, ...prev]);
        } else if (isPolling) {
          // Only update if message count changed (avoid unnecessary re-renders)
          setMessages((prev) => {
            if (data.messages.length !== prev.length) {
              return data.messages;
            }
            // Check if last message ID differs
            const lastNew = data.messages[data.messages.length - 1]?._id;
            const lastOld = prev[prev.length - 1]?._id;
            if (lastNew !== lastOld) {
              return data.messages;
            }
            return prev;
          });
        } else {
          setMessages(data.messages);
        }

        setHasMore(data.hasMore);
        setCommunityEnabled(data.communityEnabled);

        // Scroll to bottom on first load
        if (isFirstLoad.current && !before) {
          isFirstLoad.current = false;
          setTimeout(() => scrollToBottom(false), 100);
        }
      } catch (err) {
        if (!isPolling) {
          console.error("Failed to fetch messages:", err);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [courseId, scrollToBottom]
  );

  // Initial fetch + polling
  useEffect(() => {
    if (!isEnrolled && user?.role !== "admin") return;

    fetchMessages();

    // Poll every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(null, true);
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [courseId, isEnrolled, user, fetchMessages]);

  // Load older messages
  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    await fetchMessages(messages[0]._id);
  };

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { data } = await API.post(`/community/${courseId}`, {
        message: newMessage.trim(),
      });
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to send message."
      );
    } finally {
      setSending(false);
    }
  };

  // Delete message (admin only)
  const handleDelete = async (messageId) => {
    try {
      await API.delete(`/community/message/${messageId}`);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      toast.success("Message deleted.");
    } catch (err) {
      toast.error("Failed to delete message.");
    }
  };

  // Format time
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) return time;
    if (isYesterday) return `Yesterday, ${time}`;
    return (
      date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }) +
      `, ${time}`
    );
  };

  // Generate avatar color based on name
  const getAvatarGradient = (name) => {
    const gradients = [
      "from-blue-500 to-indigo-600",
      "from-emerald-500 to-teal-600",
      "from-purple-500 to-violet-600",
      "from-rose-500 to-pink-600",
      "from-amber-500 to-orange-600",
      "from-cyan-500 to-blue-600",
      "from-fuchsia-500 to-purple-600",
      "from-lime-500 to-green-600",
    ];
    const idx = (name || "A").charCodeAt(0) % gradients.length;
    return gradients[idx];
  };

  if (!isEnrolled && user?.role !== "admin") return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden mt-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FiMessageCircle size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">
                Community Discussion
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {communityEnabled
                  ? `${messages.length} message${messages.length !== 1 ? "s" : ""} • Ask doubts, share insights`
                  : "Community is currently closed"}
              </p>
            </div>
          </div>
          {!communityEnabled && (
            <span className="inline-flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              <FiLock size={12} /> Closed
            </span>
          )}
          {communityEnabled && (
            <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Open
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className="h-[320px] overflow-y-auto px-6 py-4 space-y-1 scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgb(203, 213, 225) transparent",
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Loading messages...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center py-2">
                <button
                  onClick={loadMoreMessages}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-full transition disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FiChevronUp size={14} /> Load older messages
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Empty State */}
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                  <FiMessageCircle
                    size={28}
                    className="text-indigo-400 dark:text-indigo-500"
                  />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  No messages yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Be the first to start the conversation!
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, idx) => {
              const isOwn = msg.user?._id === user?._id;
              const isAdmin = msg.user?.role === "admin";
              const showAvatar =
                idx === 0 ||
                messages[idx - 1]?.user?._id !== msg.user?._id;

              return (
                <div key={msg._id} className={`group ${showAvatar ? "mt-4" : "mt-0.5"}`}>
                  {/* Avatar + Name (only for first message in a streak) */}
                  {showAvatar && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarGradient(
                          msg.user?.name
                        )} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}
                      >
                        {msg.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isOwn
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {isOwn ? "You" : msg.user?.name}
                      </span>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          <FiShield size={9} /> Admin
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`relative ml-9 max-w-[85%] ${
                      isOwn ? "" : ""
                    }`}
                  >
                    <div
                      className={`px-3.5 py-2 rounded-xl text-sm leading-relaxed break-words ${
                        isOwn
                          ? "bg-indigo-50 dark:bg-indigo-900/20 text-gray-800 dark:text-gray-200 border border-indigo-100 dark:border-indigo-800/50"
                          : isAdmin
                          ? "bg-amber-50 dark:bg-amber-900/10 text-gray-800 dark:text-gray-200 border border-amber-100 dark:border-amber-800/30"
                          : "bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-600/50"
                      }`}
                    >
                      {msg.message}

                      {/* Delete button for admin */}
                      {user?.role === "admin" && (
                        <button
                          onClick={() => handleDelete(msg._id)}
                          className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                          title="Delete message"
                        >
                          <FiTrash2 size={10} />
                        </button>
                      )}
                    </div>

                    {/* Timestamp on non-first messages */}
                    {!showAvatar && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
        {!communityEnabled ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500 py-2">
            <FiLock size={14} />
            <span>Community chat is closed by the admin</span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                maxLength={1000}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 dark:focus:border-indigo-600 transition"
              />
              {newMessage.length > 900 && (
                <span
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium ${
                    newMessage.length >= 1000
                      ? "text-red-500"
                      : "text-amber-500"
                  }`}
                >
                  {newMessage.length}/1000
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSend size={15} />
              )}
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CommunityChat;
