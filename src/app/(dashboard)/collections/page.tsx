"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { CollectionRepository, collectionConverter } from "@/services/firestore/collections";
import { trackerConverter } from "@/services/firestore/trackers";
import { Collection, Tracker } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import CreateCollectionModal from "@/components/collections/create-collection-modal";
import EditCollectionModal from "@/components/collections/edit-collection-modal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderPlus,
  Plus,
  Minus,
  Edit2,
  Trash2,
  AlertCircle,
  Briefcase,
  ShoppingBag,
  BookOpen,
  FileText,
  Globe,
  Sparkles,
  GraduationCap,
  Heart,
  ChevronRight,
  FolderOpen,
  ArrowRight,
  Activity,
  X,
  Search,
} from "lucide-react";

// Helper to render icon by name
const renderIcon = (iconName: string, className = "h-5 w-5") => {
  switch (iconName) {
    case "briefcase":
      return <Briefcase className={className} />;
    case "shopping-bag":
      return <ShoppingBag className={className} />;
    case "book-open":
      return <BookOpen className={className} />;
    case "file-text":
      return <FileText className={className} />;
    case "globe":
      return <Globe className={className} />;
    case "sparkles":
      return <Sparkles className={className} />;
    case "graduation-cap":
      return <GraduationCap className={className} />;
    case "heart":
      return <Heart className={className} />;
    default:
      return <Folder className={className} />;
  }
};

export default function CollectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuthStore();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]); // User's total trackers list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedCol, setSelectedCol] = useState<Collection | null>(null);

  // Modals States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Delete Collection Confirm State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add Trackers Dialog State
  const [isAddTrackersOpen, setIsAddTrackersOpen] = useState(false);
  const [selectedTrackerIds, setSelectedTrackerIds] = useState<string[]>([]);
  const [trackerSearch, setTrackerSearch] = useState("");
  const [savingTrackers, setSavingTrackers] = useState(false);

  // Load selected ID from URL if present
  useEffect(() => {
    const urlId = searchParams.get("id");
    if (urlId && collections.length > 0) {
      const match = collections.find((c) => c.id === urlId);
      if (match) setSelectedCol(match);
    }
  }, [searchParams, collections]);

  // Set up real-time collections listener
  useEffect(() => {
    if (!profile?.id) return;

    setLoading(true);
    const q = query(
      collection(db, "users", profile.id, "collections").withConverter(collectionConverter),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: Collection[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data());
        });
        setCollections(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Collections onSnapshot error", err);
        setError("Failed to fetch collections.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  // Set up user trackers listener (needed for detail listing and add selectors)
  useEffect(() => {
    if (!profile?.id) return;

    const q = query(
      collection(db, "trackers").withConverter(trackerConverter),
      where("userId", "==", profile.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: Tracker[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data());
        });
        setTrackers(list);
      },
      (err) => {
        console.error("Trackers listener error in collections", err);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  // Dynamic filter for trackers that are in the selected collection
  const selectedTrackers = trackers.filter(
    (t) => selectedCol && t.collectionId === selectedCol.id
  );

  // Filter for trackers that are NOT in the selected collection (available to add)
  const availableTrackers = trackers.filter((t) => {
    if (!selectedCol) return false;
    // Don't show trackers already in the collection
    if (t.collectionId === selectedCol.id) return false;
    
    // Search query filter
    const matchesSearch =
      t.name.toLowerCase().includes(trackerSearch.toLowerCase()) ||
      t.url.toLowerCase().includes(trackerSearch.toLowerCase());
    return matchesSearch;
  });

  // Handle deleting a collection (and unassigning all trackers inside it)
  const confirmDeleteCollection = async () => {
    if (!profile?.id || !selectedCol) return;
    setDeleting(true);
    try {
      const batch = writeBatch(db);
      
      // 1. Unassociate trackers in this collection
      const associated = trackers.filter((t) => t.collectionId === selectedCol.id);
      associated.forEach((t) => {
        const trackerRef = doc(db, "trackers", t.id);
        batch.update(trackerRef, { collectionId: "" });
      });

      // 2. Delete the collection document
      const colDocRef = doc(db, "users", profile.id, "collections", selectedCol.id);
      batch.delete(colDocRef);

      await batch.commit();
      
      setSelectedCol(null);
      setIsDeleteOpen(false);
    } catch (err) {
      console.error("Failed to delete collection", err);
    } finally {
      setDeleting(false);
    }
  };

  // Handle removing a single tracker from the selected collection
  const handleRemoveTracker = async (trackerId: string) => {
    if (!profile?.id || !selectedCol) return;
    try {
      const batch = writeBatch(db);

      // 1. Reset tracker collectionId
      const trackerRef = doc(db, "trackers", trackerId);
      batch.update(trackerRef, { collectionId: "" });

      // 2. Decrement collection count
      const colRef = doc(db, "users", profile.id, "collections", selectedCol.id);
      batch.update(colRef, { trackerCount: Math.max(0, (selectedCol.trackerCount || 0) - 1) });

      await batch.commit();

      // Update local state if needed (onSnapshot will handle, but helps instant rendering)
      setSelectedCol((prev) =>
        prev ? { ...prev, trackerCount: Math.max(0, (prev.trackerCount || 0) - 1) } : null
      );
    } catch (err) {
      console.error("Failed to remove tracker", err);
    }
  };

  // Open Add Trackers modal
  const handleOpenAddTrackers = () => {
    setSelectedTrackerIds([]);
    setTrackerSearch("");
    setIsAddTrackersOpen(true);
  };

  // Toggle tracker checkbox selection
  const handleToggleSelectTracker = (id: string) => {
    setSelectedTrackerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Confirm adding selected trackers to the collection
  const confirmAddTrackers = async () => {
    if (!profile?.id || !selectedCol || selectedTrackerIds.length === 0) return;
    setSavingTrackers(true);
    try {
      const batch = writeBatch(db);

      // 1. Associate each selected tracker
      selectedTrackerIds.forEach((trackerId) => {
        const trackerRef = doc(db, "trackers", trackerId);
        batch.update(trackerRef, { collectionId: selectedCol.id });
      });

      // 2. Increment collection trackerCount
      const colRef = doc(db, "users", profile.id, "collections", selectedCol.id);
      const newCount = (selectedCol.trackerCount || 0) + selectedTrackerIds.length;
      batch.update(colRef, { trackerCount: newCount });

      await batch.commit();

      setSelectedCol((prev) => (prev ? { ...prev, trackerCount: newCount } : null));
      setIsAddTrackersOpen(false);
    } catch (err) {
      console.error("Failed to add trackers", err);
    } finally {
      setSavingTrackers(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Collections
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Group trackers into folders to monitor them as unified modules.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <FolderPlus className="h-5 w-5" />
          <span>New Collection</span>
        </Button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Collections List (1/3 Width) */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-foreground-secondary px-1">
            All Folders ({collections.length})
          </h3>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl border border-border-glass bg-bg-glass backdrop-blur-md p-4 animate-pulse"
                />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="rounded-2xl border border-border-glass bg-bg-glass p-8 text-center">
              <FolderOpen className="h-10 w-10 text-foreground-muted mx-auto mb-3" />
              <p className="text-xs font-semibold text-foreground-secondary">
                No collections created. Create a collection to organize your site monitors.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {collections.map((col) => {
                const isSelected = selectedCol?.id === col.id;
                return (
                  <div
                    key={col.id}
                    onClick={() => setSelectedCol(col)}
                    className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                      isSelected
                        ? "bg-surface-elevated/40 border-accent-primary shadow-[0_0_20px_rgba(59,130,246,0.08)] scale-[1.01]"
                        : "border-border-glass bg-bg-glass hover:border-white/12 hover:bg-surface-elevated/15"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Custom visual color indicator */}
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${col.color || "from-accent-primary to-accent-cyan"} p-[1px] shrink-0`}>
                          <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-surface">
                            {renderIcon(col.icon, `h-5 w-5 ${isSelected ? "text-accent-primary" : "text-foreground-secondary group-hover:text-foreground"}`)}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-foreground transition-colors group-hover:text-accent-primary line-clamp-1">
                            {col.name}
                          </h4>
                          <p className="text-[10px] text-foreground-secondary font-mono mt-0.5">
                            {col.trackerCount || 0} monitors
                          </p>
                        </div>
                      </div>

                      <ChevronRight className={`h-4 w-4 text-foreground-muted group-hover:translate-x-0.5 transition-transform ${isSelected ? "translate-x-0.5 text-accent-primary" : ""}`} />
                    </div>

                    {col.description && (
                      <p className="mt-3 text-xs text-foreground-muted line-clamp-1 leading-relaxed">
                        {col.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Selected Collection Details (2/3 Width) */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedCol ? (
              <motion.div
                key={selectedCol.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {/* Selected Collection Header Card */}
                <div className="bg-bg-glass border border-border-glass rounded-3xl p-6 relative overflow-hidden">
                  {/* Subtle color highlight orb behind the header */}
                  <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-tr ${selectedCol.color} opacity-10 blur-2xl pointer-events-none`} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Gradient icon box */}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${selectedCol.color} p-[1px] shrink-0`}>
                        <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-surface">
                          {renderIcon(selectedCol.icon, "h-6 w-6 text-foreground")}
                        </div>
                      </div>

                      <div>
                        <h2 className="text-xl font-extrabold text-foreground leading-snug">
                          {selectedCol.name}
                        </h2>
                        <p className="text-xs text-foreground-secondary mt-0.5 font-mono">
                          {selectedCol.trackerCount || 0} monitors associated
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto border-t sm:border-t-0 border-border-glass/40 pt-3 sm:pt-0 w-full sm:w-auto">
                      <Button
                        variant="secondary"
                        onClick={() => setIsEditOpen(true)}
                        className="flex-1 sm:flex-initial flex items-center gap-1.5 h-10 text-xs px-3"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setIsDeleteOpen(true)}
                        className="flex-1 sm:flex-initial flex items-center gap-1.5 h-10 text-xs px-3 border-error/20 bg-error/5 text-error hover:bg-error/10 hover:border-error/35"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>

                  {selectedCol.description && (
                    <p className="text-xs text-foreground-secondary leading-relaxed mt-4 border-t border-border-glass/40 pt-3">
                      {selectedCol.description}
                    </p>
                  )}
                </div>

                {/* Trackers inside Collection list */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-foreground-secondary">
                      Monitored Websites ({selectedTrackers.length})
                    </h3>
                    <Button
                      variant="secondary"
                      onClick={handleOpenAddTrackers}
                      className="flex items-center gap-1.5 h-9 rounded-lg text-xs font-semibold px-3 text-accent-primary border-accent-primary/20 bg-accent-primary/5 hover:border-accent-primary/45 hover:bg-accent-primary/10"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Tracker</span>
                    </Button>
                  </div>

                  {selectedTrackers.length === 0 ? (
                    // Empty Collection monitors list state
                    <div className="rounded-2xl border border-border-glass bg-bg-glass p-12 text-center relative overflow-hidden">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-bg-glass border border-border-glass text-foreground-muted mb-4">
                        <Activity className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">No monitors in this collection</h4>
                      <p className="text-xs text-foreground-secondary mt-1.5 max-w-xs mx-auto leading-normal">
                        Select monitors from your repository pool to monitor them as a unified list.
                      </p>
                      <Button
                        variant="secondary"
                        onClick={handleOpenAddTrackers}
                        className="mt-4"
                      >
                        Add website monitors
                      </Button>
                    </div>
                  ) : (
                    // Monitors list
                    <div className="flex flex-col gap-3">
                      {selectedTrackers.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => router.push(`/trackers/${t.id}`)}
                          className="group cursor-pointer rounded-xl border border-border-glass bg-bg-glass p-4 transition-all duration-300 hover:border-white/12 hover:bg-surface-elevated/15 flex items-center justify-between gap-4"
                        >
                          <div className="flex-1 truncate space-y-1">
                            <h4 className="text-sm font-bold text-foreground group-hover:text-accent-primary transition-colors leading-tight truncate">
                              {t.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-foreground-secondary truncate">
                              <Globe className="h-3.5 w-3.5 shrink-0" />
                              <span className="underline truncate select-none">{t.url}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Status badge indicator */}
                            {t.status === "active" ? (
                              <span className="h-2 w-2 rounded-full bg-success pulse-success" title="Active" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" title="Paused" />
                            )}

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTracker(t.id);
                              }}
                              className="h-8 w-8 rounded-lg border border-border-glass bg-bg-glass text-foreground-secondary flex items-center justify-center hover:text-error hover:border-error/25 hover:bg-error/5 transition-all"
                              title="Remove from Collection"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              // Empty selection dashboard center
              <div className="rounded-3xl border border-border-glass bg-bg-glass p-12 text-center max-w-md mx-auto mt-12 relative overflow-hidden">
                <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[240px] h-[120px] bg-accent-primary/5 rounded-full blur-[40px]" />
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/5 border border-accent-primary/15 text-foreground-secondary mb-5">
                  <FolderOpen className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-foreground">Select a collection</h3>
                <p className="mt-2 text-xs text-foreground-secondary max-w-xs mx-auto leading-relaxed">
                  Choose a folder from the left menu to view, modify, and monitor associated website tracks, or create a new collection to get started.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 1. Create Collection Modal */}
      <CreateCollectionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setIsCreateOpen(false)}
      />

      {/* 2. Edit Collection Modal */}
      <EditCollectionModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        collectionItem={selectedCol}
        onSuccess={() => setIsEditOpen(false)}
      />

      {/* 3. Delete Collection Dialog */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <DialogContent className="max-w-[400px]" onClose={() => setIsDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle className="text-error flex items-center gap-2 text-lg font-bold">
              <AlertCircle className="h-5 w-5 text-error" /> Delete Collection?
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-foreground-secondary">
              Are you sure you want to delete <strong>{selectedCol?.name}</strong>? Monitors inside this folder will remain active but will be unassigned to the general pool.
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
              onClick={confirmDeleteCollection}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Add Trackers to Collection Selection Dialog */}
      <Dialog isOpen={isAddTrackersOpen} onClose={() => setIsAddTrackersOpen(false)}>
        <DialogContent className="max-w-[480px] max-h-[85vh] overflow-y-auto" onClose={() => setIsAddTrackersOpen(false)}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-accent-primary" /> Add monitors
            </DialogTitle>
            <DialogDescription>
              Select monitors from your pool to associate with <strong>{selectedCol?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Tracker search */}
            <div className="relative">
              <Input
                placeholder="Search available monitors..."
                value={trackerSearch}
                onChange={(e) => setTrackerSearch(e.target.value)}
                className="pl-10 h-10 text-xs rounded-xl"
              />
              <Search className="absolute left-3.5 top-[13px] h-3.5 w-3.5 text-foreground-muted" />
            </div>

            {/* List container */}
            <div className="max-h-[260px] overflow-y-auto border border-border-glass rounded-xl bg-white/[0.01] divide-y divide-border-glass/40">
              {availableTrackers.length === 0 ? (
                <div className="p-8 text-center text-xs text-foreground-muted">
                  No monitors available to add.
                </div>
              ) : (
                availableTrackers.map((t) => {
                  const isChecked = selectedTrackerIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleSelectTracker(t.id)}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-surface-elevated/20 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 truncate">
                        <p className="text-xs font-semibold text-foreground truncate">{t.name}</p>
                        <p className="text-[10px] text-foreground-secondary truncate">{t.url}</p>
                      </div>
                      
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Controlled by click on parent div
                        className="h-4.5 w-4.5 rounded border border-border-glass bg-bg-glass text-accent-primary focus:ring-accent-primary shrink-0 pointer-events-none"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="secondary"
              onClick={() => setIsAddTrackersOpen(false)}
              disabled={savingTrackers}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAddTrackers}
              disabled={savingTrackers || selectedTrackerIds.length === 0}
            >
              {savingTrackers ? "Saving..." : `Add ${selectedTrackerIds.length} monitors`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
