"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function SearchBar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigationItems = [
    {
      title: "Dashboard Overview",
      subtitle: "View metrics and recent activity",
      path: "/dashboard",
    },
    {
      title: "Manage Trackers",
      subtitle: "List, create, or edit your watchers",
      path: "/trackers",
    },
    {
      title: "Collections Folders",
      subtitle: "Group and organize tracked targets",
      path: "/collections",
    },
    {
      title: "Timeline & Logs",
      subtitle: "Audit website change histories",
      path: "/history",
    },
    {
      title: "Account Settings",
      subtitle: "Configure profiles and notifications",
      path: "/settings",
    },
    {
      title: "Create New Tracker",
      subtitle: "Start monitoring a website",
      path: "/trackers?create=true",
    },
  ];

  const filteredItems = navigationItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(path);
  };

  return (
    <>
      <button
        id="cmd-search-btn"
        onClick={() => setIsOpen(true)}
        className="flex h-[42px] w-full max-w-[240px] items-center justify-between rounded-xl border border-border-glass bg-bg-glass backdrop-blur-md px-3 text-xs text-foreground-muted hover:border-white/15 hover:bg-surface-elevated/40 transition-all duration-300 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-foreground-muted" />
          <span>Search...</span>
        </div>
        <div className="flex items-center gap-0.5 rounded bg-surface border border-border-glass px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-foreground-secondary">
          <Command className="h-2.5 w-2.5" />
          <span>K</span>
        </div>
      </button>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <DialogContent showCloseButton={false} className="p-0 overflow-hidden max-w-[540px]">
          {/* Search Input Header */}
          <div className="flex items-center gap-3 border-b border-border-glass px-4 h-[60px] bg-surface-elevated/20">
            <Search className="h-5 w-5 text-foreground-secondary" />
            <input
              type="text"
              autoFocus
              placeholder="Search sections, settings, or actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder-foreground-muted outline-none border-none py-4"
            />
            <div className="flex items-center gap-0.5 rounded bg-surface border border-border-glass px-1.5 py-0.5 font-mono text-[10px] text-foreground-secondary">
              ESC
            </div>
          </div>

          {/* Search Results List */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredItems.length > 0 ? (
              <div className="flex flex-col gap-1">
                {filteredItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item.path)}
                    className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-surface-elevated transition-colors duration-200 cursor-pointer group"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground group-hover:text-accent-primary transition-colors">
                        {item.title}
                      </span>
                      <span className="text-xs text-foreground-secondary">{item.subtitle}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-foreground-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-foreground-secondary">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
