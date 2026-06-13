"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { doc, collection, query, orderBy, limit, onSnapshot, where, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Mail,
  MessageCircle,
  Webhook,
  Globe,
  FileText,
  DollarSign,
  AlertTriangle,
  CircleDot,
  Calendar,
  X,
  ExternalLink,
  Trash2,
  CheckCheck,
  Plus,
  BookOpen,
  Code2,
  Clock,
  Briefcase,
  Zap,
} from "lucide-react";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { NotificationRepository } from "@/services/firestore/notifications";
import { NotificationLog, Tracker, TrackerEvent } from "@/types/database";

// Helper to format relative time
function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return "Never";
  let date: Date;
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  
  if (isNaN(date.getTime())) return "Never";
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

export default function AlertsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.uid;

  const [selectedChannel, setSelectedChannel] = useState("All Channels");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedTime, setSelectedTime] = useState("All Time");
  const [selectedId, setSelectedId] = useState<string>("");

  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>({ plan: "free" });
  const [analytics, setAnalytics] = useState<any>({ totalScans: 0 });
  const [loading, setLoading] = useState(true);

  // 1. Subscribe to notifications
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "users", userId, "notifications"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: NotificationLog[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({ id: docSnap.id, ...data } as NotificationLog);
      });
      setNotifications(list);
      setLoading(false);
      
      // Auto select first alert if not selected
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    });

    return () => unsub();
  }, [userId, selectedId]);

  // 2. Subscribe to trackers
  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, "trackers"), where("userId", "==", userId));
    const unsub = onSnapshot(q, (snap) => {
      setTrackers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tracker));
    });

    return () => unsub();
  }, [userId]);

  // 3. Subscribe to events subcollection of each tracker
  useEffect(() => {
    if (trackers.length === 0) {
      setEvents([]);
      return;
    }

    const unsubs = trackers.map((tracker) => {
      const eventsRef = collection(db, "trackers", tracker.id, "events");
      const q = query(eventsRef, orderBy("createdAt", "desc"), limit(50));
      return onSnapshot(q, (snap) => {
        const trackerEvents = snap.docs.map((d) => ({
          id: d.id,
          trackerId: tracker.id,
          trackerName: tracker.name,
          trackerType: tracker.type,
          ...d.data(),
        }));

        setEvents((prev) => {
          const filtered = prev.filter((e) => e.trackerId !== tracker.id);
          return [...filtered, ...trackerEvents];
        });
      });
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [trackers]);

  // 4. Subscribe to billing
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(doc(db, "billing", userId), (snap) => {
      if (snap.exists()) {
        setBilling(snap.data());
      }
    });

    return () => unsub();
  }, [userId]);

  // 5. Subscribe to analytics
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(doc(db, "analytics", userId), (snap) => {
      if (snap.exists()) {
        setAnalytics(snap.data());
      }
    });

    return () => unsub();
  }, [userId]);

  // Dynamic Plan & Usage configuration
  const planDetails = useMemo(() => {
    const isPro = billing?.plan === "pro";
    const isBusiness = billing?.plan === "business";
    return {
      planName: isPro ? "Pro Plan" : isBusiness ? "Business Plan" : "Free Plan",
      trackerCount: trackers.length,
      trackerLimit: isPro ? 50 : isBusiness ? 9999 : 5,
      scanCount: analytics?.totalScans ?? 0,
      scanLimit: isPro ? 10000 : isBusiness ? 999999 : 1000,
    };
  }, [billing, trackers, analytics]);

  // Dynamic channel counts
  const channelCounts = useMemo(() => {
    return {
      all: notifications.length,
      email: notifications.filter((n) => n.channel === "email").length,
      telegram: notifications.filter((n) => n.channel === "telegram").length,
      webhook: notifications.filter((n) => (n.channel as string) === "webhook").length,
    };
  }, [notifications]);

  const CHANNELS = [
    { name: "All Channels", icon: <CircleDot className="h-4 w-4" />, count: channelCounts.all },
    { name: "Email", icon: <Mail className="h-4 w-4" />, count: channelCounts.email },
    { name: "Telegram", icon: <MessageCircle className="h-4 w-4" />, count: channelCounts.telegram },
    { name: "Webhook", icon: <Webhook className="h-4 w-4" />, count: channelCounts.webhook },
  ];

  // Dynamic Alert type counts
  const typeCounts = useMemo(() => {
    const counts = { all: 0, content: 0, price: 0, job: 0, pdf: 0 };
    notifications.forEach((n) => {
      const event = events.find((e) => e.id === n.eventId);
      counts.all += 1;
      if (!event) return;
      if (event.type === "new_job") counts.job += 1;
      else if (event.type === "price_drop" || event.type === "price_increase") counts.price += 1;
      else if (event.type === "pdf_updated") counts.pdf += 1;
      else counts.content += 1;
    });
    return counts;
  }, [notifications, events]);

  const ALERT_TYPES = [
    { name: "All Types", count: typeCounts.all },
    { name: "Content Change", count: typeCounts.content },
    { name: "Price Drop", count: typeCounts.price },
    { name: "Job Update", count: typeCounts.job },
    { name: "PDF Update", count: typeCounts.pdf },
  ];

  const TIME_FILTERS = ["All Time", "Today", "This Week", "This Month"];

  // Helper selectors
  const getFaviconBg = (type?: string) => {
    switch (type) {
      case "job":
        return "#22C55E";
      case "price":
        return "#FF9900";
      case "section":
        return "#7C3AED";
      case "pdf":
        return "#F59E0B";
      default:
        return "#4285F4";
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
      default:
        return "#22C55E";
    }
  };

  // Convert real live data into view items
  const mappedAlerts = useMemo(() => {
    return notifications.map((n) => {
      const tracker = trackers.find((t) => t.id === n.trackerId);
      const event = events.find((e) => e.id === n.eventId);
      return {
        id: n.id,
        title: event?.title || "Crawler Scan Logged",
        badge: n.read ? null : "New",
        source: tracker?.name || "Target Monitor",
        desc: event?.summary || `Crawler verified successfully via ${n.channel}.`,
        time: formatRelativeTime(n.createdAt),
        unread: !n.read,
        favicon: tracker?.name ? tracker.name[0].toUpperCase() : "T",
        faviconBg: getFaviconBg(tracker?.type),
        type: event?.type ? event.type.replace("_", " ") : "crawler run",
        typeColor: getSeverityColor(event?.severity),
        trackerId: n.trackerId,
        eventId: n.eventId,
        createdAt: n.createdAt,
        channel: n.channel,
        status: n.status,
      };
    });
  }, [notifications, trackers, events]);

  // Apply filters
  const filteredAlerts = useMemo(() => {
    return mappedAlerts.filter((item) => {
      // 1. Channel Filter
      if (selectedChannel !== "All Channels") {
        if (selectedChannel === "Email" && item.channel !== "email") return false;
        if (selectedChannel === "Telegram" && item.channel !== "telegram") return false;
        if (selectedChannel === "Webhook" && (item.channel as string) !== "webhook") return false;
      }

      // 2. Type Filter
      if (selectedType !== "All Types") {
        const event = events.find((e) => e.id === item.eventId);
        if (selectedType === "Job Update" && event?.type !== "new_job") return false;
        if (selectedType === "Price Drop" && event?.type !== "price_drop" && event?.type !== "price_increase") return false;
        if (selectedType === "PDF Update" && event?.type !== "pdf_updated") return false;
        if (selectedType === "Content Change" && event?.type === "new_job" && event?.type === "price_drop" && event?.type === "price_increase" && event?.type === "pdf_updated") return false;
      }

      // 3. Time Filter
      if (selectedTime !== "All Time" && item.createdAt) {
        const date = (item.createdAt as any).toDate ? (item.createdAt as any).toDate() : new Date(item.createdAt as any);
        const diffDays = (Date.now() - date.getTime()) / (1000 * 3600 * 24);
        if (selectedTime === "Today" && diffDays > 1) return false;
        if (selectedTime === "This Week" && diffDays > 7) return false;
        if (selectedTime === "This Month" && diffDays > 30) return false;
      }

      return true;
    });
  }, [mappedAlerts, selectedChannel, selectedType, selectedTime, events]);

  const selectedAlert = mappedAlerts.find((a) => a.id === selectedId);

  const handleSelectAlert = async (alertId: string) => {
    setSelectedId(alertId);
    if (!userId) return;
    const alert = mappedAlerts.find((a) => a.id === alertId);
    if (alert && alert.unread) {
      try {
        await NotificationRepository.markAsRead(userId, alertId);
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await NotificationRepository.markAllAsRead(userId);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "notifications", alertId));
      if (selectedId === alertId) {
        setSelectedId("");
      }
    } catch (err) {
      console.error("Failed to delete alert notification:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Clock className="h-8 w-8 text-accent-primary animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Syncing alert dispatcher logs...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0 -mx-4 -my-4 md:-mx-8 md:-my-8 overflow-hidden" style={{ height: "calc(100vh - 72px)" }}>
      {/* ── Left Filter Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[220px] shrink-0 border-r border-border-glass bg-[#0A0A0A] overflow-y-auto flex flex-col gap-5 p-4"
      >
        {/* Alert Channels */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">Alert Channels</p>
          <div className="space-y-0.5">
            {CHANNELS.map((ch) => (
              <button
                key={ch.name}
                onClick={() => setSelectedChannel(ch.name)}
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-[12px] transition-colors cursor-pointer ${
                  selectedChannel === ch.name
                    ? "bg-surface text-foreground"
                    : "text-foreground-secondary hover:text-foreground hover:bg-surface/50"
                }`}
              >
                <span className="flex items-center gap-2">{ch.icon}{ch.name}</span>
                <span className={`text-[11px] font-semibold ${ch.count > 0 ? "text-foreground-muted" : "text-foreground-muted/40"}`}>{ch.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alert Types */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">Alert Types</p>
          <div className="space-y-0.5">
            {ALERT_TYPES.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedType(t.name)}
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-[12px] transition-colors cursor-pointer ${
                  selectedType === t.name
                    ? "bg-surface text-foreground"
                    : "text-foreground-secondary hover:text-foreground hover:bg-surface/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground-muted" />
                  {t.name}
                </span>
                <span className="text-[11px] text-foreground-muted">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Filters */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted">Time Filters</p>
          <div className="space-y-0.5">
            {TIME_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] transition-colors cursor-pointer ${
                  selectedTime === t
                    ? "bg-surface text-foreground"
                    : "text-foreground-secondary hover:text-foreground hover:bg-surface/50"
                }`}
              >
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Usage */}
        <div className="mt-auto rounded-xl border border-border-glass bg-bg-glass p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground">Plan Usage</span>
            <span className="rounded bg-accent-purple/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-purple capitalize">{billing?.plan || "Free"} Plan</span>
          </div>
          <div className="space-y-1.5 text-[10px] text-foreground-secondary">
            <div>
              <div className="mb-0.5 flex justify-between">
                <span>Trackers</span>
                <span>{planDetails.trackerCount} / {planDetails.trackerLimit > 9000 ? "∞" : planDetails.trackerLimit}</span>
              </div>
              <div className="h-1 rounded-full bg-surface-elevated">
                <div
                  className="h-1 rounded-full bg-accent-purple"
                  style={{ width: `${Math.min((planDetails.trackerCount / planDetails.trackerLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-0.5 flex justify-between">
                <span>Scans</span>
                <span>{planDetails.scanCount} / {planDetails.scanLimit > 900000 ? "∞" : planDetails.scanLimit}</span>
              </div>
              <div className="h-1 rounded-full bg-surface-elevated">
                <div
                  className="h-1 rounded-full bg-accent-purple"
                  style={{ width: `${Math.min((planDetails.scanCount / planDetails.scanLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push("/billing")}
            className="mt-2 w-full rounded-lg bg-surface py-1.5 text-[11px] font-medium text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>
      </motion.div>

      {/* ── Center Alert List ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* List Header */}
        <div className="flex items-center justify-between border-b border-border-glass px-4 py-3">
          <span className="text-[13px] font-semibold text-foreground">
            {filteredAlerts.length} Alerts {filteredAlerts.length !== mappedAlerts.length && `(filtered from ${mappedAlerts.length})`}
          </span>
          {mappedAlerts.some((a) => a.unread) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[12px] font-medium text-accent-primary hover:opacity-80 transition-opacity cursor-pointer"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Bell className="h-10 w-10 text-foreground-muted/40 mb-3" />
              <h4 className="text-sm font-bold text-foreground">No alerts match filters</h4>
              <p className="text-xs text-foreground-secondary mt-1 max-w-[200px]">
                Create trackers and run scans to generate live notifications.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isSelected = alert.id === selectedId;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => handleSelectAlert(alert.id)}
                  className={`flex cursor-pointer items-start gap-3 border-b border-border-glass/50 px-4 py-3.5 transition-all ${
                    isSelected
                      ? "bg-accent-purple/8 border-l-2 border-l-accent-purple"
                      : "hover:bg-surface/50"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white uppercase" style={{ background: alert.faviconBg }}>
                    {alert.favicon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-foreground truncate">{alert.title}</p>
                      {alert.badge && (
                        <span className="rounded-full bg-accent-purple/20 border border-accent-purple/30 px-1.5 py-0.5 text-[9px] font-semibold text-accent-purple">
                          {alert.badge}
                        </span>
                      )}
                      <span className="ml-auto text-[11px] text-foreground-muted shrink-0">{alert.time}</span>
                    </div>
                    <p className="truncate text-[12px] text-foreground-secondary">{alert.source}</p>
                    <p className="truncate text-[11px] text-foreground-muted">{alert.desc}</p>
                  </div>
                  <div className="flex shrink-0 items-center pt-1">
                    {alert.unread ? (
                      <span className="h-2 w-2 rounded-full bg-accent-purple" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-transparent border border-foreground-muted/30" />
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Detail Panel ── */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-[320px] shrink-0 border-l border-border-glass flex flex-col bg-[#0A0A0A]"
          >
            {/* Panel Header */}
            <div className="border-b border-border-glass p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-foreground">Alert Details</span>
                <button onClick={() => setSelectedId("")} className="flex h-7 w-7 items-center justify-center rounded text-foreground-muted hover:text-foreground hover:bg-surface cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white uppercase" style={{ background: selectedAlert.faviconBg }}>
                  {selectedAlert.favicon}
                </div>
                <div className="min-w-0">
                  <span className="rounded-lg px-2 py-0.5 text-[10px] font-medium uppercase" style={{ color: selectedAlert.typeColor, background: `${selectedAlert.typeColor}20` }}>
                    {selectedAlert.type}
                  </span>
                  <h3 className="mt-1 text-[15px] font-bold text-foreground break-words">{selectedAlert.title}</h3>
                  <p className="text-[12px] text-foreground-secondary break-words">{selectedAlert.source}</p>
                  <p className="text-[11px] text-foreground-muted font-mono">{selectedAlert.time}</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h4 className="mb-2 text-[13px] font-semibold text-foreground">Summary</h4>
                <p className="text-[12px] text-foreground-secondary leading-relaxed break-words">
                  {selectedAlert.desc}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/history?id=${selectedAlert.eventId}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-purple py-2.5 text-[13px] font-semibold text-white hover:bg-accent-purple/90 transition-colors cursor-pointer"
                >
                  <span>View Change Diff</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => router.push(`/trackers/${selectedAlert.trackerId}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-glass bg-bg-glass py-2.5 text-[13px] font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
                >
                  View Tracker Detail
                </button>
              </div>

              {/* Alert Channels */}
              <div>
                <h4 className="mb-2 text-[13px] font-semibold text-foreground">Dispatch Channel Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-foreground-secondary">
                      {selectedAlert.channel === "email" ? <Mail className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
                      <span className="capitalize">{selectedAlert.channel} Notification</span>
                    </span>
                    <span className={`flex items-center gap-1 font-medium capitalize ${selectedAlert.status === "sent" ? "text-success" : selectedAlert.status === "failed" ? "text-error" : "text-amber-500"}`}>
                      {selectedAlert.status}
                      {selectedAlert.status === "sent" && <CheckCheck className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border-glass p-3">
              <button
                onClick={() => handleDeleteAlert(selectedAlert.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/30 bg-error/10 py-2 text-[12px] font-medium text-error hover:bg-error/20 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Alert
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
