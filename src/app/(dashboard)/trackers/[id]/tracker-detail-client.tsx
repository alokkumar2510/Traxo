"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { TrackerRepository, trackerConverter } from "@/services/firestore/trackers";
import { Tracker, TrackerEvent, ScanRecord, TrackerStatus } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EditTrackerModal from "@/components/trackers/edit-tracker-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  ArrowLeft,
  Activity,
  Play,
  Pause,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  ExternalLink,
  Globe,
  Layout,
  DollarSign,
  Briefcase,
  FileText,
  Calendar,
  CheckCircle2,
  TrendingDown,
  Timer,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

export default function TrackerDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthStore();
  
  // Extract real tracker ID from URL path to bypass static export placeholder 'view'
  let trackerId = params.id as string;
  if (typeof window !== "undefined") {
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    if (pathParts[0] === "trackers" && pathParts[1] && pathParts[1] !== "view") {
      trackerId = pathParts[1];
    }
  }

  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [events, setEvents] = useState<TrackerEvent[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Modals States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set up listeners for the tracker and its subcollections
  useEffect(() => {
    if (!profile?.id || !trackerId) return;

    setLoading(true);

    // 1. Tracker Listener
    const trackerRef = doc(db, "trackers", trackerId).withConverter(trackerConverter);
    const unsubscribeTracker = onSnapshot(
      trackerRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setTracker(docSnap.data());
          setError(null);
        } else {
          setTracker(null);
          setError("Tracker not found.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Tracker details listener error", err);
        setError("Failed to fetch tracker details.");
        setLoading(false);
      }
    );

    // 2. Events Listener (Recent 15)
    const eventsQuery = query(
      collection(db, "trackers", trackerId, "events"),
      orderBy("createdAt", "desc"),
      limit(15)
    );
    const unsubscribeEvents = onSnapshot(
      eventsQuery,
      (snap) => {
        const list: TrackerEvent[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({ id: docSnap.id, ...data } as TrackerEvent);
        });
        setEvents(list);
      },
      (err) => {
        console.error("Tracker events listener error", err);
      }
    );

    // 3. Scans Listener (Recent 10)
    const scansQuery = query(
      collection(db, "trackers", trackerId, "scans"),
      orderBy("scannedAt", "desc"),
      limit(10)
    );
    const unsubscribeScans = onSnapshot(
      scansQuery,
      (snap) => {
        const list: ScanRecord[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({ id: docSnap.id, ...data } as ScanRecord);
        });
        setScans(list);
      },
      (err) => {
        console.error("Tracker scans listener error", err);
      }
    );

    return () => {
      unsubscribeTracker();
      unsubscribeEvents();
      unsubscribeScans();
    };
  }, [profile, trackerId]);

  // Toggle status
  const handleToggleStatus = async () => {
    if (!tracker) return;
    const newStatus: TrackerStatus = tracker.status === "active" ? "paused" : "active";
    try {
      await TrackerRepository.updateTracker(tracker.id, { status: newStatus });
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  // Delete Tracker
  const confirmDelete = async () => {
    if (!tracker) return;
    setDeleting(true);
    try {
      await TrackerRepository.deleteTracker(tracker.id);
      setIsDeleteOpen(false);
      router.push("/trackers");
    } catch (err) {
      console.error("Failed to delete tracker", err);
    } finally {
      setDeleting(false);
    }
  };

  const getChartData = () => {
    return [...scans]
      .reverse()
      .map((s, index) => {
        let name = `Scan ${index + 1}`;
        if (s.scannedAt) {
          const date = (s.scannedAt as any).toDate ? (s.scannedAt as any).toDate() : new Date(s.scannedAt as any);
          name = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        return {
          name,
          responseTime: s.responseTime || 0,
          status: s.status,
        };
      });
  };

  const displayConfigDetails = () => {
    if (!tracker) return null;

    switch (tracker.type) {
      case "section":
        return (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">CSS/XPath Selector</p>
              <p className="text-sm font-semibold font-mono text-accent-primary bg-surface/50 border border-border-glass p-3.5 rounded-xl mt-1.5 break-all select-all">
                {tracker.sectionConfig?.selector}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Selector Type</p>
                <p className="text-sm font-bold text-foreground mt-1 capitalize">{tracker.sectionConfig?.selectorType}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Element Target</p>
                <p className="text-sm font-bold text-foreground mt-1">{tracker.sectionConfig?.monitoredElement || "Webpage Section"}</p>
              </div>
            </div>
          </div>
        );
      case "price":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Target Alert Price</p>
                <p className="text-sm font-extrabold text-[#F59E0B] mt-1">
                  {tracker.priceConfig?.currency === "USD" ? "$" : "₹"}
                  {tracker.priceConfig?.targetPrice?.toLocaleString() || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Currency Code</p>
                <p className="text-sm font-bold text-foreground mt-1 uppercase">{tracker.priceConfig?.currency || "INR"}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-border-glass/40 pt-4">
              <div className="text-center">
                <p className="text-[9px] uppercase font-mono tracking-wide text-foreground-muted">Current</p>
                <p className="text-xs font-bold text-foreground mt-1">
                  {tracker.priceConfig?.currency === "USD" ? "$" : "₹"}
                  {tracker.priceConfig?.currentPrice?.toLocaleString() || "Crawling..."}
                </p>
              </div>
              <div className="text-center border-x border-border-glass/40 px-2">
                <p className="text-[9px] uppercase font-mono tracking-wide text-foreground-muted">Lowest</p>
                <p className="text-xs font-bold text-success mt-1">
                  {tracker.priceConfig?.currency === "USD" ? "$" : "₹"}
                  {tracker.priceConfig?.lowestPrice?.toLocaleString() || "Crawling..."}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase font-mono tracking-wide text-foreground-muted">Highest</p>
                <p className="text-xs font-bold text-error mt-1">
                  {tracker.priceConfig?.currency === "USD" ? "$" : "₹"}
                  {tracker.priceConfig?.highestPrice?.toLocaleString() || "Crawling..."}
                </p>
              </div>
            </div>
          </div>
        );
      case "job":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Target Role</p>
                <p className="text-sm font-bold text-foreground mt-1">{tracker.jobConfig?.role || "Any Openings"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Location</p>
                <p className="text-sm font-bold text-foreground mt-1">{tracker.jobConfig?.location || "Not Restricted"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border-glass/40 pt-4">
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Remote Allowed</p>
                <p className="text-xs font-bold text-accent-cyan mt-1">
                  {tracker.jobConfig?.remoteOnly ? "Yes (Only Remote)" : "Remote & Onsite"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Keywords Tracked</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {tracker.jobConfig?.keywords && tracker.jobConfig.keywords.length > 0 ? (
                    tracker.jobConfig.keywords.map((kw, idx) => (
                      <span key={idx} className="bg-bg-glass border border-border-glass rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold text-accent-cyan">
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-foreground-muted">No keywords</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case "pdf":
        return (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Monitored File Name</p>
              <p className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-accent-purple" />
                <span>{tracker.pdfConfig?.fileName || "document.pdf"}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border-glass/40 pt-4">
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Latest Hash</p>
                <p className="text-[10px] font-mono text-foreground-secondary truncate mt-1 bg-surface/50 border border-border-glass p-1.5 rounded-lg">
                  {tracker.pdfConfig?.lastHash || "Waiting for initial run"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-foreground-muted">Last Modified</p>
                <p className="text-xs font-semibold text-foreground mt-1">
                  {tracker.pdfConfig?.lastModified ? tracker.pdfConfig.lastModified.toDate().toLocaleString() : "Waiting for initial run"}
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Full HTML page comparison monitoring. The system scrapes the entire DOM tree, strips script headers/styles, and runs semantic hashes to find content alterations.
            </p>
          </div>
        );
    }
  };

  const getEventBadgeStyles = (type: string) => {
    switch (type) {
      case "price_drop":
        return "bg-success/15 border-success/30 text-success";
      case "new_job":
        return "bg-accent-cyan/15 border-accent-cyan/30 text-accent-cyan";
      case "pdf_updated":
        return "bg-accent-purple/15 border-accent-purple/30 text-accent-purple";
      default:
        return "bg-accent-primary/15 border-accent-primary/30 text-accent-primary";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-24 bg-surface-elevated rounded-lg" />
        <div className="h-16 w-1/3 bg-surface-elevated rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[300px] bg-surface-elevated rounded-3xl" />
          <div className="h-[300px] bg-surface-elevated rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !tracker) {
    return (
      <div className="rounded-3xl border border-border-glass bg-bg-glass p-12 text-center max-w-lg mx-auto mt-12 relative overflow-hidden">
        <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[240px] h-[120px] bg-error/10 rounded-full blur-[40px]" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10 border border-error/20 text-error mb-6">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {error || "Tracker not found"}
        </h3>
        <p className="mt-2 text-sm text-foreground-secondary max-w-sm mx-auto">
          The requested website change monitor could not be located or has been deleted.
        </p>
        <Link href="/trackers" className="mt-6 inline-block">
          <Button variant="secondary" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Monitors</span>
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate Success Rate %
  const totalScansList = scans;
  const successfulScans = totalScansList.filter((s) => s.status === "success").length;
  const successRate = totalScansList.length > 0 ? Math.round((successfulScans / totalScansList.length) * 100) : 100;
  const avgResponse = totalScansList.length > 0 ? Math.round(totalScansList.reduce((acc, s) => acc + (s.responseTime || 0), 0) / totalScansList.length) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      <Link href="/trackers" className="self-start">
        <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary hover:text-foreground transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Monitors</span>
        </div>
      </Link>

      {/* Tracker Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-bg-glass border border-border-glass rounded-3xl p-6 relative overflow-hidden">
        {/* Neon Backdrop Glow */}
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none" />

        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-glass bg-surface-elevated/40 px-2.5 py-0.5 text-xs font-semibold text-foreground-secondary capitalize">
              {tracker.type}
            </span>
            {tracker.status === "active" && (
              <span className="flex items-center gap-1.5 rounded-lg bg-success/15 border border-success/30 px-2 py-0.5 text-[10px] font-bold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success pulse-success" />
                Monitoring Active
              </span>
            )}
            {tracker.status === "paused" && (
              <span className="flex items-center gap-1.5 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 px-2 py-0.5 text-[10px] font-bold text-[#F59E0B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                Scans Paused
              </span>
            )}
            {tracker.status === "error" && (
              <span className="flex items-center gap-1.5 rounded-lg bg-error/15 border border-error/30 px-2 py-0.5 text-[10px] font-bold text-error">
                <span className="h-1.5 w-1.5 rounded-full bg-error pulse-error" />
                Error State
              </span>
            )}
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {tracker.name}
          </h2>

          <div className="flex items-center gap-1.5 text-sm font-medium text-accent-primary hover:underline break-all">
            <Globe className="h-4 w-4 shrink-0 text-foreground-secondary" />
            <a href={tracker.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              <span>{tracker.url}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {tracker.description && (
            <p className="text-xs text-foreground-secondary leading-relaxed pt-1">
              {tracker.description}
            </p>
          )}
        </div>

        {/* Dashboard Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto border-t md:border-t-0 border-border-glass/40 pt-4 md:pt-0 w-full md:w-auto">
          <Button
            onClick={handleToggleStatus}
            variant="secondary"
            className="flex-1 md:flex-initial flex items-center gap-2"
          >
            {tracker.status === "active" ? (
              <>
                <Pause className="h-4.5 w-4.5 text-[#F59E0B]" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4.5 w-4.5 text-success" />
                <span>Resume</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => setIsEditOpen(true)}
            variant="secondary"
            className="flex-1 md:flex-initial flex items-center gap-2"
          >
            <Edit2 className="h-4.5 w-4.5 text-foreground-secondary" />
            <span>Edit</span>
          </Button>

          <Button
            onClick={() => setIsDeleteOpen(true)}
            variant="secondary"
            className="flex-1 md:flex-initial flex items-center gap-2 border-error/20 bg-error/5 hover:bg-error/10 hover:border-error/35 text-error"
          >
            <Trash2 className="h-4.5 w-4.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <Card className="p-4" hoverEffect={false}>
          <div className="flex justify-between items-center text-foreground-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total Runs</span>
            <Activity className="h-4 w-4 text-accent-primary" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground mt-2">
            {tracker.changeCount + totalScansList.length}
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">Full scrape history</span>
        </Card>

        {/* Success Rate */}
        <Card className="p-4" hoverEffect={false}>
          <div className="flex justify-between items-center text-foreground-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Success Rate</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground mt-2">
            {successRate}%
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">Last 10 crawls</span>
        </Card>

        {/* Response Time */}
        <Card className="p-4" hoverEffect={false}>
          <div className="flex justify-between items-center text-foreground-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Avg Latency</span>
            <Timer className="h-4 w-4 text-accent-cyan" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground mt-2">
            {avgResponse} ms
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">Worker response speed</span>
        </Card>

        {/* Changes Detected */}
        <Card className="p-4" hoverEffect={false}>
          <div className="flex justify-between items-center text-foreground-muted">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Updates Logs</span>
            <TrendingDown className="h-4 w-4 text-accent-purple" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground mt-2">
            {tracker.changeCount}
          </p>
          <span className="text-[10px] text-foreground-secondary mt-1 block">Events registered</span>
        </Card>
      </div>

      {/* Config Details & Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Target crawler Configs */}
        <Card className="lg:col-span-1 p-6" hoverEffect={false}>
          <div className="border-b border-border-glass/40 pb-3 mb-4 flex items-center justify-between">
            <h3 className="font-bold text-foreground">Scraper Configuration</h3>
            <Clock className="h-4 w-4 text-foreground-muted" />
          </div>
          {displayConfigDetails()}
          
          <div className="mt-6 pt-4 border-t border-border-glass/40 flex items-center justify-between text-xs text-foreground-muted">
            <span>Interval Rate:</span>
            <span className="font-mono font-bold text-foreground-secondary capitalize">{tracker.frequency} scans</span>
          </div>
        </Card>

        {/* Response Time Area Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between" hoverEffect={false}>
          <div className="border-b border-border-glass/40 pb-3 mb-4 flex items-center justify-between">
            <h3 className="font-bold text-foreground">Crawler Latency History</h3>
            <span className="text-xs font-mono bg-accent-cyan/10 border border-accent-cyan/20 px-2 py-0.5 rounded text-accent-cyan">
              ms (milliseconds)
            </span>
          </div>

          {/* Area Chart Container */}
          <div className="h-[180px] w-full mt-2">
            {mounted && scans.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getChartData()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                     <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                       <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                     </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#71717A" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={10} tickLine={false} />
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
                    dataKey="responseTime"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLatency)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : mounted && scans.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-foreground-muted border border-dashed border-border-glass rounded-xl">
                No latency history recorded yet
              </div>
            ) : (
              <div className="h-full w-full bg-surface-elevated/40 animate-pulse rounded-xl" />
            )}
          </div>
        </Card>
      </div>

      {/* Events Timeline & Scans Log split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Log (Left 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Updates Timeline</h3>
            <p className="text-xs text-foreground-secondary">
              Chronological log of meaningful updates detected by crawlers.
            </p>
          </div>

          <div className="relative border-l border-border-glass/50 pl-5 ml-2.5 space-y-6 py-2">
            {events.length === 0 ? (
              <div className="text-left py-6 text-xs text-foreground-muted">
                No changes detected yet
              </div>
            ) : (
              events.map((event, idx) => (
                <div key={event.id} className="relative group">
                  {/* Timeline connector circle node */}
                  <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-accent-primary flex items-center justify-center shadow-[0_0_8px_rgba(59,130,246,0.8)] group-hover:scale-110 transition-transform">
                    <div className="h-1 w-1 bg-white rounded-full" />
                  </div>

                  <div className="bg-bg-glass border border-border-glass rounded-2xl p-4 transition-all duration-300 hover:border-white/12 hover:bg-surface-elevated/10">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-sm font-bold text-foreground">{event.title}</h4>
                      <span className="text-[10px] text-foreground-muted font-mono flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {event.createdAt ? ((event.createdAt as any).toDate ? (event.createdAt as any).toDate().toLocaleString() : new Date(event.createdAt as any).toLocaleString()) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
                      {event.summary}
                    </p>
                    
                    {/* Visual Screenshot & Link to Change */}
                    {(event.metadata as any)?.visualDiff?.diffImageUrl ? (
                      <div className="mt-3.5 space-y-2">
                        <div className="rounded-xl overflow-hidden border border-border-glass bg-surface/50 max-w-xl">
                          <a href={tracker.url} target="_blank" rel="noopener noreferrer" className="block relative group/image">
                            <img
                              src={(event.metadata as any).visualDiff.diffImageUrl}
                              alt="Screenshot of Change"
                              className="w-full h-auto object-cover max-h-[220px] transition-transform duration-300 group-hover/image:scale-[1.01]"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              <ExternalLink className="h-4 w-4 text-white" />
                              <span className="text-xs font-semibold text-white">Visit Monitored Site</span>
                            </div>
                          </a>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-foreground-secondary max-w-xl">
                          <a href={tracker.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-accent-primary transition-colors font-mono font-semibold truncate max-w-[70%]">
                            <span>{tracker.url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          <span className="shrink-0 text-foreground-muted font-medium">Mismatch: {String((event.metadata as any).visualDiff.mismatchPercentage)}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3.5 flex items-center justify-between text-[11px] text-foreground-secondary">
                        <a href={tracker.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-accent-primary transition-colors font-mono font-semibold truncate max-w-[90%]">
                          <span>{tracker.url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-3.5">
                      <span className={`rounded-md border px-2 py-0.5 text-[8px] font-mono font-bold tracking-wider ${getEventBadgeStyles(event.type)}`}>
                        {event.type.replace("_", " ")}
                      </span>
                      <span className={`rounded-md border px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider ${
                        event.severity === "high" ? "bg-error/10 border-error/20 text-error" :
                        event.severity === "medium" ? "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]" :
                        "bg-foreground-muted/10 border-border-glass text-foreground-secondary"
                      }`}>
                        {event.severity} severity
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scan History list (Right 1 column) */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">Crawler Execution Logs</h3>
            <p className="text-xs text-foreground-secondary">
              List of recent worker scans and response status metrics.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {scans.length === 0 ? (
              <div className="text-center py-8 text-xs text-foreground-muted border border-dashed border-border-glass rounded-2xl">
                No scan history recorded yet
              </div>
            ) : (
              scans.map((scan) => (
                <div
                  key={scan.id}
                  className="bg-bg-glass border border-border-glass rounded-2xl p-4 flex items-center justify-between text-xs transition-all hover:bg-surface-elevated/10 hover:border-white/12"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span className={`h-2 w-2 rounded-full ${scan.status === "success" ? "bg-success" : "bg-error"}`} />
                      <span>{scan.status === "success" ? `HTTP ${scan.statusCode || 200}` : scan.error || "Failed Scan"}</span>
                    </div>
                    <p className="text-[10px] text-foreground-secondary font-mono">
                      {scan.scannedAt ? ((scan.scannedAt as any).toDate ? (scan.scannedAt as any).toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : new Date(scan.scannedAt as any).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })) : ""}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-mono font-semibold text-foreground-secondary">{scan.responseTime} ms</span>
                    <p className="text-[9px] uppercase font-mono tracking-wider text-foreground-muted">
                      {scan.changesDetected ? "Changes Found" : "No Changes"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Tracker Modal */}
      <EditTrackerModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        tracker={tracker}
        onSuccess={() => setIsEditOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <DialogContent className="max-w-[400px]" onClose={() => setIsDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle className="text-error flex items-center gap-2 text-lg font-bold">
              <AlertCircle className="h-5 w-5 text-error" /> Delete Monitor?
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-foreground-secondary">
              Are you sure you want to delete <strong>{tracker?.name}</strong>? This action will permanently remove all snapshot logs and scraping histories.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

