
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/api";

function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Failed to fetch unread notification count:", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);

    try {
      const response = await api.get("/notifications/");
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);

      toast.error(
        error.response?.data?.detail || "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);

      const notification = notifications.find(
        (item) => item.id === notificationId
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? { ...item, is_read: true }
            : item
        )
      );

      if (notification && !notification.is_read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);

      toast.error(
        error.response?.data?.detail ||
          "Failed to update notification"
      );
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "BOOKING":
        return "🎟️";
      case "EVENT":
        return "📅";
      case "PAYMENT":
        return "💳";
      case "SYSTEM":
      default:
        return "🔔";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
      >
        <span className="text-lg" aria-hidden="true">
          🔔
        </span>

        <span>Notifications</span>

        {unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-4">
            <div>
              <h3 className="font-bold text-slate-900">Notifications</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>

            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xl"
              aria-hidden="true"
            >
              🔔
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl" aria-hidden="true">
                  🎉
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-800">
                  You're all caught up!
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  New updates will appear here.
                </p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <article
                  key={notification.id}
                  className={`border-b border-slate-100 p-4 transition hover:bg-slate-50 ${
                    notification.is_read ? "bg-white" : "bg-indigo-50/70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm ring-1 ring-slate-100">
                      {getNotificationIcon(notification.type)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {notification.title}
                        </p>

                        {!notification.is_read && (
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600"
                            aria-label="Unread"
                          />
                        )}
                      </div>

                      <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                        {notification.message}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <time className="text-[11px] text-slate-400">
                          {notification.created_at
                            ? new Date(
                                notification.created_at
                              ).toLocaleString()
                            : "N/A"}
                        </time>

                        {!notification.is_read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="rounded-md px-2 py-1 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 bg-white p-3">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
