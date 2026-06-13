"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { TrackerRepository, trackerConverter } from "@/services/firestore/trackers";
import { Tracker, TrackerType, TrackerStatus } from "@/types/database";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import CreateTrackerModal from "@/components/trackers/create-tracker-modal";
import EditTrackerModal from "@/components/trackers/edit-tracker-modal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Globe,
  Activity,
  Play,
  Pause,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle,
  FileText,
  DollarSign,
  Briefcase,
  ExternalLink,
  Layout,
} from "lucide-react";

export default function TrackersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuthStore();

  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modals States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);

  // Delete Confirm State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [trackerToDelete, setTrackerToDelete] = useState<Tracker | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Trigger create modal if '?create=true' parameter is in URL
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  // Set up real-time listener for user's trackers
  useEffect(() => {
    if (!profile?.id) return;

    setLoading(true);
    const q = query(
      collection(db, "trackers").withConverter(trackerConverter),
      where("userId", "==", profile.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: Tracker[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data());
        });
        setTrackers(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Firestore onSnapshot error", err);
        setError("Failed to fetch trackers in real-time.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  // Toggle pause/resume state
  const handleToggleStatus = async (e: React.MouseEvent, tracker: Tracker) => {
    e.stopPropagation(); // Avoid card click navigation
    const newStatus: TrackerStatus = tracker.status === "active" ? "paused" : "active";
    try {
      await TrackerRepository.updateTracker(tracker.id, { status: newStatus });
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (e: React.MouseEvent, tracker: Tracker) => {
    e.stopPropagation();
    setSelectedTracker(tracker);
    setIsEditOpen(true);
  };

  // Open Delete Confirm Modal
  const handleOpenDelete = (e: React.MouseEvent, tracker: Tracker) => {
    e.stopPropagation();
    setTrackerToDelete(tracker);
    setIsDeleteOpen(true);
  };

  // Confirm and Execute Delete
  const confirmDelete = async () => {
    if (!trackerToDelete) return;
    setDeleting(true);
    try {
      await TrackerRepository.deleteTracker(trackerToDelete.id);
      setIsDeleteOpen(false);
      setTrackerToDelete(null);
    } catch (err) {
      console.error("Failed to delete tracker", err);
    } finally {
      setDeleting(false);
    }
  };

  // Filter logic
  const filteredTrackers = trackers.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.url.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    const matchesType =
      typeFilter === "all" || item.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Helpers
  const getTypeIcon = (type: TrackerType) => {
    switch (type) {
      case "website":
        return <Globe className="h-4 w-4" />;
      case "section":
        return <Layout className="h-4 w-4" />;
      case "price":
        return <DollarSign className="h-4 w-4" />;
      case "job":
        return <Briefcase className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeStyles = (type: TrackerType) => {
    switch (type) {
      case "website":
        return "bg-accent-primary/10 border-accent-primary/20 text-accent-primary";
      case "section":
        return "bg-accent-purple/10 border-accent-purple/20 text-accent-purple";
      case "price":
        return "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]";
      case "job":
        return "bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan";
      case "pdf":
        return "bg-purple-500/10 border-purple-500/20 text-purple-400";
    }
  };

  const getStatusIndicator = (status: TrackerStatus) => {
    switch (status) {
      case "active":
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[10px] font-mono font-bold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success pulse-success" />
            Monitoring
          </div>
        );
      case "paused":
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2 py-0.5 text-[10px] font-mono font-bold text-[#F59E0B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
            Paused
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-error/10 border border-error/20 px-2 py-0.5 text-[10px] font-mono font-bold text-error">
            <span className="h-1.5 w-1.5 rounded-full bg-error pulse-error" />
            Error
          </div>
        );
    }
  };

  const formatLastScan = (timestamp?: any) => {
    if (!timestamp) return "Never scanned";
    const date = timestamp.toDate();
    const diffMs = new Date().getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Web Monitors
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Manage your autonomous Crawlers and website monitors.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Create Tracker</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 w-full bg-bg-glass border border-border-glass rounded-2xl p-3">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Input
            placeholder="Search trackers by name or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
          <Search className="absolute left-4 top-[17px] h-4 w-4 text-foreground-muted" />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-bg-glass border border-border-glass rounded-xl px-2 h-[52px]">
            <Filter className="h-4 w-4 text-foreground-muted ml-2" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-0 text-sm text-foreground font-semibold px-2 pr-6 outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="website">Website</option>
              <option value="section">Section</option>
              <option value="price">Price Watch</option>
              <option value="job">Job Watch</option>
              <option value="pdf">PDF Hash</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-bg-glass border border-border-glass rounded-xl px-2 h-[52px]">
            <Activity className="h-4 w-4 text-foreground-muted ml-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-0 text-sm text-foreground font-semibold px-2 pr-6 outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="error">Errors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Trackers Grid */}
      {error && (
        <div className="rounded-2xl border border-error/25 bg-error/10 p-4 text-sm font-semibold text-error">
          {error}
        </div>
      )}

      {loading ? (
        // Premium Skeleton Splicer Loader
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-[210px] rounded-2xl border border-border-glass bg-bg-glass backdrop-blur-md p-6 flex flex-col justify-between animate-pulse"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-1/3 bg-surface-elevated rounded-lg" />
                  <div className="h-5 w-1/4 bg-surface-elevated rounded-lg" />
                </div>
                <div className="h-4 w-2/3 bg-surface-elevated rounded-lg" />
                <div className="h-3.5 w-1/2 bg-surface-elevated rounded-lg" />
              </div>
              <div className="flex justify-between items-center border-t border-border-glass/40 pt-4">
                <div className="h-4 w-1/4 bg-surface-elevated rounded-lg" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-surface-elevated rounded-lg" />
                  <div className="h-8 w-8 bg-surface-elevated rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTrackers.length === 0 ? (
        // Premium Empty State
        <div className="rounded-3xl border border-border-glass bg-bg-glass backdrop-blur-2xl p-12 text-center max-w-lg mx-auto mt-8 relative overflow-hidden">
          <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[240px] h-[120px] bg-accent-primary/10 rounded-full blur-[40px]" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary mb-6 animate-pulse">
            <Activity className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            No trackers found
          </h3>
          <p className="mt-2 text-sm text-foreground-secondary max-w-sm mx-auto">
            {search || statusFilter !== "all" || typeFilter !== "all"
              ? "No trackers match your current filters. Clear filters or search query."
              : "You haven't registered any website crawlers yet. Create your first tracker to start change detection."}
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="mt-6"
          >
            Create Your First Tracker
          </Button>
        </div>
      ) : (
        // Animate grid elements entrance
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredTrackers.map((tracker) => (
              <motion.div
                key={tracker.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                onClick={() => router.push(`/trackers/${tracker.id}`)}
                className="group cursor-pointer"
              >
                <Card className="h-full flex flex-col justify-between p-6 hoverEffect">
                  <div>
                    {/* Status and Type Header */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${getTypeBadgeStyles(tracker.type)}`}>
                        {getTypeIcon(tracker.type)}
                        <span className="mt-[1px]">{tracker.type}</span>
                      </span>
                      {getStatusIndicator(tracker.status)}
                    </div>

                    {/* Tracker Name */}
                    <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-accent-primary leading-snug truncate">
                      {tracker.name}
                    </h3>

                    {/* Tracker URL */}
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-foreground-secondary group-hover:text-foreground transition-colors truncate">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span className="underline truncate select-none">{tracker.url}</span>
                    </div>

                    {/* Description */}
                    {tracker.description && (
                      <p className="mt-3 text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                        {tracker.description}
                      </p>
                    )}
                  </div>

                  {/* Scan Info and Actions */}
                  <div className="mt-6 border-t border-border-glass/40 pt-4 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-[10px] text-foreground-muted font-mono uppercase tracking-wide">
                        <Clock className="h-3 w-3" />
                        <span>Last Scan</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground-secondary">
                        {formatLastScan(tracker.lastScanAt)}
                      </span>
                    </div>

                    {/* Quick Control Options */}
                    <div className="flex items-center gap-1">
                      {/* Play / Pause Toggle */}
                      <button
                        onClick={(e) => handleToggleStatus(e, tracker)}
                        className={`h-9 w-9 rounded-xl border border-border-glass flex items-center justify-center transition-all hover:scale-[1.05] hover:bg-surface-elevated ${
                          tracker.status === "active"
                            ? "text-[#F59E0B] border-[#F59E0B]/20 bg-[#F59E0B]/5 hover:border-[#F59E0B]/40"
                            : "text-success border-success/20 bg-success/5 hover:border-success/40"
                        }`}
                        title={tracker.status === "active" ? "Pause Scans" : "Resume Scans"}
                      >
                        {tracker.status === "active" ? (
                          <Pause className="h-4.5 w-4.5" />
                        ) : (
                          <Play className="h-4.5 w-4.5" />
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={(e) => handleOpenEdit(e, tracker)}
                        className="h-9 w-9 rounded-xl border border-border-glass flex items-center justify-center text-foreground-secondary hover:text-foreground hover:bg-surface-elevated hover:scale-[1.05] transition-all"
                        title="Edit Configuration"
                      >
                        <Edit2 className="h-4.5 w-4.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleOpenDelete(e, tracker)}
                        className="h-9 w-9 rounded-xl border border-border-glass flex items-center justify-center text-error border-error/10 bg-error/5 hover:border-error/30 hover:bg-error/10 hover:scale-[1.05] transition-all"
                        title="Delete Tracker"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 1. Create Tracker Modal */}
      <CreateTrackerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setIsCreateOpen(false)}
      />

      {/* 2. Edit Tracker Modal */}
      <EditTrackerModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedTracker(null);
        }}
        tracker={selectedTracker}
        onSuccess={() => {
          setIsEditOpen(false);
          setSelectedTracker(null);
        }}
      />

      {/* 3. Delete Confirmation Dialog */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <DialogContent className="max-w-[400px]" onClose={() => setIsDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle className="text-error flex items-center gap-2 text-lg font-bold">
              <AlertCircle className="h-5 w-5 text-error" /> Delete Monitor?
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-foreground-secondary">
              Are you sure you want to delete <strong>{trackerToDelete?.name}</strong>? This action will permanently remove all snapshot logs and scraping histories.
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
