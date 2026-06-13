"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Briefcase,
  DollarSign,
  FileText,
  Layers,
  Webhook,
  Activity,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Check,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeaturesPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const detailedFeatures = [
    {
      icon: Globe,
      title: "Website Content Crawling",
      subtitle: "Dynamic change verification on the edge",
      description: "Our crawler normalizes spacing, removes script pollution, and runs SHA-256 validation checks. Ideal for static documentation, corporate news, and release schedules.",
      bullets: ["Character-by-character diff mapping", "Custom user-agent profiles", "Playwright headless browser execution", "Automated proxy rotations"],
      color: "text-accent-primary border-accent-primary/20 bg-accent-primary/5",
    },
    {
      icon: Briefcase,
      title: "Job Board Scanner",
      subtitle: "Never miss hiring waves",
      description: "Map job listing anchors on corporate directories. Provide target keyword filters like 'Software Engineer' or 'Frontend' to bypass page updates that are not relevant to your query.",
      bullets: ["Remote/Hybrid location filters", "Minimum experience constraints", "Scrapes direct career websites", "Saves baseline role logs"],
      color: "text-accent-purple border-accent-purple/20 bg-accent-purple/5",
    },
    {
      icon: DollarSign,
      title: "Price Monitor",
      subtitle: "Buy at optimal prices",
      description: "Identify numeric fields inside target DOM structures. Maintain price maps to record lowest/highest values and send immediate warnings when cost thresholds drop.",
      bullets: ["Dynamic currency parsing", "Detailed value drop charts", "Lowest price alerts", "Multi-region retail tracking"],
      color: "text-accent-cyan border-accent-cyan/20 bg-accent-cyan/5",
    },
    {
      icon: FileText,
      title: "PDF Hashing",
      subtitle: "Verify binary document updates",
      description: "Download document buffers to execute byte-level matches. Avoid missing syllabus updates, exam results, or governmental policy announcements.",
      bullets: ["Byte-by-byte SHA-256 validation", "Alerts when document name matches pattern", "Caches previous baseline drafts", "Supports large notice portals"],
      color: "text-success border-success/20 bg-success/5",
    },
    {
      icon: Layers,
      title: "Section Tracking",
      subtitle: "Granular selector coordinates",
      description: "Provide exact CSS selectors (IDs or classes) to monitor specific panels, notice boards, or headers. Exclude random date tags that fire fake alerts.",
      bullets: ["Targeted Cheerio parsing", "Blocks ads, footers, and scripts", "Multiple sections per tracker support", "Optimized crawling latency"],
      color: "text-accent-primary border-accent-primary/20 bg-accent-primary/5",
    },
    {
      icon: Webhook,
      title: "Developer Integrations",
      subtitle: "JSON logs into your own stack",
      description: "Generate API tokens to retrieve tracking datasets in JSON formats, or route event dispatches to Slack, Discord, or generic webhook URLs with retries.",
      bullets: ["x-api-key authentication", "Discord embeds & Slack blocks native JSON", "3-stage exponential retry backoff", "Live request metrics logs"],
      color: "text-accent-purple border-accent-purple/20 bg-accent-purple/5",
    },
  ];

  return (
    <div className="bg-[#050505] text-foreground min-h-screen font-sans selection:bg-accent-primary/20 selection:text-accent-primary overflow-x-hidden flex flex-col justify-between relative">
      {/* Background Radial Auroras */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(circle_at_50%_-100px,rgba(6,182,212,0.12),rgba(59,130,246,0.06),transparent_60%)] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-[-200px] h-[500px] w-[500px] bg-accent-purple/5 rounded-full blur-[140px] pointer-events-none z-0" />

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
            <Link href="/features" className="text-white hover:text-white transition-all">Features</Link>
            <Link href="/pricing" className="hover:text-white transition-all">Pricing</Link>
            <Link href="/about-us" className="hover:text-white transition-all">About Us</Link>
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
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 md:py-24 space-y-16 z-10 relative">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-purple/20 bg-accent-purple/5 px-4.5 py-1.5 text-xs text-accent-purple font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Crawler Engine Specs</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Features Catalog
          </h1>
          <p className="text-sm text-foreground-secondary">
            Explore the advanced capabilities under the hood of our change detection and notification platform.
          </p>
        </div>

        {/* Detailed Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto pt-8">
          {detailedFeatures.map((feat, idx) => {
            const IconComp = feat.icon;
            return (
              <div key={idx} className="glass-card rounded-3xl p-8 relative overflow-hidden group flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border shadow-md ${feat.color}`}>
                    <IconComp className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{feat.title}</h3>
                    <p className="text-xs text-foreground-muted font-semibold mt-0.5">{feat.subtitle}</p>
                  </div>
                  <p className="text-xs text-foreground-secondary leading-relaxed">{feat.description}</p>
                </div>
                <ul className="space-y-2 border-t border-white/5 pt-4 text-xs text-foreground-secondary">
                  {feat.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* SSRF & anti-bot info block */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-[#0F0F10]/40 p-8 flex flex-col md:flex-row items-center gap-8 pt-16">
          <div className="space-y-4 md:w-3/5">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/5 px-3 py-1 text-[10px] text-success font-bold uppercase tracking-wider">
              <Terminal className="h-3.5 w-3.5" />
              <span>Production Sanitation</span>
            </div>
            <h3 className="text-xl font-bold text-white">SSRF network sanitation and domain protections</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              We apply strict hostname restrictions. Our scraper blocks dynamic lookups targeting private subnets, loopbacks, or local metadata directories, ensuring a secure production environment.
            </p>
          </div>
          <div className="md:w-2/5 p-4 bg-black/50 border border-white/5 rounded-2xl font-mono text-[10px] text-foreground-secondary space-y-2">
            <p className="text-error font-bold">// BLOCKED IP RANGES</p>
            <p className="pl-4">&bull; Loopbacks: 127.0.0.0/8</p>
            <p className="pl-4">&bull; Private: 10.0.0.0/8, 192.168.0.0/16</p>
            <p className="pl-4">&bull; Cloud Instance Metadata: 169.254.169.254</p>
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
