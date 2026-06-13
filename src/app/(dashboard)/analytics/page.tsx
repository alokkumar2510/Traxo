"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Zap,
  TrendingUp,
  Bell,
  CheckCircle,
  CalendarDays,
  ChevronDown,
  Download,
  Info,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { collection, query, where, orderBy, onSnapshot, limit, doc } from "firebase/firestore";
import { Tracker, TrackerEvent, UserAnalytics, ScanRecord } from "@/types/database";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

function SparklineCard({
  label, value, sub, subColor, icon, iconBg, sparkColor, sparkData,
}: {
  label: string; value: string; sub: string; subColor?: string; icon: React.ReactNode; iconBg: string; sparkColor: string; sparkData: any[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card flex flex-col gap-2 rounded-2xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: iconBg }}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] text-foreground-secondary">{label}</p>
          <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
          <p className="text-[10px]" style={{ color: subColor ?? "#A1A1AA" }}>{sub}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={36}>
        <LineChart data={sparkData}>
          <Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-glass bg-[#111] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey || p.name} style={{ color: p.color }}>
          {p.dataKey || p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const userId = user?.uid;

  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to user's trackers
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "trackers"), where("userId", "==", userId));
    const unsub = onSnapshot(q, (snap) => {
      setTrackers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Tracker));
      setLoading(false);
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
          const merged = [...filtered, ...trackerEvents];
          return merged.sort((a, b) => {
            const timeA = a.createdAt?.seconds ?? 0;
            const timeB = b.createdAt?.seconds ?? 0;
            return timeB - timeA;
          });
        });
      }, (error) => {
        console.error("Events listener failed:", error);
      });
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [trackers]);

  // Subscribe to recent scans of each tracker to calculate response times
  useEffect(() => {
    if (trackers.length === 0) {
      setScans([]);
      return;
    }

    const unsubs = trackers.map((tracker) => {
      const scansRef = collection(db, "trackers", tracker.id, "scans");
      const q = query(scansRef, orderBy("scannedAt", "desc"), limit(5));
      return onSnapshot(q, (snap) => {
        const trackerScans = snap.docs.map((d) => ({
          id: d.id,
          trackerId: tracker.id,
          ...d.data(),
        }));

        setScans((prev) => {
          const filtered = prev.filter((s) => s.trackerId !== tracker.id);
          return [...filtered, ...trackerScans];
        });
      }, (error) => {
        console.error("Scans listener failed:", error);
      });
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [trackers]);

  // Dynamic statistics calculations
  const totalTrackersCount = trackers.length;
  const totalChangesCount = trackers.reduce((sum, t) => sum + (t.changeCount || 0), 0);
  const totalScansCount = analytics?.totalScans ?? (scans.length || trackers.length * 5);
  const successRateString = useMemo(() => {
    if (analytics) {
      const total = analytics.successfulScans + analytics.failedScans;
      if (total > 0) {
        return `${Math.round((analytics.successfulScans / total) * 1000) / 10}%`;
      }
    }
    return "100%";
  }, [analytics]);

  // Sparkline data mapping
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }).reverse();
  }, []);

  const sparklineData = useMemo(() => {
    const data: Record<string, number> = {};
    last7Days.forEach(day => { data[day] = 0; });
    
    events.forEach(event => {
      const dateObj = parseDate(event.createdAt);
      if (!dateObj) return;
      const dateStr = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (data[dateStr] !== undefined) {
        data[dateStr] += 1;
      }
    });

    return Object.entries(data).map(([_, val]) => ({ v: val }));
  }, [events, last7Days]);

  // 1. Changes Detected Line Chart (Daily)
  const changesDailyData = useMemo(() => {
    const data: Record<string, number> = {};
    last7Days.forEach(day => { data[day] = 0; });
    
    events.forEach(event => {
      const dateObj = parseDate(event.createdAt);
      if (!dateObj) return;
      const dateStr = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (data[dateStr] !== undefined) {
        data[dateStr] += 1;
      }
    });

    return Object.entries(data).map(([day, val]) => ({ d: day, v: val }));
  }, [events, last7Days]);

  // 2. Events by Type Donut
  const eventsByTypeData = useMemo(() => {
    const counts = { jobs: 0, price: 0, content: 0, pdf: 0, other: 0 };
    events.forEach((e) => {
      if (e.type === "new_job") counts.jobs += 1;
      else if (e.type === "price_drop" || e.type === "price_increase") counts.price += 1;
      else if (e.type === "pdf_updated") counts.pdf += 1;
      else if (e.type === "content_changed" || e.type === "content_added" || e.type === "content_removed") counts.content += 1;
      else counts.other += 1;
    });

    return [
      { name: "Job Updates", value: counts.jobs, color: "#8B5CF6" },
      { name: "Price Changes", value: counts.price, color: "#3B82F6" },
      { name: "Content Changes", value: counts.content, color: "#22C55E" },
      { name: "PDF Updates", value: counts.pdf, color: "#F59E0B" },
      { name: "Other", value: counts.other, color: "#71717A" },
    ].filter(item => item.value > 0);
  }, [events]);

  // 3. Changes by Severity
  const severityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    events.forEach((e) => {
      if (e.severity === "high") counts.high += 1;
      else if (e.severity === "medium") counts.medium += 1;
      else counts.low += 1;
    });

    return [
      { name: "High", value: counts.high, color: "#EF4444" },
      { name: "Medium", value: counts.medium, color: "#F59E0B" },
      { name: "Low", value: counts.low, color: "#22C55E" },
    ].filter(item => item.value > 0);
  }, [events]);

  // 4. Changes Over Time by Type (Stacked Bar)
  const changesOverTimeData = useMemo(() => {
    const data: Record<string, any> = {};
    last7Days.forEach(day => {
      data[day] = { d: day, job: 0, price: 0, content: 0, pdf: 0, other: 0 };
    });

    events.forEach(e => {
      const dateObj = parseDate(e.createdAt);
      if (!dateObj) return;
      const dateStr = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (data[dateStr]) {
        if (e.type === "new_job") data[dateStr].job += 1;
        else if (e.type === "price_drop" || e.type === "price_increase") data[dateStr].price += 1;
        else if (e.type === "pdf_updated") data[dateStr].pdf += 1;
        else if (e.type === "content_changed" || e.type === "content_added" || e.type === "content_removed") data[dateStr].content += 1;
        else data[dateStr].other += 1;
      }
    });

    return Object.values(data);
  }, [events, last7Days]);

  // 5. Response Time over last few scans
  const responseTimeData = useMemo(() => {
    // Group scans by date-day to average them out
    const map: Record<string, { sum: number; count: number }> = {};
    last7Days.forEach(day => { map[day] = { sum: 0, count: 0 }; });

    scans.forEach(s => {
      const dateObj = parseDate(s.scannedAt);
      if (!dateObj) return;
      const dateStr = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (map[dateStr]) {
        const val = Number(s.responseTime);
        if (!isNaN(val) && val >= 0) {
          map[dateStr].sum += val;
          map[dateStr].count += 1;
        }
      }
    });

    return Object.entries(map).map(([day, val]) => ({
      d: day,
      v: val.count > 0 ? Math.round((val.sum / val.count) / 100) / 10 : 0, // convert ms to seconds
    }));
  }, [scans, last7Days]);

  const avgResponseTimeSec = useMemo(() => {
    const validScans = scans.filter(s => s.status === "success" && typeof s.responseTime === "number" && !isNaN(s.responseTime) && s.responseTime > 0);
    if (validScans.length === 0) return "0.0s";
    const sum = validScans.reduce((total, s) => total + s.responseTime, 0);
    return `${(sum / validScans.length / 1000).toFixed(1)}s`;
  }, [scans]);

  // Helper: tracker type color config — must be defined BEFORE topTrackers useMemo
  const getTrackerTypeColor = (type: string) => {
    switch (type) {
      case "job": return { text: "#22C55E", bg: "rgba(34,197,94,0.1)" };
      case "price": return { text: "#3B82F6", bg: "rgba(59,130,246,0.1)" };
      case "section": return { text: "#8B5CF6", bg: "rgba(139,92,246,0.1)" };
      case "pdf": return { text: "#F59E0B", bg: "rgba(245,158,11,0.1)" };
      default: return { text: "#06B6D4", bg: "rgba(6,182,212,0.1)" };
    }
  };

  // 6. Top Trackers
  const topTrackers = useMemo(() => {
    return [...trackers]
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, 5)
      .map(t => {
        const style = getTrackerTypeColor(t.type);
        return {
          name: t.name,
          type: t.type,
          typeColor: style.text,
          typeBg: style.bg,
          count: t.changeCount,
        };
      });
  }, [trackers]);

  // 7. Heatmap calculations
  const HEATMAP_ROWS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const HEATMAP_COLS = Array.from({ length: 24 }, (_, i) => i);
  
  const heatmapData = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    events.forEach(e => {
      const date = parseDate(e.createdAt);
      if (!date) return;
      const dayIdx = (date.getDay() + 6) % 7; // Map 0=Sun to 6=Sun, 1=Mon to 0=Mon
      const hour = date.getHours();
      grid[dayIdx][hour] += 1;
    });

    const maxVal = Math.max(...grid.map(row => Math.max(...row)), 1);
    return grid.map(row => row.map(val => val / maxVal));
  }, [events]);

  const peakHourString = useMemo(() => {
    const hourlyCounts = Array(24).fill(0);
    events.forEach(e => {
      const date = parseDate(e.createdAt);
      if (!date) return;
      const hour = date.getHours();
      hourlyCounts[hour] += 1;
    });
    const maxVal = Math.max(...hourlyCounts);
    if (maxVal === 0) return "N/A";
    const peakHour = hourlyCounts.indexOf(maxVal);
    const start = peakHour === 0 ? "12 AM" : peakHour > 12 ? `${peakHour - 12} PM` : peakHour === 12 ? "12 PM" : `${peakHour} AM`;
    const nextHour = (peakHour + 1) % 24;
    const end = nextHour === 0 ? "12 AM" : nextHour > 12 ? `${nextHour - 12} PM` : nextHour === 12 ? "12 PM" : `${nextHour} AM`;
    return `${start} - ${end}`;
  }, [events]);

  const peakDayString = useMemo(() => {
    const dailyCounts = Array(7).fill(0);
    events.forEach(e => {
      const date = parseDate(e.createdAt);
      if (!date) return;
      const dayIdx = (date.getDay() + 6) % 7;
      dailyCounts[dayIdx] += 1;
    });
    const maxVal = Math.max(...dailyCounts);
    if (maxVal === 0) return "N/A";
    const peakIdx = dailyCounts.indexOf(maxVal);
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return dayNames[peakIdx];
  }, [events]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-accent-primary animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Insights and performance overview of your monitoring activity.
          </p>
        </div>
      </div>

      {totalTrackersCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl p-8">
          <Activity className="h-12 w-12 text-foreground-muted mb-4" />
          <h3 className="text-lg font-bold text-foreground">No Analytics Compiled</h3>
          <p className="text-sm text-foreground-secondary max-w-sm mt-1">
            Data insights are calculated based on active tracker scans. Add a tracker and run scans to view analytics.
          </p>
        </div>
      ) : (
        <>
          {/* Sparkline Stat Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <SparklineCard label="Total Trackers" value={String(totalTrackersCount)} sub="Live scanners" sparkColor="#8B5CF6" sparkData={sparklineData} iconBg="linear-gradient(135deg,#7C3AED,#8B5CF6)" icon={<Activity className="h-4 w-4 text-white" />} />
            <SparklineCard label="Total Scans" value={String(totalScansCount)} sub="Completed sweeps" sparkColor="#06B6D4" sparkData={sparklineData} iconBg="linear-gradient(135deg,#0891B2,#06B6D4)" icon={<Zap className="h-4 w-4 text-white" />} />
            <SparklineCard label="Changes Detected" value={String(totalChangesCount)} sub="Triggered events" sparkColor="#22C55E" sparkData={sparklineData} iconBg="linear-gradient(135deg,#16A34A,#22C55E)" icon={<TrendingUp className="h-4 w-4 text-white" />} />
            <SparklineCard label="Alerts Sent" value={String(analytics?.notificationsSent ?? 0)} sub="Dispatched warnings" sparkColor="#F59E0B" sparkData={sparklineData} iconBg="linear-gradient(135deg,#D97706,#F59E0B)" icon={<Bell className="h-4 w-4 text-white" />} />
            <SparklineCard label="Success Rate" value={successRateString} sub="Overall sweep health" sparkColor="#06B6D4" sparkData={sparklineData} iconBg="linear-gradient(135deg,#0891B2,#22C55E)" icon={<CheckCircle className="h-4 w-4 text-white" />} />
          </div>

          {/* Row 2: Changes Chart + Events by Type + Changes by Severity */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Changes Detected Line Chart */}
            <div className="glass-card rounded-2xl p-5 lg:col-span-1 flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-[14px] font-semibold text-foreground">
                  Changes Detected
                  <Info className="h-3.5 w-3.5 text-foreground-muted" />
                </h3>
              </div>
              {events.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-foreground-muted">No changes detected yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={changesDailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="v" name="Changes" stroke="#8B5CF6" strokeWidth={2} fill="url(#analyticsGrad)" dot={{ fill: "#8B5CF6", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Events by Type Donut */}
            <div className="glass-card rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-foreground">Events by Type</h3>
              </div>
              {eventsByTypeData.length === 0 ? (
                <div className="h-[130px] flex items-center justify-center text-xs text-foreground-muted">No data available</div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <PieChart width={130} height={130}>
                      <Pie data={eventsByTypeData} cx={60} cy={60} innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={0}>
                        {eventsByTypeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[16px] font-bold text-foreground">{events.length}</span>
                      <span className="text-[10px] text-foreground-muted">Total</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {eventsByTypeData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-foreground-secondary">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                          {item.name}
                        </span>
                        <span className="text-foreground-muted">{item.value} ({events.length > 0 ? Math.round(item.value / events.length * 100) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Changes by Severity Donut */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="mb-4 text-[14px] font-semibold text-foreground">Changes by Severity</h3>
              {severityData.length === 0 ? (
                <div className="h-[130px] flex items-center justify-center text-xs text-foreground-muted">No data available</div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <PieChart width={130} height={130}>
                      <Pie data={severityData} cx={60} cy={60} innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={0}>
                        {severityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[16px] font-bold text-foreground">{events.length}</span>
                      <span className="text-[10px] text-foreground-muted">Total</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {severityData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-foreground-secondary">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                          {item.name}
                        </span>
                        <span className="text-foreground-muted">{item.value} ({events.length > 0 ? Math.round(item.value / events.length * 100) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Top Trackers + Changes Over Time + Right Column */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Top Trackers */}
            <div className="glass-card rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-foreground">Top Trackers by Updates</h3>
              </div>
              <div className="space-y-3">
                {topTrackers.length === 0 || !topTrackers.some(t => t.count > 0) ? (
                  <p className="text-xs text-foreground-muted py-8 text-center">No tracker changes tracked yet.</p>
                ) : (
                  topTrackers.map((t) => (
                    <div key={t.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-[10px] font-bold text-foreground">
                          {t.name?.[0]?.toUpperCase() || "T"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-foreground">{t.name}</p>
                          <span className="rounded px-1.5 py-0.5 text-[10px] capitalize" style={{ color: t.typeColor, background: t.typeBg }}>{t.type}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[13px] font-bold text-foreground">{t.count} changes</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Changes Over Time Stacked Bar */}
            <div className="glass-card rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-foreground">Changes Over Time by Type</h3>
              </div>
              {events.length === 0 ? (
                <div className="h-[160px] flex items-center justify-center text-xs text-foreground-muted">No data available</div>
              ) : (
                <>
                  <div className="mb-2 flex flex-wrap gap-3 text-[10px]">
                    {[
                      { name: "Job", color: "#8B5CF6" },
                      { name: "Price", color: "#3B82F6" },
                      { name: "Content", color: "#22C55E" },
                      { name: "PDF", color: "#F59E0B" },
                      { name: "Other", color: "#71717A" },
                    ].map(l => (
                      <span key={l.name} className="flex items-center gap-1 text-foreground-secondary">
                        <span className="h-2 w-2 rounded-sm" style={{ background: l.color }} />
                        {l.name}
                      </span>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={changesOverTimeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="job" name="Job" stackId="a" fill="#8B5CF6" />
                      <Bar dataKey="price" name="Price" stackId="a" fill="#3B82F6" />
                      <Bar dataKey="content" name="Content" stackId="a" fill="#22C55E" />
                      <Bar dataKey="pdf" name="PDF" stackId="a" fill="#F59E0B" />
                      <Bar dataKey="other" name="Other" stackId="a" fill="#71717A" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            {/* Right Column: Response Time + Heatmap */}
            <div className="flex flex-col gap-4">
              {/* Average Response Time */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="mb-1 flex items-center gap-1.5 text-[14px] font-semibold text-foreground">
                  Average Response Time
                  <Info className="h-3.5 w-3.5 text-foreground-muted" />
                </h3>
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{avgResponseTimeSec}</span>
                </div>
                {scans.length === 0 ? (
                  <div className="h-[60px] flex items-center justify-center text-xs text-foreground-muted">No crawl latency data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={60}>
                    <LineChart data={responseTimeData}>
                      <Line type="monotone" name="Avg Latency (s)" dataKey="v" stroke="#06B6D4" strokeWidth={2} dot={{ fill: "#06B6D4", r: 2 }} />
                      <XAxis dataKey="d" hide />
                      <YAxis hide />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Most Active Time Heatmap */}
              <div className="glass-card flex-1 rounded-2xl p-5">
                <h3 className="mb-1 flex items-center gap-1.5 text-[14px] font-semibold text-foreground">
                  Most Active Time
                  <Info className="h-3.5 w-3.5 text-foreground-muted" />
                </h3>
                <p className="mb-1 text-xl font-bold text-foreground">{peakHourString}</p>
                <p className="mb-3 text-[12px] text-foreground-secondary">{peakDayString}</p>
                
                {/* Heatmap grid */}
                <div className="space-y-0.5">
                  {HEATMAP_ROWS.map((day, di) => (
                    <div key={day} className="flex items-center gap-0.5">
                      <span className="w-6 shrink-0 text-[9px] text-foreground-muted">{day}</span>
                      {HEATMAP_COLS.map((h) => {
                        const intensity = heatmapData[di][h];
                        return (
                          <div
                            key={h}
                            className="h-3 flex-1 rounded-[2px]"
                            style={{
                              background: intensity > 0.01
                                ? `rgba(139,92,246,${0.1 + intensity * 0.9})`
                                : "rgba(255,255,255,0.04)",
                            }}
                            title={`${day} ${h}:00 — ${Math.round(intensity * 100)}% active`}
                          />
                        );
                      })}
                    </div>
                  ))}
                  <div className="flex items-center gap-0.5 mt-1">
                    <span className="w-6" />
                    {[0, 6, 12, 18, 23].map(h => (
                      <span key={h} className="text-[9px] text-foreground-muted" style={{ flex: h === 23 ? 1 : 6, textAlign: "left" }}>
                        {h === 0 ? "12 AM" : h === 6 ? "6 AM" : h === 12 ? "12 PM" : h === 18 ? "6 PM" : "12 AM"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
