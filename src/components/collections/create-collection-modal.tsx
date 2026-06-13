"use client";

import React, { useState } from "react";
import { collection, doc, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { CollectionRepository } from "@/services/firestore/collections";
import { Collection } from "@/types/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Folder,
  Briefcase,
  ShoppingBag,
  BookOpen,
  FileText,
  Globe,
  Sparkles,
  GraduationCap,
  Heart,
  Palette,
} from "lucide-react";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Icon list maps names to Lucide elements
const AVAILABLE_ICONS = [
  { name: "folder", element: Folder },
  { name: "briefcase", element: Briefcase },
  { name: "shopping-bag", element: ShoppingBag },
  { name: "book-open", element: BookOpen },
  { name: "file-text", element: FileText },
  { name: "globe", element: Globe },
  { name: "sparkles", element: Sparkles },
  { name: "graduation-cap", element: GraduationCap },
  { name: "heart", element: Heart },
];

// Gradient palettes
const AVAILABLE_COLORS = [
  { key: "blue", class: "from-accent-primary to-accent-cyan" },
  { key: "purple", class: "from-accent-purple to-[#D946EF]" },
  { key: "gold", class: "from-[#F59E0B] to-accent-purple" },
  { key: "red", class: "from-error to-[#EC4899]" },
  { key: "green", class: "from-success to-accent-cyan" },
];

export default function CreateCollectionModal({ isOpen, onClose, onSuccess }: CreateCollectionModalProps) {
  const { profile } = useAuthStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("folder");
  const [selectedColor, setSelectedColor] = useState("from-accent-primary to-accent-cyan");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedIcon("folder");
    setSelectedColor("from-accent-primary to-accent-cyan");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      setError("User session not found.");
      return;
    }

    if (!name.trim()) {
      setError("Collection name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create collection reference for ID generation
      const colId = doc(collection(db, "users", profile.id, "collections")).id;
      const now = Timestamp.now();

      const newCol: Collection = {
        id: colId,
        name: name.trim(),
        description: description.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
        trackerCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await CollectionRepository.createCollection(profile.id, newCol);
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create collection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <DialogContent className="max-w-[480px]" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <span className="h-2 w-2 rounded-full bg-accent-primary animate-pulse" />
            Create Collection
          </DialogTitle>
          <DialogDescription>
            Organize website change monitors inside custom command folders.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {error && (
            <div className="rounded-xl border border-error/25 bg-error/10 p-3.5 text-xs font-semibold text-error">
              {error}
            </div>
          )}

          {/* Collection Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
              Collection Name *
            </label>
            <Input
              placeholder="e.g. Placement Preparation, Shopping Watchlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
              Description (Optional)
            </label>
            <Input
              placeholder="e.g. Laptops and accessories price drop tracking"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Icon Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
              Select Icon
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {AVAILABLE_ICONS.map((iconItem) => {
                const IconComponent = iconItem.element;
                const isSelected = selectedIcon === iconItem.name;

                return (
                  <button
                    key={iconItem.name}
                    type="button"
                    onClick={() => setSelectedIcon(iconItem.name)}
                    className={`h-11 rounded-xl border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-accent-primary/10 border-accent-primary text-accent-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                        : "border-border-glass bg-bg-glass text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                    } cursor-pointer`}
                    disabled={submitting}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Gradient Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary flex items-center gap-1.5">
              <Palette className="h-4 w-4" /> Gradient Style
            </label>
            <div className="flex gap-3.5">
              {AVAILABLE_COLORS.map((colorItem) => {
                const isSelected = selectedColor === colorItem.class;

                return (
                  <button
                    key={colorItem.key}
                    type="button"
                    onClick={() => setSelectedColor(colorItem.class)}
                    className={`h-8 w-8 rounded-full bg-gradient-to-tr ${colorItem.class} relative flex items-center justify-center p-[2px] transition-all hover:scale-[1.1] cursor-pointer`}
                    disabled={submitting}
                  >
                    {isSelected && (
                      <span className="h-full w-full rounded-full border-2 border-white ring-2 ring-black/40" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="mt-8">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Save Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
