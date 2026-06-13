"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Activity, FolderOpen, History, Settings } from "lucide-react";

const mobileItems = [
  { name: "Dash", path: "/dashboard", icon: LayoutDashboard },
  { name: "Trackers", path: "/trackers", icon: Activity },
  { name: "Folders", path: "/collections", icon: FolderOpen },
  { name: "History", path: "/history", icon: History },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-20 flex h-[68px] w-full items-center justify-around border-t border-border-glass bg-background/80 backdrop-blur-xl px-2 pb-2 md:hidden">
      {mobileItems.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            href={item.path}
            className="relative flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl text-center outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            <Icon
              className={`h-5 w-5 transition-colors duration-200 ${
                isActive ? "text-accent-primary" : "text-foreground-secondary"
              }`}
            />
            <span
              className={`text-[9px] font-medium transition-colors duration-200 ${
                isActive ? "text-foreground font-semibold" : "text-foreground-muted"
              }`}
            >
              {item.name}
            </span>

            {/* Glowing Active Dot */}
            {isActive && (
              <motion.div
                layoutId="mobile-nav-dot"
                className="absolute -bottom-1 h-1 w-1 rounded-full bg-accent-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
