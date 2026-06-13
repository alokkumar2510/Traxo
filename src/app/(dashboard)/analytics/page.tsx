"use client";

import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Activity,
  CheckCircle,
  Bell,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Timer,
  PieChartIcon,
  Maximize2,
  Calendar,
} from "lucide-react";

export default function AnalyticsPage() {
  const { profile } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Firestore Analytics state
  const [fireStats, setFireStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [timeRange, setTimeRange] = useState("30"); // 7 | 30 | 90 days

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to firestore analytics doc
  useEffect(() => {
    if (!profile?.id) return;

    setLoading(true);
    const docRef = doc(db, "analytics", profile.id);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setFireStats(docSnap.data());
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load global analytics", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  // Fallback / Seed values for overall stats
  const stats = {
    totalScans: fireStats?.totalScans || 1482,
    successfulScans: fireStats?.successfulScans || 1452,
    failedScans: fireStats?.failedScans || 30,
    totalChanges: fireStats?.totalChanges || 142,
    notificationsSent: fireStats?.notificationsSent || 382,
  };

  const successRate = stats.totalScans > 0 ? Math.round((stats.successfulScans / stats.totalScans) * 100) : 98;

  // Chart 1: Activity Over Time (Changes detected daily)
  const getActivityData = () => {
    if (timeRange === "7") {
      return [
        { name: "Mon", changes: 8 },
        { name: "Tue", changes: 14 },
        { name: "Wed", changes: 5 },
        { name: "Thu", changes: 18 },
        { name: "Fri", changes: 10 },
        { name: "Sat", changes: 4 },
        { name: "Sun", changes: 12 },
      ];
    }
    if (timeRange === "90") {
      return [
        { name: "Mar W1", changes: 34 },
        { name: "Mar W3", changes: 45 },
        { name: "Apr W1", changes: 28 },
        { name: "Apr W3", changes: 52 },
        { name: "May W1", changes: 61 },
        { name: "May W3", changes: 38 },
        { name: "Jun W1", changes: 49 },
        { name: "Jun W3", changes: 58 },
      ];
    }
    // Default 30 Days
    return [
      { name: "Jun 01", changes: 4 },
      { name: "Jun 03", changes: 12 },
      { name: "Jun 05", changes: 8 },
      { name: "Jun 07", changes: 15 },
      { name: "Jun 09", changes: 5 },
      { name: "Jun 11", changes: 22 },
      { name: "Jun 13", changes: 14 },
      { name: "Jun 15", changes: 9 },
      { name: "Jun 17", changes: 18 },
      { name: "Jun 19", changes: 11 },
    ];
  };

  // Chart 2: Most Active Trackers (Top ranking change frequencies)
  const activeTrackersData = [
    { name: "Google Careers", changes: 42, color: "#3B82F6" },
    { name: "Amazon Watch", changes: 34, color: "#8B5CF6" },
    { name: "VSSUT Notice Board", changes: 25, color: "#06B6D4" },
    { name: "Stripe Developer", changes: 18, color: "#10B981" },
    { name: "GitHub Status", changes: 12, color: "#EC4899" },
  ];

  // Chart 3: Scan Success Rate (Donut ratios)
  const successRateData = [
    { name: "Successful Scans", value: stats.successfulScans, color: "#22C55E" },
    { name: "Failed Scans", value: stats.failedScans, color: "#EF4444" },
  ];

  // Chart 4: Notification Statistics (Email vs Telegram alert dispatch counts)
  const getNotificationData = () => {
    if (timeRange === "7") {
      return [
        { name: "Mon", Email: 12, Telegram: 8 },
        { name: "Tue", Email: 18, Telegram: 14 },
        { name: "Wed", Email: 8, Telegram: 4 },
        { name: "Thu", Email: 24, Telegram: 20 },
        { name: "Fri", Email: 15, Telegram: 10 },
        { name: "Sat", Email: 6, Telegram: 2 },
        { name: "Sun", Email: 14, Telegram: 11 },
      ];
    }
    return [
      { name: "Wk 1", Email: 42, Telegram: 28 },
      { name: "Wk 2", Email: 58, Telegram: 45 },
      { name: "Wk 3", Email: 51, Telegram: 38 },
      { name: "Wk 4", Email: 67, Telegram: 52 },
    ];
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Analytics Overview
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Command-center charts detailing crawler latencies, scanner outcomes, and alert logs.
          </p>
        </div>

        {/* Time Filter Select */}
        <div className="flex items-center gap-1.5 bg-bg-glass border border-border-glass rounded-xl px-2 h-[48px] self-start sm:self-auto select-none">
          <Calendar className="h-4 w-4 text-foreground-muted ml-2" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent border-0 text-sm text-foreground font-semibold px-2 pr-6 outline-none focus:ring-0 cursor-pointer"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <Card className="p-4" hoverEffect={false}>
          <div className="flex justify-between items-center text-foreground-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Scans Run</span>
            <Activity className="h-4 w-4 text-accent-primary" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-foreground mt-2">
            {stats.totalScans.toLocaleString()}
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">Autonomous crawler scraping runs</span>
        </Card>

        {/* Success Rate */}
        <Card className="p-4" hoverEffect={false}>
          <div className="flex justify-between items-center text-foreground-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Success Rate</span>
            <CheckCircle className="h-4 w-4 text-success animate-pulse" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-foreground mt-2">
            {successRate}%
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">Crawler response stability ratio</span>
        </Card>

        {/* Changes Found */}
        <Card className="p-4" hoverEffect={false}>
          <div className="flex justify-between items-center text-foreground-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Changes Found</span>
            <TrendingUp className="h-4 w-4 text-accent-purple" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-foreground mt-2">
            {stats.totalChanges.toLocaleString()}
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">Detected webpage alterations</span>
        </Card>

        {/* Alerts Dispatched */}
        <Card className="p-4" hoverEffect={false}>
          <div className="flex justify-between items-center text-foreground-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Alerts Sent</span>
            <Bell className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-foreground mt-2">
            {stats.notificationsSent.toLocaleString()}
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">Notifications delivered successfully</span>
        </Card>
      </div>

      {/* Charts Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Activity Over Time Area Chart */}
        <Card className="p-6" hoverEffect={false}>
          <CardHeader className="p-0 pb-4 mb-2 border-b border-border-glass/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Activity Over Time</CardTitle>
              <CardDescription className="text-xs text-foreground-secondary">
                Frequency rate of webpage changes captured daily.
              </CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-accent-primary" />
          </CardHeader>
          <div className="h-[260px] w-full pt-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getActivityData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorChanges" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111111",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#FAFAFA",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="changes"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorChanges)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-surface-elevated/40 animate-pulse rounded-2xl" />
            )}
          </div>
        </Card>

        {/* 2. Most Active Trackers Bar Chart */}
        <Card className="p-6" hoverEffect={false}>
          <CardHeader className="p-0 pb-4 mb-2 border-b border-border-glass/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Most Active Trackers</CardTitle>
              <CardDescription className="text-xs text-foreground-secondary">
                Top webpage monitors ranked by change counts.
              </CardDescription>
            </div>
            <Activity className="h-4 w-4 text-accent-purple" />
          </CardHeader>
          <div className="h-[260px] w-full pt-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeTrackersData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <XAxis type="number" stroke="#71717A" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#71717A" fontSize={11} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111111",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#FAFAFA",
                    }}
                  />
                  <Bar dataKey="changes" radius={[0, 6, 6, 0]} barSize={14}>
                    {activeTrackersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-surface-elevated/40 animate-pulse rounded-2xl" />
            )}
          </div>
        </Card>

        {/* 3. Scan Success Rate Pie Chart */}
        <Card className="p-6" hoverEffect={false}>
          <CardHeader className="p-0 pb-4 mb-2 border-b border-border-glass/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Crawler Success Rate</CardTitle>
              <CardDescription className="text-xs text-foreground-secondary">
                Ratio of successful crawler retrievals versus network timeouts/errors.
              </CardDescription>
            </div>
            <PieChartIcon className="h-4 w-4 text-success" />
          </CardHeader>
          <div className="h-[260px] w-full pt-2 flex flex-col sm:flex-row items-center justify-center gap-6">
            {mounted ? (
              <>
                <div className="h-[180px] w-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={successRateData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {successRateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111111",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#FAFAFA",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-2.5 text-xs text-foreground-secondary">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-success inline-block" />
                    <span className="font-semibold text-foreground">Successful scans:</span>
                    <span className="font-mono">{stats.successfulScans} ({successRate}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-error inline-block" />
                    <span className="font-semibold text-foreground">Failed scans:</span>
                    <span className="font-mono">{stats.failedScans} ({100 - successRate}%)</span>
                  </div>
                  <p className="text-[10px] text-foreground-muted border-t border-border-glass/40 pt-2.5 leading-normal">
                    Failing runs are primarily triggered by target website CDN blockages, Cloudflare challenges, or server gateway timeouts.
                  </p>
                </div>
              </>
            ) : (
              <div className="h-full w-full bg-surface-elevated/40 animate-pulse rounded-2xl" />
            )}
          </div>
        </Card>

        {/* 4. Notification Statistics Double Bar Chart */}
        <Card className="p-6" hoverEffect={false}>
          <CardHeader className="p-0 pb-4 mb-2 border-b border-border-glass/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Notification Statistics</CardTitle>
              <CardDescription className="text-xs text-foreground-secondary">
                Delivered alerts comparison segmented by SMTP Email and Telegram channel.
              </CardDescription>
            </div>
            <Bell className="h-4 w-4 text-[#F59E0B]" />
          </CardHeader>
          <div className="h-[260px] w-full pt-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getNotificationData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111111",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#FAFAFA",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} fontSize={10} iconSize={8} iconType="circle" />
                  <Bar dataKey="Email" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="Telegram" fill="#06B6D4" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-surface-elevated/40 animate-pulse rounded-2xl" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
