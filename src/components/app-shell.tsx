"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden selection:bg-accent-primary/20 selection:text-accent-primary">
      {/* Background Aurora / Gradient Orbs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Blue Orb */}
        <motion.div
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -50, 40, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[10%] left-[20%] h-[600px] w-[600px] rounded-full bg-accent-primary/3 blur-[140px]"
        />

        {/* Purple Orb */}
        <motion.div
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 60, -40, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[20%] left-[10%] h-[500px] w-[500px] rounded-full bg-accent-purple/3 blur-[130px]"
        />
      </div>

      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Main Grid Wrapper */}
      <div className="flex flex-col min-h-screen md:pl-[280px] relative z-10">
        {/* Sticky Header */}
        <Header />

        {/* Dynamic Route Content with Premium transitions */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-[1440px] w-full mx-auto pb-[92px] md:pb-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <MobileNav />
    </div>
  );
}
