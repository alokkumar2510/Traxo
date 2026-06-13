"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  LayoutDashboard,
  Activity,
  FolderOpen,
  History,
  Settings,
  ShieldCheck,
  TrendingUp,
  Bell,
  Puzzle,
  User,
  SlidersHorizontal,
  Users,
  CreditCard,
  HelpCircle,
  Code2,
  Shield,
} from "lucide-react";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { logger } from "@/utils/logger";

const navSections = [
  {
    label: "TRACKING",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Trackers", path: "/trackers", icon: Activity, badge: "trackers" },
      { name: "Collections", path: "/collections", icon: FolderOpen },
      { name: "History", path: "/history", icon: History },
      { name: "Analytics", path: "/analytics", icon: TrendingUp },
    ],
  },
  {
    label: "NOTIFICATIONS",
    items: [
      { name: "Alerts", path: "/alerts", icon: Bell, badge: "alerts" },
      { name: "Integrations", path: "/integrations", icon: Puzzle },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { name: "Profile", path: "/settings?tab=profile", icon: User },
      { name: "Team", path: "/team", icon: Users },
      { name: "Billing", path: "/settings?tab=billing", icon: CreditCard },
      { name: "Preferences", path: "/settings", icon: SlidersHorizontal },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile } = useAuthStore();
  const [activeTrackerCount, setActiveTrackerCount] = useState<number>(0);
  const [alertCount] = useState<number>(12); // mock for now

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "trackers"),
      where("userId", "==", user.uid),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setActiveTrackerCount(snap.size);
      },
      (error) => {
        logger.error({
          service: "firestore",
          event: "sidebar_tracker_count_listener_failed",
          userId: user.uid,
          error,
        });
      }
    );

    return () => unsubscribe();
  }, [user]);

  const isActive = (path: string) => {
    const basePath = path.split("?")[0];
    const isSamePath = pathname === basePath || pathname.startsWith(`${basePath}/`);
    if (!isSamePath) return false;

    if (basePath === "/settings") {
      const pathParams = new URLSearchParams(path.split("?")[1] || "");
      const pathTab = pathParams.get("tab") || "general";
      const currentTab = searchParams.get("tab") || "general";
      return pathTab === currentTab;
    }

    return true;
  };

  const getBadge = (badge?: string) => {
    if (badge === "trackers") return activeTrackerCount > 0 ? activeTrackerCount : null;
    if (badge === "alerts") return alertCount > 0 ? alertCount : null;
    return null;
  };

  return (
    <aside className="fixed top-0 left-0 z-20 hidden h-full w-[220px] flex-col border-r border-border-glass bg-[#0A0A0A] px-3 py-5 md:flex">
      {/* Branding */}
      <div className="mb-6 flex items-center px-2">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary to-accent-purple" />
            <span className="relative text-sm font-extrabold tracking-tighter text-white">T</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">TRAXO</span>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-widest text-foreground-muted">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                const badge = getBadge((item as any).badge);

                return (
                  <Link key={item.path} href={item.path} className="relative block">
                    <div
                      className={`relative z-10 flex h-9 items-center justify-between rounded-lg px-2.5 text-sm font-medium transition-colors duration-200 ${
                        active
                          ? "text-white"
                          : "text-foreground-secondary hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-[13px]">{item.name}</span>
                      </div>

                      {badge !== null && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-accent-purple/20 border border-accent-purple/30 px-1.5 text-[10px] font-semibold text-accent-purple">
                          {badge}
                        </span>
                      )}
                    </div>

                    {active && (
                      <motion.div
                        layoutId="active-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="absolute inset-0 z-0 rounded-lg bg-accent-purple/15 border border-accent-purple/25"
                      >
                        <div className="absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 rounded-r bg-accent-purple" />
                      </motion.div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Plan Usage Footer */}
      <div className="mt-4 space-y-3 rounded-xl border border-border-glass bg-bg-glass p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Pro Plan</span>
          <Link href="/settings?tab=billing" className="text-[11px] font-medium text-accent-purple hover:text-accent-purple/80 transition-colors">
            View Plan
          </Link>
        </div>

        <div className="space-y-2">
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-foreground-secondary">
              <span>Trackers</span>
              <span>28 / 100</span>
            </div>
            <div className="h-1 w-full rounded-full bg-surface-elevated">
              <div className="h-1 w-[28%] rounded-full bg-gradient-to-r from-accent-primary to-accent-purple" />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-foreground-secondary">
              <span>Scans</span>
              <span>12.4K / 50K</span>
            </div>
            <div className="h-1 w-full rounded-full bg-surface-elevated">
              <div className="h-1 w-[25%] rounded-full bg-gradient-to-r from-accent-primary to-accent-purple" />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-foreground-secondary">
              <span>Events</span>
              <span>3.2K / 20K</span>
            </div>
            <div className="h-1 w-full rounded-full bg-surface-elevated">
              <div className="h-1 w-[16%] rounded-full bg-gradient-to-r from-accent-primary to-accent-purple" />
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <Link href="/settings?tab=profile" className="mt-3 flex items-center gap-2.5 rounded-xl p-2 hover:bg-surface transition-colors">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-surface-elevated border border-border-glass">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold gradient-text-primary">
              {profile?.displayName?.[0] ?? "U"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-foreground">{profile?.displayName ?? "User"}</p>
          <p className="truncate text-[10px] text-foreground-muted">{profile?.email ?? ""}</p>
        </div>
      </Link>
    </aside>
  );
}
