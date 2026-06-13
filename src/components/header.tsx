"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Sparkles } from "lucide-react";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import SearchBar from "@/components/search-bar";
import NotificationBell from "@/components/notification-bell";
import UserMenu from "@/components/user-menu";
import { logger } from "@/utils/logger";

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [totalChangesToday, setTotalChangesToday] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for events generated today to drive the Activity Pulse
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      where("createdAt", ">=", today)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setTotalChangesToday(snap.size);
      },
      (error) => {
        logger.error({
          service: "firestore",
          event: "header_activity_listener_failed",
          userId: user.uid,
          error,
        });
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Extract page title from route
  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Dashboard";
    const segment = segments[0];
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <header className="sticky top-0 z-10 flex h-[72px] w-full items-center justify-between border-b border-border-glass bg-background/80 backdrop-blur-xl px-4 md:px-6">
      {/* Left section: Branding on Mobile / Route Title on Desktop */}
      <div className="flex items-center gap-4">
        {/* Mobile Branding */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg bg-surface border border-border-glass flex items-center justify-center overflow-hidden shadow-glow">
              <span className="text-sm font-extrabold tracking-tighter gradient-text-primary">T</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Traxo</span>
          </Link>
        </div>

        {/* Desktop Route Title */}
        <h2 className="hidden text-sm font-semibold tracking-tight text-foreground md:block font-mono uppercase">
          // {getPageTitle()}
        </h2>
      </div>

      {/* Right section: Global Search, Activity Pulse, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Activity Pulse */}
        {totalChangesToday > 0 && (
          <div className="hidden items-center gap-1.5 rounded-full border border-success/20 bg-success/5 px-2.5 py-1 text-[10px] font-medium tracking-wide text-success md:flex animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{totalChangesToday} updates detected today</span>
          </div>
        )}

        {/* Search Bar */}
        <SearchBar />

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
