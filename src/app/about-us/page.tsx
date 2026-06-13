"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Globe,
  Mail,
  GraduationCap,
  Award,
  Terminal,
  Code,
  Calendar,
  Briefcase,
  Layers,
  Database,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutUsPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Social Links
  const socials = [
    {
      url: "https://alokkumarsahu.in",
      label: "Portfolio",
      icon: (props: any) => <Globe {...props} />,
    },
    {
      url: "https://github.com/alokkumar2510",
      label: "GitHub",
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      ),
    },
    {
      url: "https://www.linkedin.com/in/alok-kumar-sahu-7a7059370/",
      label: "LinkedIn",
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
    },
    {
      url: "https://x.com/alok_chintu",
      label: "X (Twitter)",
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      url: "https://instagram.com/alokkumar.in",
      label: "Instagram",
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
  ];

  // Traxo core systems parameters

  // Traxo Engineering Roadmap
  const roadmap = [
    { phase: "Phase 1 – Core Monitoring Engine", title: "Headless Scraping & Content Hashing", desc: "Built the initial crawler architecture using Playwright Chromium and Cheerio parser. Implemented node-level content normalization, SHA-256 DOM hash comparisons, and compressed Gzip snapshot archiving." },
    { phase: "Phase 2 – Queue & Scheduling", title: "Cloudflare Workers & Edge Queue", desc: "Designed the serverless job worker pipeline. Integrated Cloudflare Queues for batch load distribution, combined with Cloudflare Cron Triggers supporting flexible 30-minute to daily scheduling intervals." },
    { phase: "Phase 3 – Security & Visual Diff", title: "Firebase Enforcements & Image Compare", desc: "Structured Firestore & Storage security rules to validate user ownership. Developed the visual diff comparison engine, taking screenshots, storing them in Firebase Storage, and computing layout shift overlays." },
    { phase: "Phase 4 – Integrations & API", title: "Event Dispatcher & Developer Platform", desc: "Created the autonomous notification dispatcher. Added support for SMTP templates via Resend, Telegram Bot channel integrations, and custom webhook formats with exponential backoffs." },
  ];

  return (
    <div className="bg-[#050505] text-foreground min-h-screen font-sans selection:bg-accent-primary/20 selection:text-accent-primary overflow-x-hidden flex flex-col justify-between relative">
      {/* Background Radial Auroras */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(circle_at_50%_-100px,rgba(59,130,246,0.12),rgba(139,92,246,0.06),transparent_60%)] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-[-200px] h-[500px] w-[500px] bg-accent-cyan/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-accent-primary to-accent-purple p-[1px] shadow-[0_0_20px_rgba(59,130,246,0.25)]">
              <div className="h-full w-full bg-[#050505] rounded-[15px] flex items-center justify-center">
                <Activity className="h-4.5 w-4.5 text-white" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-wider text-white font-mono">TRAXO</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-foreground-secondary">
            <Link href="/features" className="hover:text-white transition-all">Features</Link>
            <Link href="/pricing" className="hover:text-white transition-all">Pricing</Link>
            <Link href="/about-us" className="text-white hover:text-white transition-all">About Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-foreground-secondary hover:text-white transition-colors px-4 py-2">
              Login
            </Link>
            <Button onClick={() => router.push("/register")} className="gradient-bg-primary text-white text-xs font-extrabold uppercase tracking-widest px-5 h-10 rounded-xl">
              Start Tracking Free
            </Button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-foreground-secondary hover:text-white">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-0 w-full bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 py-8 px-6 flex flex-col gap-6 md:hidden z-40"
            >
              <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-foreground-secondary hover:text-white">Features</Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-foreground-secondary hover:text-white">Pricing</Link>
              <Link href="/about-us" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-foreground-secondary hover:text-white">About Us</Link>
              <div className="h-[1px] bg-white/5 my-2" />
              <div className="flex flex-col gap-4">
                <Button onClick={() => { setMobileMenuOpen(false); router.push("/login"); }} variant="outline" className="w-full border-white/10 text-white rounded-xl h-11 text-xs uppercase tracking-widest font-bold">Login</Button>
                <Button onClick={() => { setMobileMenuOpen(false); router.push("/register"); }} className="w-full gradient-bg-primary text-white rounded-xl h-11 text-xs uppercase tracking-widest font-bold">Start Tracking Free</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 md:py-24 space-y-20 z-10 relative">
        {/* Profile Introduction Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
          {/* Left: Picture & Info */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <div className="relative group w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border border-white/10 p-1 bg-gradient-to-tr from-accent-primary to-accent-purple shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-black/40 mix-blend-overlay z-10" />
              <img
                src="/founder.png"
                alt="Alok Kumar Sahu"
                className="w-full h-full object-cover rounded-[22px] transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="space-y-2.5">
              <h1 className="text-2xl font-extrabold text-white">Alok Kumar Sahu</h1>
              <p className="text-xs font-mono font-bold text-accent-primary uppercase tracking-widest">Founder & Developer, Traxo</p>

              <div className="flex items-center justify-center lg:justify-start gap-3.5 text-foreground-secondary pt-2">
                {socials.map((soc, idx) => {
                  const IconComp = soc.icon;
                  return (
                    <a
                      key={idx}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors p-1"
                      title={soc.label}
                    >
                      <IconComp className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Narrative / Bio */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/20 bg-accent-primary/5 px-4.5 py-1.5 text-xs text-accent-primary font-bold uppercase tracking-wider">
              <Terminal className="h-3.5 w-3.5" />
              <span>Developer Statement</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl leading-tight">
              Building Scalable Web Experiences & Exploring AI
            </h2>
            <p className="text-sm text-foreground-secondary leading-relaxed">
              I am a B.Tech Computer Science student at Veer Surendra Sai University of Technology. I approach software engineering not just as code execution, but as product building — ensuring high-end responsiveness, scalable databases, and contextual AI capabilities.
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono border-t border-white/5 pt-6 text-foreground-secondary">
              <div>
                <p className="text-foreground-muted">EDUCATION</p>
                <p className="text-white font-bold mt-1">B.Tech in CSE</p>
                <p className="text-[10px]">VSSUT, Burla (2024 – 2028)</p>
              </div>
              <div>
                <p className="text-foreground-muted">LOCATION</p>
                <p className="text-white font-bold mt-1">Odisha, India</p>
                <p className="text-[10px]">Berhampur / Burla</p>
              </div>
              <div>
                <p className="text-foreground-muted">EMAIL CONTACT</p>
                <p className="text-white font-bold mt-1">alok.vssut28@gmail.com</p>
              </div>
              <div>
                <p className="text-foreground-muted">RECOGNITIONS</p>
                <p className="text-white font-bold mt-1">GCP Arcade Champion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Traxo Core Philosophy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto border-t border-white/5 pt-16">
          <div className="space-y-3 text-left">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Code className="h-4.5 w-4.5 text-accent-primary" /> Edge-First Scale
            </h4>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Designed from the ground up for serverless computing. Traxo distributes target crawls using Cloudflare Workers at the edge, ensuring zero idle server costs, infinite horizontal scaling, and ultra-low latency execution.
            </p>
          </div>
          <div className="space-y-3 text-left">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="h-4.5 w-4.5 text-accent-purple" /> Actionable Insights
            </h4>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Traditional monitoring merely detects page change hashes. Traxo parses DOM trees and utilizes text-similarity algorithms to deliver exact diff summaries, price fluctuation maps, and parsed career openings.
            </p>
          </div>
          <div className="space-y-3 text-left">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-accent-cyan" /> Robust Anti-Bot Bypassing
            </h4>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Equipped with randomized user-agent profiles, rotating residential proxies, and human-like interaction simulations. Traxo bypasses complex Cloudflare, Turnstile, and CAPTCHA blockades.
            </p>
          </div>
        </div>

        {/* Traxo Core Architecture Section */}
        <div className="space-y-10 max-w-5xl mx-auto pt-8 border-t border-white/5">
          <h3 className="text-2xl font-bold text-white text-center">Traxo Architecture & Systems</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* System 1: Crawler core */}
            <div className="glass-card rounded-2xl p-6.5 flex flex-col justify-between gap-4 text-left">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center">
                  <Globe className="h-5.5 w-5.5" />
                </div>
                <h4 className="text-base font-bold text-white">Edge Scraper Core</h4>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  Integrates Cheerio for high-speed DOM structure parsing and headless Playwright Chromium configurations to render complex Javascript-heavy Single Page Applications (SPAs) dynamically.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-accent-primary uppercase">Multi-Engine Crawling</span>
            </div>

            {/* System 2: Storage Compression */}
            <div className="glass-card rounded-2xl p-6.5 flex flex-col justify-between gap-4 text-left">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple flex items-center justify-center">
                  <Database className="h-5.5 w-5.5" />
                </div>
                <h4 className="text-base font-bold text-white">Snapshot Compression</h4>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  Computes SHA-256 hashes of DOM nodes to detect variations. HTML snapshots are compressed using Gzip encoding before storage writes to achieve 70% space efficiency.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-accent-purple uppercase">Storage Optimization</span>
            </div>

            {/* System 3: Visual Diff */}
            <div className="glass-card rounded-2xl p-6.5 flex flex-col justify-between gap-4 text-left">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan flex items-center justify-center">
                  <Layers className="h-5.5 w-5.5" />
                </div>
                <h4 className="text-base font-bold text-white">Visual Comparison</h4>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  Automatically aligns pages with height fluctuations, pads mismatched screenshot sizes, and overlays a pixel-by-pixel red visual highlight map measuring exact change percentages.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-accent-cyan uppercase">Visual Diff Engine</span>
            </div>
          </div>
        </div>

        {/* Dispatch Pipeline */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-[#0F0F10]/40 p-8 flex flex-col md:flex-row items-center gap-8 pt-8">
          <div className="space-y-4 md:w-3/5 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/5 px-3 py-1 text-[10px] text-success font-bold uppercase tracking-wider">
              <Webhook className="h-3.5 w-3.5" />
              <span>Real-Time Integrations</span>
            </div>
            <h3 className="text-xl font-bold text-white">Autonomous Event Notification Dispatch</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Once content changes pass through custom selector masks, price change thresholds, or job keyword filters, events are queued for execution. The dispatcher resolves template renders and broadcasts to Telegram Bot APIs, SMTP digest services, or custom authenticated webhooks with exponential retry backoffs.
            </p>
          </div>
          <div className="md:w-2/5 p-5 bg-black/50 border border-white/5 rounded-2xl font-mono text-[10px] text-foreground-secondary space-y-2 text-left w-full">
            <p className="text-success font-bold">// WEBHOOK DATA SPEC</p>
            <p className="text-foreground-muted">{`{`}</p>
            <p className="pl-4">&quot;event&quot;: &quot;tracker.change&quot;,</p>
            <p className="pl-4">&quot;tracker&quot;: &quot;Google Careers&quot;,</p>
            <p className="pl-4">&quot;diff&quot;: &quot;+ 1 Internship Posted&quot;,</p>
            <p className="pl-4">&quot;mismatch&quot;: &quot;8.4%&quot;</p>
            <p className="text-foreground-muted">{`}`}</p>
          </div>
        </div>

        {/* Timeline Roadmap */}
        <div className="space-y-10 max-w-3xl mx-auto pt-8">
          <h3 className="text-2xl font-bold text-white text-center">Traxo Roadmap & Milestone History</h3>
          <div className="relative border-l border-white/5 pl-6 ml-2 space-y-8">
            {roadmap.map((item, idx) => (
              <div key={idx} className="relative">
                {/* Pulsing timeline dot */}
                <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-accent-primary border-2 border-background flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-accent-primary animate-pulse" />
                </span>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold font-mono text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 px-2 py-0.5 rounded-full">
                    {item.phase}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1.5">{item.title}</h4>
                  <p className="text-xs text-foreground-secondary leading-relaxed text-left">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#050505] z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white font-mono">TRAXO</span>
          </div>

          <p className="text-xs text-foreground-muted">
            &copy; {new Date().getFullYear()} Traxo Inc. Made with love by{" "}
            <a href="https://alokkumarsahu.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline font-bold">
              ALOK KUMAR SAHU
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
