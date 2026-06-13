"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Bell,
  TrendingUp,
  CheckCircle,
  Plus,
  SlidersHorizontal,
  Loader2,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { db } from "@/services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { Tracker, TrackerEvent, UserAnalytics } from "@/types/database";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

function parseDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  try {
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp.seconds === "number") {
      return new Date(timestamp.seconds * 1000);
    }
    if (typeof timestamp === "string" || typeof timestamp === "number") {
      const d = new Date(timestamp);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  } catch {
    return null;
  }
}

function StatCard({
  label, value, sub, subColor, icon, iconBg,
}: {
  label: string; value: string; sub: string; subColor?: string; icon: React.ReactNode; iconBg: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card flex items-center gap-4 rounded-2xl p-5"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-foreground-secondary">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-[11px]" style={{ color: subColor ?? "#A1A1AA" }}>{sub}</p>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-glass bg-[#111] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const userId = user?.uid;

  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to user's trackers
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "trackers"), where("userId", "==", userId));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tracker);
      setTrackers(items);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  // Subscribe to user notifications count
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "users", userId, "notifications"));
    const unsub = onSnapshot(q, (snap) => {
      setNotificationsCount(snap.docs.length);
    });
    return () => unsub();
  }, [userId]);

  // Subscribe to user analytics doc
  useEffect(() => {
    if (!userId) return;
    const docRef = doc(db, "analytics", userId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setAnalytics(snap.data() as UserAnalytics);
      }
    });
    return () => unsub();
  }, [userId]);

  // Subscribe to events subcollection of each tracker
  useEffect(() => {
    if (trackers.length === 0) {
      setEvents([]);
      return;
    }

    const unsubs = trackers.map((tracker) => {
      const eventsRef = collection(db, "trackers", tracker.id, "events");
      const q = query(eventsRef, orderBy("createdAt", "desc"), limit(10));
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
          const merged = [...filtered, ...trackerEvents];
          // Sort events by createdAt descending
          return merged.sort((a, b) => {
            const timeA = a.createdAt?.seconds ?? 0;
            const timeB = b.createdAt?.seconds ?? 0;
            return timeB - timeA;
          });
        });
      });
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [trackers]);

  // Dynamic statistics calculations
  const totalTrackersCount = trackers.length;
  const totalChangesCount = trackers.reduce((sum, t) => sum + (t.changeCount || 0), 0);
  const totalAlertsCount = analytics?.notificationsSent ?? notificationsCount;
  
  // Success rate calculator
  const successRateString = useMemo(() => {
    if (analytics) {
      const total = analytics.successfulScans + analytics.failedScans;
      if (total > 0) {
        return `${Math.round((analytics.successfulScans / total) * 1000) / 10}%`;
      }
    }
    const failedCount = trackers.filter(t => t.status === "error").length;
    if (trackers.length > 0) {
      const successRate = ((trackers.length - failedCount) / trackers.length) * 100;
      return `${Math.round(successRate * 10) / 10}%`;
    }
    return "100%";
  }, [analytics, trackers]);

  // Daily changes chart data over the last 7 days
  const activityData = useMemo(() => {
    const data: Record<string, { date: string; changes: number; alerts: number }> = {};
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return dateStr;
    }).reverse();

    days.forEach(day => {
      data[day] = { date: day, changes: 0, alerts: 0 };
    });

    events.forEach(event => {
      const dateObj = parseDate(event.createdAt);
      if (!dateObj) return;
      const dateStr = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (data[dateStr]) {
        data[dateStr].changes += 1;
        if (event.severity === "high" || event.severity === "medium") {
          data[dateStr].alerts += 1;
        }
      }
    });

    return Object.values(data);
  }, [events]);

  // Breakdown of changes by type
  const changeBreakdownData = useMemo(() => {
    const counts = { New: 0, Updated: 0, Removed: 0, Price: 0 };
    events.forEach(e => {
      if (e.type === "new_job" || e.type === "content_added") counts.New += 1;
      else if (e.type === "price_drop" || e.type === "price_increase") counts.Price += 1;
      else if (e.type === "content_removed") counts.Removed += 1;
      else counts.Updated += 1;
    });

    return [
      { name: "New", value: counts.New, color: "#22C55E" },
      { name: "Updated", value: counts.Updated, color: "#3B82F6" },
      { name: "Removed", value: counts.Removed, color: "#EF4444" },
      { name: "Price", value: counts.Price, color: "#F59E0B" },
    ].filter(item => item.value > 0); // Hide empty slices
  }, [events]);

  // Status breakdown of trackers
  const trackerStatusData = useMemo(() => {
    const counts = { active: 0, paused: 0, failed: 0, draft: 0 };
    trackers.forEach(t => {
      if (t.status === "active") counts.active += 1;
      else if (t.status === "paused") counts.paused += 1;
      else if (t.status === "error") counts.failed += 1;
      else counts.draft += 1;
    });

    return [
      { name: "Active", value: counts.active, color: "#22C55E" },
      { name: "Paused", value: counts.paused, color: "#F59E0B" },
      { name: "Failed", value: counts.failed, color: "#EF4444" },
      { name: "Draft", value: counts.draft, color: "#71717A" },
    ];
  }, [trackers]);

  // Top trackers by change frequency
  const topTrackers = useMemo(() => {
    return [...trackers]
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, 5)
      .map(t => ({
        name: t.name,
        changes: t.changeCount,
        trend: t.changeCount > 0 ? "up" : "down"
      }));
  }, [trackers]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-accent-primary animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Loading dashboard...</p>
      </div>
    );
  }

  const recentEvents = events.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header Row ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.displayName?.split(" ")[0] ?? "User"}! 👋
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Here&apos;s what&apos;s happening with your trackers today.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => router.push("/trackers?create=true")}
            className="h-9 gap-2 bg-accent-purple hover:bg-accent-purple/90 text-white text-sm font-semibold rounded-xl px-4"
          >
            <Plus className="h-4 w-4" />
            Add Tracker
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Trackers"
          value={String(totalTrackersCount)}
          sub="Live active scanners"
          subColor="#a1a1aa"
          iconBg="linear-gradient(135deg, #7C3AED, #8B5CF6)"
          icon={<Activity className="h-5 w-5 text-white" />}
        />
        <StatCard
          label="Changes Detected"
          value={String(totalChangesCount)}
          sub="Web content adjustments"
          subColor="#a1a1aa"
          iconBg="linear-gradient(135deg, #2563EB, #3B82F6)"
          icon={<Zap className="h-5 w-5 text-white" />}
        />
        <StatCard
          label="Alerts Sent"
          value={String(totalAlertsCount)}
          sub="Email and Telegram alerts"
          subColor="#a1a1aa"
          iconBg="linear-gradient(135deg, #D97706, #F59E0B)"
          icon={<Bell className="h-5 w-5 text-white" />}
        />
        <StatCard
          label="Success Rate"
          value={successRateString}
          sub="Average scanner health"
          subColor="#22C55E"
          iconBg="linear-gradient(135deg, #16A34A, #22C55E)"
          icon={<TrendingUp className="h-5 w-5 text-white" />}
        />
      </div>

      {totalTrackersCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl p-8">
          <Activity className="h-12 w-12 text-foreground-muted mb-4" />
          <h3 className="text-lg font-bold text-foreground">No Trackers Configured</h3>
          <p className="text-sm text-foreground-secondary max-w-sm mt-1">
            You don&apos;t have any active change trackers running. Get started by adding a tracker to monitor web contents.
          </p>
          <Button
            onClick={() => router.push("/trackers?create=true")}
            className="mt-6 bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Your First Tracker
          </Button>
        </div>
      ) : (
        <>
          {/* ── Middle Row ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Activity Overview Chart */}
            <div className="glass-card rounded-2xl p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-foreground">Activity Overview</h3>
              </div>
              <div className="mb-3 flex items-center gap-5 text-xs">
                <span className="flex items-center gap-1.5 text-foreground-secondary">
                  <span className="h-2 w-2 rounded-full bg-accent-purple inline-block" />
                  Changes Detected
                </span>
                <span className="flex items-center gap-1.5 text-foreground-secondary">
                  <span className="h-2 w-2 rounded-full bg-accent-primary inline-block" />
                  Alerts Sent
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={activityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradChanges" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="changes" stroke="#8B5CF6" strokeWidth={2} fill="url(#gradChanges)" dot={{ fill: "#8B5CF6", r: 3 }} />
                  <Area type="monotone" dataKey="alerts" stroke="#3B82F6" strokeWidth={2} fill="url(#gradAlerts)" dot={{ fill: "#3B82F6", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Activity */}
            <div className="glass-card rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-foreground">Recent Activity</h3>
                <Link href="/history" className="text-xs font-medium text-accent-primary hover:opacity-80 transition-opacity">
                  View all
                </Link>
              </div>
              {recentEvents.length === 0 ? (
                <p className="text-xs text-foreground-muted py-8 text-center">No monitoring events registered yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white bg-accent-purple/20 text-accent-purple">
                        {item.trackerName?.[0]?.toUpperCase() || "T"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium text-foreground">{item.title}</p>
                        <p className="truncate text-[11px] text-foreground-secondary">{item.trackerName} • {item.summary}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[10px] text-foreground-muted">{formatRelativeTime(item.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom Row ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Recent Changes */}
            <div className="glass-card rounded-2xl p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-foreground">Recent Changes</h3>
                <Link href="/history" className="text-xs font-medium text-accent-primary hover:opacity-80">
                  View all
                </Link>
              </div>
              {recentEvents.length === 0 ? (
                <p className="text-xs text-foreground-muted py-8 text-center">No changes detected yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/history?id=${item.id}`)}
                      className="flex items-center gap-3 rounded-xl border border-border-glass bg-bg-glass p-3 hover:border-white/12 transition-colors cursor-pointer"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white bg-accent-purple/20 text-accent-purple">
                        {item.trackerName?.[0]?.toUpperCase() || "T"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-foreground">{item.trackerName}</p>
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-accent-purple/20 text-accent-purple uppercase">
                            {item.type?.replace("_", " ")}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-foreground-secondary">{item.summary}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-foreground-muted">{formatRelativeTime(item.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column: Change Breakdown + Tracker Status + Top Trackers */}
            <div className="flex flex-col gap-4">
              {/* Change Breakdown */}
              {changeBreakdownData.length > 0 && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold text-foreground">Change Breakdown</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <PieChart width={90} height={90}>
                        <Pie data={changeBreakdownData} cx={40} cy={40} innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                          {changeBreakdownData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                      </PieChart>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[15px] font-bold text-foreground">{events.length}</span>
                        <span className="text-[9px] text-foreground-muted">Total</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 flex-1">
                      {changeBreakdownData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 text-foreground-secondary">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
                            {item.name}
                          </span>
                          <span className="text-foreground-muted">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tracker Status */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="mb-3 text-[14px] font-semibold text-foreground">Tracker Status</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <PieChart width={90} height={90}>
                      <Pie data={trackerStatusData} cx={40} cy={40} innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                        {trackerStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[15px] font-bold text-foreground">{totalTrackersCount}</span>
                      <span className="text-[9px] text-foreground-muted">Total</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    {trackerStatusData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-foreground-secondary">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
                          {item.name}
                        </span>
                        <span className="text-foreground-muted">{item.value} ({totalTrackersCount > 0 ? Math.round(item.value / totalTrackersCount * 100) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Trackers */}
              {topTrackers.some(t => t.changes > 0) && (
                <div className="glass-card rounded-2xl p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold text-foreground">Top Trackers</h3>
                    <Link href="/trackers" className="text-[11px] font-medium text-accent-primary hover:opacity-80">View all</Link>
                  </div>
                  <div className="space-y-2.5">
                    {topTrackers.map((t) => (
                      <div key={t.name} className="flex items-center justify-between">
                        <span className="truncate text-[12px] text-foreground-secondary max-w-[120px]">{t.name}</span>
                        <span className={`text-[12px] font-semibold ${t.changes > 0 ? "text-success" : "text-foreground-muted"}`}>
                          {t.changes} changes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Status */}
              <div className="glass-card rounded-2xl p-4">
                <h3 className="mb-2 text-[14px] font-semibold text-foreground">System Status</h3>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-[12px] text-success">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
