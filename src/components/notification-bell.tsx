"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Bell, Check, ExternalLink, Mail, MessageSquare } from "lucide-react";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { NotificationLog } from "@/types/database";
import { NotificationRepository } from "@/services/firestore/notifications";
import { logger } from "@/utils/logger";

export default function NotificationBell() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Real-time Firestore query for the last 5 notifications
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: NotificationLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            trackerId: data.trackerId ?? "",
            eventId: data.eventId ?? "",
            channel: data.channel ?? "email",
            status: data.status ?? "pending",
            read: data.read ?? false,
            sentAt: data.sentAt,
            createdAt: data.createdAt,
          });
        });
        setNotifications(list);
      },
      (error) => {
        logger.error({
          service: "firestore",
          event: "notification_bell_snapshot_failed",
          userId: user.uid,
          error,
        });
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await NotificationRepository.markAllAsRead(user.uid);
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "mark_all_read_bell_failed",
        userId: user.uid,
        error,
      });
    }
  };

  const handleMarkSingleAsRead = async (id: string) => {
    if (!user) return;
    try {
      await NotificationRepository.markAsRead(user.uid, id);
    } catch (error) {
      logger.error({
        service: "firestore",
        event: "mark_single_read_bell_failed",
        userId: user.uid,
        error,
      });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border-glass bg-bg-glass text-foreground-secondary hover:text-foreground hover:border-white/15 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-80 rounded-2xl border border-border-glass bg-surface/90 backdrop-blur-2xl p-2 shadow-large z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border-glass mb-2">
              <span className="text-xs font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-medium text-accent-primary hover:text-accent-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="h-3 w-3" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex flex-col gap-1 rounded-xl p-3 text-left transition-all relative group ${
                      notif.read ? "bg-transparent" : "bg-accent-primary/5 border border-accent-primary/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                        {notif.channel === "email" ? (
                          <Mail className="h-3.5 w-3.5 text-foreground-muted" />
                        ) : (
                          <MessageSquare className="h-3.5 w-3.5 text-foreground-muted" />
                        )}
                        <span className="font-mono text-[9px] uppercase tracking-wider">
                          {notif.channel}
                        </span>
                      </div>
                      
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkSingleAsRead(notif.id)}
                          className="opacity-0 group-hover:opacity-100 rounded bg-surface border border-border-glass p-0.5 text-foreground-muted hover:text-foreground transition-all cursor-pointer"
                          title="Mark read"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs font-medium text-foreground leading-normal">
                      {notif.channel === "email" ? "Alert dispatched via Email" : "Alert dispatched via Telegram"}
                    </p>
                    <p className="text-[10px] text-foreground-secondary">
                      Status: {notif.status}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-foreground-secondary/70">
                  <Bell className="h-8 w-8 text-foreground-muted/40 mb-2" />
                  <span>No recent notifications</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border-glass mt-2 pt-2 px-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/history");
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated py-2 text-center text-[10px] font-semibold text-foreground transition-colors cursor-pointer"
              >
                <span>View Full Change Log</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
