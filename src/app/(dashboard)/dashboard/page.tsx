"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FolderPlus,
  History,
  Settings,
  Plus,
  ArrowRight,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Bell,
  Search,
  Heart,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DocumentData,
} from "firebase/firestore";
import { Tracker, Collection, NotificationLog, TrackerEvent } from "@/types/database";

// Reusable CountUp component for premium analytics feel
function CountUp({ end, duration = 1.0 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const endValue = Math.max(0, end);
    if (start === endValue) {
      setCount(endValue);
      return;
    }

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / (endValue || 1)), 25);

    const timer = setInterval(() => {
      start += Math.ceil((endValue - start) / 5) || 1;
      if (start >= endValue) {
        clearInterval(timer);
        setCount(endValue);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <>{count.toLocaleString()}</>;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const userId = user?.uid;
  const greeting = getGreeting();

  // Firestore state variables
  const [stats, setStats] = useState({
    activeTrackers: 0,
    totalScans: 0,
    changesDetected: 0,
    notificationsSent: 0,
    successfulScans: 0,
    failedScans: 0,
  });

  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Set up real-time listener bindings
  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    // 1. Listen to user analytics metrics
    const statsUnsub = onSnapshot(doc(db, "analytics", userId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setStats({
          activeTrackers: d.activeTrackers ?? 0,
          totalScans: d.totalScans ?? 0,
          changesDetected: d.totalChanges ?? d.changesDetected ?? 0,
          notificationsSent: d.notificationsSent ?? 0,
          successfulScans: d.successfulScans ?? 0,
          failedScans: d.failedScans ?? 0,
        });
      }
    });

    // 2. Listen to trackers list
    const trackersQuery = query(collection(db, "trackers"), where("userId", "==", userId));
    const trackersUnsub = onSnapshot(trackersQuery, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tracker);
      setTrackers(items);
      setLoading(false);

      // If analytics isn't populated yet, compute fallback stats from retrieved trackers
      if (items.length > 0) {
        setStats((prev) => ({
          ...prev,
          activeTrackers: items.filter((i) => i.status === "active").length,
          changesDetected: items.reduce((acc, curr) => acc + (curr.changeCount ?? 0), 0),
        }));
      }
    });

    // 3. Listen to collections
    const collectionsQuery = query(
      collection(db, "users", userId, "collections"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const collectionsUnsub = onSnapshot(collectionsQuery, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Collection);
      setCollections(items);
    });

    // 4. Listen to notifications as recent activity stream
    const notificationsQuery = query(
      collection(db, "users", userId, "notifications"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const notificationsUnsub = onSnapshot(notificationsQuery, async (snap) => {
      const notifs = snap.docs.map((d) => d.data() as NotificationLog);
      
      // Map notifications into a readable activity structure
      const formattedActivities = notifs.map((n, idx) => {
        const timeVal = n.createdAt?.toDate?.() ?? new Date();
        const secondsAgo = Math.floor((new Date().getTime() - timeVal.getTime()) / 1000);
        let timeStr = "Just now";
        if (secondsAgo >= 86400) timeStr = `${Math.floor(secondsAgo / 86400)}d ago`;
        else if (secondsAgo >= 3600) timeStr = `${Math.floor(secondsAgo / 3600)}h ago`;
        else if (secondsAgo >= 60) timeStr = `${Math.floor(secondsAgo / 60)}m ago`;

        return {
          id: n.id,
          source: n.channel === "telegram" ? "Telegram Alert" : "Email Notification",
          type: n.status === "sent" ? "ALERT SENT" : "ALERT PENDING",
          description: `Notification dispatched for event ${n.eventId.substring(0, 8)}...`,
          time: timeStr,
          category: "website",
          severity: n.status === "failed" ? "high" : "medium",
        };
      });

      setRecentActivities(formattedActivities);
    });

    return () => {
      statsUnsub();
      trackersUnsub();
      collectionsUnsub();
      notificationsUnsub();
    };
  }, [userId]);

  // Compute tracker health score percentage
  const trackerHealthPercentage = useMemo(() => {
    if (trackers.length === 0) return 100;
    const errorCount = trackers.filter((t) => t.status === "error").length;
    return Math.round(((trackers.length - errorCount) / trackers.length) * 100);
  }, [trackers]);

  // Animations configuration
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 14 } },
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-accent-primary animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Syncing metrics vault...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Welcome Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {greeting}, {profile?.displayName?.split(" ")[0] || "Explorer"}
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Your edge nodes are operational. Here is your dashboard summary.
          </p>
        </div>

        {/* Health / Active Widget */}
        <div className="flex items-center gap-6 rounded-2xl border border-border-glass bg-bg-glass p-4 self-start md:self-auto shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 border border-success/30 text-success">
              <Heart className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono tracking-tight text-foreground leading-none">
                {trackerHealthPercentage}%
              </p>
              <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-secondary mt-0.5">
                Engine Health
              </p>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-border-glass" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/15 border border-accent-primary/30 text-accent-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono tracking-tight text-foreground leading-none">
                <CountUp end={stats.activeTrackers} />
              </p>
              <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-secondary mt-0.5">
                Active Scans
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {/* Total Trackers */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardDescription className="text-xs font-medium uppercase font-mono tracking-wider">
                Total Watchers
              </CardDescription>
              <Activity className="h-4 w-4 text-accent-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight">
                <CountUp end={trackers.length} />
              </div>
              <p className="text-[10px] text-foreground-secondary mt-1 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success pulse-success inline-block" />
                <span>Operational</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Scans */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardDescription className="text-xs font-medium uppercase font-mono tracking-wider">
                Total Scans
              </CardDescription>
              <Layers className="h-4 w-4 text-accent-cyan" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight">
                <CountUp end={stats.totalScans} />
              </div>
              <p className="text-[10px] text-foreground-secondary mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-success" />
                <span>{stats.successfulScans} successful</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Changes Detected */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardDescription className="text-xs font-medium uppercase font-mono tracking-wider">
                Changes Found
              </CardDescription>
              <Sparkles className="h-4 w-4 text-accent-purple" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight">
                <CountUp end={stats.changesDetected} />
              </div>
              <p className="text-[10px] text-foreground-secondary mt-1 flex items-center gap-1">
                <span className="font-semibold text-accent-primary">
                  {trackers.length ? Math.round((stats.changesDetected / trackers.length) * 10) / 10 : 0}
                </span>
                <span>avg per tracker</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts Dispatched */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardDescription className="text-xs font-medium uppercase font-mono tracking-wider">
                Alerts Dispatched
              </CardDescription>
              <Bell className="h-4 w-4 text-[#F59E0B]" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight">
                <CountUp end={stats.notificationsSent} />
              </div>
              <p className="text-[10px] text-foreground-secondary mt-1 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-success" />
                <span>Active delivery pipeline</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Empty State vs Full View */}
      {trackers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border-glass rounded-3xl bg-bg-glass backdrop-blur-md">
          <Layers className="mx-auto h-12 w-12 text-foreground-muted mb-4" />
          <h3 className="text-lg font-bold text-foreground">Welcome to your watchtower</h3>
          <p className="text-sm text-foreground-secondary mt-1 max-w-sm mx-auto mb-6">
            You haven&apos;t created any trackers yet. Add your first tracker to begin monitoring websites.
          </p>
          <Button
            onClick={() => router.push("/trackers?create=true")}
            className="gradient-bg-primary hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] text-white px-6 h-12 text-sm"
          >
            Create Your First Tracker
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left/Center Column (2/3 width) - Recent Activity Feed */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">Activity Stream</h3>
                <p className="text-xs text-foreground-secondary">
                  Live updates pushed from queue events.
                </p>
              </div>
              <Link
                href="/history"
                className="text-xs font-semibold text-accent-primary hover:text-accent-primary/80 transition-colors flex items-center gap-1"
              >
                <span>View full timeline</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3"
            >
              {recentActivities.length === 0 ? (
                <div className="py-8 text-center text-xs text-foreground-muted">
                  Waiting for live changes... Scan a tracker manually to trigger alerts.
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    variants={itemVariants}
                    className="group relative rounded-xl border border-border-glass bg-bg-glass backdrop-blur-md p-4 transition-all duration-300 hover:translate-y-[-2px] hover:border-white/12 hover:bg-surface-elevated/20 flex gap-4 items-start"
                  >
                    <div
                      className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-r-md ${
                        activity.severity === "high" ? "bg-error shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-accent-primary"
                      }`}
                    />

                    <div className="flex-1 space-y-1 pl-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground transition-colors group-hover:text-accent-primary">
                          {activity.source}
                        </span>
                        <span className="text-[10px] font-mono text-foreground-secondary">
                          {activity.time}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="rounded border px-1.5 py-0.5 text-[8px] font-mono font-bold tracking-wider bg-accent-primary/10 border-accent-primary/20 text-accent-primary">
                          {activity.type}
                        </span>
                        <p className="text-xs text-foreground-secondary truncate max-w-[280px] md:max-w-md">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>

          {/* Right Column (1/3 width) - Quick Actions & Collections */}
          <div className="flex flex-col gap-8">
            {/* Quick Actions */}
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">Quick Actions</h3>
                <p className="text-xs text-foreground-secondary">Common management shortcuts.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Create Tracker */}
                <button
                  id="qa-create-tracker-btn"
                  onClick={() => router.push("/trackers?create=true")}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border-glass bg-bg-glass p-4 text-center transition-all hover:translate-y-[-2px] hover:bg-surface-elevated/30 hover:border-accent-primary/30 cursor-pointer group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary group-hover:bg-accent-primary/20 transition-colors">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Create Tracker</span>
                </button>

                {/* Collections */}
                <button
                  onClick={() => router.push("/collections")}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border-glass bg-bg-glass p-4 text-center transition-all hover:translate-y-[-2px] hover:bg-surface-elevated/30 hover:border-accent-purple/30 cursor-pointer group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple group-hover:bg-accent-purple/20 transition-colors">
                    <FolderPlus className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Collections</span>
                </button>

                {/* History */}
                <button
                  onClick={() => router.push("/history")}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border-glass bg-bg-glass p-4 text-center transition-all hover:translate-y-[-2px] hover:bg-surface-elevated/30 hover:border-accent-cyan/30 cursor-pointer group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan group-hover:bg-accent-cyan/20 transition-colors">
                    <History className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Change Logs</span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => router.push("/settings")}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border-glass bg-bg-glass p-4 text-center transition-all hover:translate-y-[-2px] hover:bg-surface-elevated/30 hover:border-white/20 cursor-pointer group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated border border-border-glass text-foreground-secondary group-hover:border-white/20 transition-colors">
                    <Settings className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Settings</span>
                </button>
              </div>
            </div>

            {/* Collections Overview */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">Collections</h3>
                  <p className="text-xs text-foreground-secondary">Folder groups overview.</p>
                </div>
                <Link
                  href="/collections"
                  className="text-xs font-semibold text-accent-primary hover:text-accent-primary/80 transition-colors"
                >
                  View all
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {collections.length === 0 ? (
                  <div className="py-6 text-center text-xs text-foreground-muted border border-dashed border-border-glass rounded-2xl">
                    No folders created.
                  </div>
                ) : (
                  collections.map((col) => (
                    <div
                      key={col.id}
                      onClick={() => router.push(`/collections?id=${col.id}`)}
                      className="group rounded-2xl border border-border-glass bg-bg-glass p-4 transition-all hover:translate-y-[-2px] hover:bg-surface-elevated/20 hover:border-white/12 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple">
                          <Layers className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground transition-colors group-hover:text-accent-primary">
                            {col.name}
                          </h4>
                          <p className="text-[10px] text-foreground-secondary">
                            {col.trackerCount} trackers
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-foreground-muted group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
