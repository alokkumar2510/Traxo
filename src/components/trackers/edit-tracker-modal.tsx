"use client";

import React, { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuthStore } from "@/store/authStore";
import { TrackerRepository } from "@/services/firestore/trackers";
import { CollectionRepository } from "@/services/firestore/collections";
import { Collection, Tracker, ScanFrequency, SelectorType } from "@/types/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Layout, Tag, DollarSign, Briefcase, FileText, Clock, Folder } from "lucide-react";

interface EditTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracker: Tracker | null;
  onSuccess?: () => void;
}

export default function EditTrackerModal({ isOpen, onClose, tracker, onSuccess }: EditTrackerModalProps) {
  const { profile } = useAuthStore();
  const [collections, setCollections] = useState<Collection[]>([]);

  // Base Form Fields
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<ScanFrequency>("daily");
  const [collectionId, setCollectionId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tagsString, setTagsString] = useState("");

  // Section Config Fields
  const [sectionSelector, setSectionSelector] = useState("");
  const [sectionSelectorType, setSectionSelectorType] = useState<SelectorType>("css");
  const [sectionMonitoredElement, setSectionMonitoredElement] = useState("");

  // Price Config Fields
  const [priceTargetPrice, setPriceTargetPrice] = useState("");
  const [priceCurrency, priceSetCurrency] = useState("INR");

  // Job Config Fields
  const [jobRole, setJobRole] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobRemoteOnly, setJobRemoteOnly] = useState(false);
  const [jobKeywords, setJobKeywords] = useState("");

  // PDF Config Fields
  const [pdfFileName, setPdfFileName] = useState("");

  // State flags
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user collections & prefill tracker data
  useEffect(() => {
    if (isOpen && profile?.id) {
      setLoadingCollections(true);
      CollectionRepository.listCollections(profile.id)
        .then((data) => {
          setCollections(data);
          setError(null);
        })
        .catch((err) => {
          console.error("Failed to load collections", err);
          setError("Failed to fetch collections. Please try again.");
        })
        .finally(() => setLoadingCollections(false));
    }

    if (isOpen && tracker) {
      setName(tracker.name);
      setUrl(tracker.url);
      setDescription(tracker.description || "");
      setFrequency(tracker.frequency);
      setCollectionId(tracker.collectionId || "");
      setIsPublic(tracker.isPublic || false);
      setTagsString(tracker.tags ? tracker.tags.join(", ") : "");

      // Prefill Section Details
      if (tracker.sectionConfig) {
        setSectionSelector(tracker.sectionConfig.selector);
        setSectionSelectorType(tracker.sectionConfig.selectorType);
        setSectionMonitoredElement(tracker.sectionConfig.monitoredElement || "");
      }
      // Prefill Price Details
      if (tracker.priceConfig) {
        setPriceTargetPrice(tracker.priceConfig.targetPrice ? tracker.priceConfig.targetPrice.toString() : "");
        priceSetCurrency(tracker.priceConfig.currency || "INR");
      }
      // Prefill Job Details
      if (tracker.jobConfig) {
        setJobRole(tracker.jobConfig.role || "");
        setJobLocation(tracker.jobConfig.location || "");
        setJobRemoteOnly(tracker.jobConfig.remoteOnly || false);
        setJobKeywords(tracker.jobConfig.keywords ? tracker.jobConfig.keywords.join(", ") : "");
      }
      // Prefill PDF Details
      if (tracker.pdfConfig) {
        setPdfFileName(tracker.pdfConfig.fileName || "");
      }
    }
  }, [isOpen, tracker, profile]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      setError("User session not found.");
      return;
    }

    if (!tracker) {
      setError("No tracker loaded.");
      return;
    }

    if (!name.trim()) {
      setError("Tracker name is required.");
      return;
    }

    if (!url.trim()) {
      setError("URL is required.");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL (e.g. https://example.com).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build Tags
      const tags = tagsString
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Construct configurations based on type
      let sectionConfig = undefined;
      let jobConfig = undefined;
      let priceConfig = undefined;
      let pdfConfig = undefined;

      if (tracker.type === "section") {
        if (!sectionSelector.trim()) {
          throw new Error("Section selector is required.");
        }
        sectionConfig = {
          selector: sectionSelector.trim(),
          selectorType: sectionSelectorType,
          monitoredElement: sectionMonitoredElement.trim() || "Webpage Section",
          createdAt: tracker.sectionConfig?.createdAt || Timestamp.now(),
        };
      } else if (tracker.type === "price") {
        const target = parseFloat(priceTargetPrice);
        priceConfig = {
          targetPrice: isNaN(target) ? undefined : target,
          currency: priceCurrency || "INR",
          currentPrice: tracker.priceConfig?.currentPrice,
          lowestPrice: tracker.priceConfig?.lowestPrice,
          highestPrice: tracker.priceConfig?.highestPrice,
        };
      } else if (tracker.type === "job") {
        const keywords = jobKeywords
          .split(",")
          .map((kw) => kw.trim())
          .filter((kw) => kw.length > 0);
        jobConfig = {
          role: jobRole.trim() || undefined,
          location: jobLocation.trim() || undefined,
          remoteOnly: jobRemoteOnly,
          keywords,
        };
      } else if (tracker.type === "pdf") {
        pdfConfig = {
          fileName: pdfFileName.trim() || "document.pdf",
          lastHash: tracker.pdfConfig?.lastHash,
          lastModified: tracker.pdfConfig?.lastModified,
        };
      }

      const originalColId = tracker.collectionId;

      const updatedFields: Partial<Tracker> = {
        name: name.trim(),
        url: url.trim(),
        frequency,
        collectionId: collectionId || "",
        description: description.trim() || "",
        isPublic,
        tags,
        ...(sectionConfig ? { sectionConfig } : {}),
        ...(jobConfig ? { jobConfig } : {}),
        ...(priceConfig ? { priceConfig } : {}),
        ...(pdfConfig ? { pdfConfig } : {}),
      };

      await TrackerRepository.updateTracker(tracker.id, updatedFields);
      
      // Update tracker counts on collections if collectionId changed (Polish)
      if (originalColId !== collectionId) {
        if (originalColId) {
          const col = collections.find((c) => c.id === originalColId);
          if (col) {
            await CollectionRepository.updateCollection(profile.id, originalColId, {
              trackerCount: Math.max(0, (col.trackerCount || 0) - 1),
            });
          }
        }
        if (collectionId) {
          const col = collections.find((c) => c.id === collectionId);
          if (col) {
            await CollectionRepository.updateCollection(profile.id, collectionId, {
              trackerCount: (col.trackerCount || 0) + 1,
            });
          }
        }
      }

      handleClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update tracker. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <DialogContent className="max-w-[550px] max-h-[90vh] overflow-y-auto" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <span className="h-2 w-2 rounded-full bg-accent-purple animate-pulse" />
            Edit Tracker Settings
          </DialogTitle>
          <DialogDescription>
            Update scanner targets and parameters for change monitoring.
          </DialogDescription>
        </DialogHeader>

        {tracker && (
          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {error && (
              <div className="rounded-xl border border-error/25 bg-error/10 p-3.5 text-xs font-semibold text-error">
                {error}
              </div>
            )}

            {/* Form Grid */}
            <div className="space-y-4">
              {/* Tracker Type (locked) */}
              <div className="space-y-1.5 opacity-80">
                <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                  Tracker Type (Locked)
                </label>
                <div className="flex h-[52px] items-center rounded-xl border border-border-glass bg-bg-glass/40 px-4 text-sm font-semibold text-foreground-secondary select-none">
                  {tracker.type === "website" && "Full Website Monitor"}
                  {tracker.type === "section" && "Specific Selector Monitor"}
                  {tracker.type === "price" && "Price drop Monitor"}
                  {tracker.type === "job" && "Job Keyword Monitor"}
                  {tracker.type === "pdf" && "PDF File Monitor"}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                  Tracker Name *
                </label>
                <Input
                  placeholder="Google Careers Page, iPad Price, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              {/* URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                  Target URL *
                </label>
                <div className="relative">
                  <Input
                    placeholder="https://example.com/page"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-11"
                    required
                    disabled={submitting}
                  />
                  <Globe className="absolute left-4 top-[17px] h-4 w-4 text-foreground-muted" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                  Description (Optional)
                </label>
                <Input
                  placeholder="Track internal hiring schedules, price adjustments, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {/* Frequency Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Scan Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as ScanFrequency)}
                  className="flex h-[52px] w-full rounded-xl border border-border-glass bg-bg-glass backdrop-blur-md px-4 text-sm text-foreground placeholder-foreground-muted shadow-sm outline-none transition-all duration-300 focus:bg-surface focus:border-accent-primary"
                  disabled={submitting}
                >
                  <option value="hourly">Hourly Scans</option>
                  <option value="6h">Every 6 Hours</option>
                  <option value="12h">Every 12 Hours</option>
                  <option value="daily">Daily Scans</option>
                </select>
              </div>

              {/* Dynamic Type Config Inputs */}
              {tracker.type === "section" && (
                <div className="space-y-4 rounded-2xl border border-border-glass bg-white/[0.01] p-4">
                  <h4 className="text-xs font-bold font-mono text-accent-primary uppercase tracking-wider">
                    Section Selector Configurations
                  </h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                      Selector Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="radio"
                          name="selectorType"
                          checked={sectionSelectorType === "css"}
                          onChange={() => setSectionSelectorType("css")}
                          className="h-4 w-4 accent-accent-primary"
                        />
                        CSS Selector
                      </label>
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="radio"
                          name="selectorType"
                          checked={sectionSelectorType === "xpath"}
                          onChange={() => setSectionSelectorType("xpath")}
                          className="h-4 w-4 accent-accent-primary"
                        />
                        XPath
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                      Target Selector *
                    </label>
                    <Input
                      placeholder={sectionSelectorType === "css" ? ".notice-list, #main-article" : "//div[@class='announcements']"}
                      value={sectionSelector}
                      onChange={(e) => setSectionSelector(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                      Monitored Element Title
                    </label>
                    <Input
                      placeholder="Notice Board, Core Pricing"
                      value={sectionMonitoredElement}
                      onChange={(e) => setSectionMonitoredElement(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}

              {tracker.type === "price" && (
                <div className="space-y-4 rounded-2xl border border-border-glass bg-white/[0.01] p-4">
                  <h4 className="text-xs font-bold font-mono text-[#F59E0B] uppercase tracking-wider">
                    Price Tracking Parameters
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" /> Currency
                      </label>
                      <select
                        value={priceCurrency}
                        onChange={(e) => priceSetCurrency(e.target.value)}
                        className="flex h-[52px] w-full rounded-xl border border-border-glass bg-bg-glass backdrop-blur-md px-4 text-sm text-foreground outline-none focus:bg-surface focus:border-accent-primary"
                        disabled={submitting}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                        Target Alert Price
                      </label>
                      <Input
                        type="number"
                        placeholder="Alert when below..."
                        value={priceTargetPrice}
                        onChange={(e) => setPriceTargetPrice(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              )}

              {tracker.type === "job" && (
                <div className="space-y-4 rounded-2xl border border-border-glass bg-white/[0.01] p-4">
                  <h4 className="text-xs font-bold font-mono text-accent-cyan uppercase tracking-wider">
                    Job Portal Crawling Filters
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> Role Title
                      </label>
                      <Input
                        placeholder="Software Engineer"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                        Location
                      </label>
                      <Input
                        placeholder="Bangalore, Remote"
                        value={jobLocation}
                        onChange={(e) => setJobLocation(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="editRemoteOnly"
                      checked={jobRemoteOnly}
                      onChange={(e) => setJobRemoteOnly(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border border-border-glass bg-bg-glass text-accent-primary focus:ring-accent-primary"
                      disabled={submitting}
                    />
                    <label htmlFor="editRemoteOnly" className="text-sm text-foreground-secondary select-none cursor-pointer">
                      Only track remote opportunities
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary">
                      Keywords Filter (comma separated)
                    </label>
                    <Input
                      placeholder="react, python, internship"
                      value={jobKeywords}
                      onChange={(e) => setJobKeywords(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}

              {tracker.type === "pdf" && (
                <div className="space-y-4 rounded-2xl border border-border-glass bg-white/[0.01] p-4">
                  <h4 className="text-xs font-bold font-mono text-accent-purple uppercase tracking-wider">
                    PDF Hash Tracking Configurations
                  </h4>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> File Name Filter
                    </label>
                    <Input
                      placeholder="Timetable.pdf (empty tracks all PDFs on page)"
                      value={pdfFileName}
                      onChange={(e) => setPdfFileName(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}

              {/* Collection & Tags Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary flex items-center gap-1">
                    <Folder className="h-3.5 w-3.5" /> Collection
                  </label>
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="flex h-[52px] w-full rounded-xl border border-border-glass bg-bg-glass backdrop-blur-md px-4 text-sm text-foreground placeholder-foreground-muted shadow-sm outline-none transition-all duration-300 focus:bg-surface focus:border-accent-primary"
                    disabled={submitting || loadingCollections}
                  >
                    <option value="">None (Unassigned)</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono tracking-wider uppercase text-foreground-secondary flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> Tags (comma separated)
                  </label>
                  <Input
                    placeholder="careers, college, gadgets"
                    value={tagsString}
                    onChange={(e) => setTagsString(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Public Option */}
              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border border-border-glass bg-bg-glass text-accent-primary focus:ring-accent-primary"
                  disabled={submitting}
                />
                <label htmlFor="editIsPublic" className="text-sm text-foreground-secondary cursor-pointer">
                  Publish to marketplace community gallery
                </label>
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
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
