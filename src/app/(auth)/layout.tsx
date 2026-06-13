"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12 overflow-hidden selection:bg-accent-primary/20 selection:text-accent-primary">
      {/* Background Aurora / Gradient Orbs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Blue Orb */}
        <motion.div
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-accent-primary/4 blur-[130px]"
        />

        {/* Purple Orb */}
        <motion.div
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 70, -50, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-[15%] -right-[10%] h-[600px] w-[600px] rounded-full bg-accent-purple/4 blur-[140px]"
        />

        {/* Cyan Orb */}
        <motion.div
          animate={{
            x: [0, 40, -50, 0],
            y: [0, 30, 40, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[30%] right-[10%] h-[400px] w-[400px] rounded-full bg-accent-cyan/3 blur-[120px]"
        />
      </div>

      {/* Auth Shell */}
      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        {/* Header Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8 flex flex-col items-center gap-2"
        >
          <Link href="/" className="group flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-xl bg-surface border border-border-glass flex items-center justify-center overflow-hidden shadow-glow transition-all duration-300 group-hover:scale-105 group-hover:border-accent-primary/40">
              <span className="text-xl font-extrabold tracking-tighter gradient-text-primary">T</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-accent-primary/10 to-accent-purple/10 mix-blend-overlay" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground group-hover:text-foreground-secondary transition-colors duration-200">
              Traxo
            </span>
          </Link>
          <p className="text-xs font-mono text-foreground-muted tracking-widest uppercase">
            Intelligent Website Watchtower
          </p>
        </motion.div>

        {/* Card Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="w-full rounded-2xl glass-card bg-bg-glass p-8 md:p-10 shadow-medium relative overflow-hidden"
        >
          {/* Subtle neon highlight orb inside the card top */}
          <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 w-[180px] h-[60px] bg-accent-primary/10 rounded-full blur-[30px]" />
          
          {children}
        </motion.div>

        {/* Footer info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center text-xs text-foreground-muted font-sans"
        >
          Secured by Firebase &bull; Deployment via Cloudflare Pages
        </motion.p>
      </div>
    </div>
  );
}
