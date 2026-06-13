"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/authStore";
import { logger } from "@/utils/logger";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Trackers", path: "/trackers", icon: Activity },
  { name: "Collections", path: "/collections", icon: FolderOpen },
  { name: "Analytics", path: "/analytics", icon: TrendingUp },
  { name: "History log", path: "/history", icon: History },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [activeCount, setActiveCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for active tracker count to display on badge
    const q = query(
      collection(db, "trackers"),
      where("userId", "==", user.uid),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setActiveCount(snap.size);
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

  return (
    <aside className="fixed top-0 left-0 z-20 hidden h-full w-[280px] flex-col border-r border-border-glass bg-background px-4 py-6 md:flex">
      {/* Branding */}
      <div className="mb-8 flex items-center px-2">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-surface border border-border-glass flex items-center justify-center overflow-hidden shadow-glow">
            <span className="text-base font-extrabold tracking-tighter gradient-text-primary">T</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-accent-primary/10 to-accent-purple/10 mix-blend-overlay" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Traxo</span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path} className="relative block">
              <div
                className={`relative z-10 flex h-11 items-center justify-between rounded-xl px-3 text-sm font-medium transition-colors duration-300 ${
                  isActive ? "text-white" : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 3, scale: 1.05 }}
                    className="flex h-5 w-5 items-center justify-center"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </motion.div>
                  <span>{item.name}</span>
                </div>

                {item.name === "Trackers" && activeCount > 0 && (
                  <span className="rounded-md bg-accent-primary/10 border border-accent-primary/25 px-2 py-0.5 text-[10px] font-mono font-semibold text-accent-primary">
                    {activeCount}
                  </span>
                )}
              </div>

              {/* Animated Gradient Active Pill */}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                  className="absolute inset-0 z-0 rounded-xl bg-gradient-to-r from-accent-primary/10 to-accent-purple/5 border border-accent-primary/20"
                >
                  <div className="absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 rounded-r-md bg-accent-primary" />
                </motion.div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer/System status */}
      <div className="mt-auto rounded-2xl border border-border-glass bg-bg-glass p-4 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -bottom-10 -right-10 h-20 w-20 rounded-full bg-success/10 blur-xl" />
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 border border-success/35 text-success">
            <ShieldCheck className="h-4 w-4 pulse-success rounded-full" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Shield active</p>
            <p className="text-[10px] text-foreground-secondary">Systems operational</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
