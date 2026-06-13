"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Activity,
  Layers,
  Sparkles,
  Zap,
  Globe,
  DollarSign,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Check,
  ArrowRight,
  ChevronRight,
  Terminal,
  MessageSquare,
  FileText,
  Search,
  Sliders,
  Bell,
  Cpu,
  Webhook,
  ExternalLink,
  Plus,
  Play,
  Menu,
  X,
  ChevronDown,
  Database,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ----------------------------------------------------------------------
// CountUp Component
// ----------------------------------------------------------------------
function CountUp({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = end / (duration * 60);
    const handle = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(handle);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(handle);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export default function HomePage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor scroll for glass navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 1. Live Event Ticker State (Hero Section)
  const tickerEvents = [
    { id: 1, site: "Google Careers", change: "New Internship Posted", time: "Just now", type: "job", color: "text-accent-primary border-accent-primary/20 bg-accent-primary/5" },
    { id: 2, site: "Amazon India", change: "Price Dropped ₹5,000", time: "2m ago", type: "price", color: "text-success border-success/20 bg-success/5" },
    { id: 3, site: "VSSUT Portal", change: "New Semester Schedule Added", time: "5m ago", type: "notice", color: "text-accent-purple border-accent-purple/20 bg-accent-purple/5" },
    { id: 4, site: "Apple Newsroom", change: "M4 MacBook Pro Announced", time: "12m ago", type: "website", color: "text-accent-cyan border-accent-cyan/20 bg-accent-cyan/5" },
    { id: 5, site: "Y Combinator", change: "S26 Batch Applications Opened", time: "18m ago", type: "job", color: "text-accent-primary border-accent-primary/20 bg-accent-primary/5" },
    { id: 6, site: "Nvidia Developer", change: "CUDA v13.2 Documentation Updated", time: "24m ago", type: "pdf", color: "text-success border-success/20 bg-success/5" },
  ];

  const [activeTickerEvents, setActiveTickerEvents] = useState(tickerEvents.slice(0, 3));

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTickerEvents((prev) => {
        const nextIndex = (tickerEvents.findIndex(e => e.id === prev[0].id) + 1) % tickerEvents.length;
        const newEvents = [];
        for (let i = 0; i < 3; i++) {
          newEvents.push(tickerEvents[(nextIndex + i) % tickerEvents.length]);
        }
        return newEvents;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // 2. Interactive Simulator State (How It Works)
  const [simulatorUrl, setSimulatorUrl] = useState("https://stripe.com/pricing");
  const [simulatorStep, setSimulatorStep] = useState(0); // 0: Idle, 1: Connecting, 2: Inspecting, 3: Completed
  const [simAlertMsg, setSimAlertMsg] = useState("");

  const runSimulator = () => {
    if (!simulatorUrl) return;
    setSimulatorStep(1);
    setTimeout(() => {
      setSimulatorStep(2);
      setTimeout(() => {
        setSimulatorStep(3);
        setSimAlertMsg(`[Traxo Engine] Scanned ${new URL(simulatorUrl).hostname}. Saved baseline snapshot. Monitoring at 30m intervals.`);
      }, 2000);
    }, 1500);
  };

  // 3. Interactive Visual Diff Slider State (Dashboard Showcase)
  const [diffSliderPos, setDiffSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDiffMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setDiffSliderPos(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleDiffMove(e.touches[0].clientX);
    }
  };

  // 4. Dashboard Active Tab
  const [activeDashTab, setActiveDashTab] = useState<"diff" | "analytics" | "logs">("diff");

  // 5. FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqData = [
    {
      q: "How does Traxo bypass Cloudflare or CAPTCHA scraping blockades?",
      a: "Traxo integrates Playwright dynamic Chromium browser instances running rotating residential proxies, randomized user-agent profiles, and realistic mouse gesture simulations to successfully bypass advanced anti-bot protections.",
    },
    {
      q: "Can I monitor specific elements of a page instead of the entire page?",
      a: "Yes. Using Section Tracking, you can provide target CSS selectors (like `#notice-board` or `.price-tag`) to scan only what matters, eliminating false positive alerts from random sidebar ads or footer links.",
    },
    {
      q: "How fast can Traxo scan my target webpages?",
      a: "Depending on your plan, Traxo scans at 30-minute, hourly, or daily intervals. Enterprise plans can trigger Priority Crawls via our Cloudflare Edge Workers scheduler.",
    },
    {
      q: "Does Traxo support custom authentication or pages behind logins?",
      a: "We support public web scraping, PDF document hashing, price tables, and job lists. Pages requiring active session tokens or OAuth logins can be configured via Enterprise API custom script injectors.",
    },
    {
      q: "What notification channels are currently integrated?",
      a: "Out of the box, we support real-time Email alerts via Resend, Telegram Bot channel push integrations, and custom Slack/Discord Webhooks containing structured JSON payloads.",
    },
  ];

  return (
    <div className="bg-[#050505] text-foreground min-h-screen font-sans selection:bg-accent-primary/20 selection:text-accent-primary overflow-x-hidden flex flex-col justify-between relative">
      {/* Background Radial Auroras */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(circle_at_50%_-100px,rgba(59,130,246,0.15),rgba(139,92,246,0.08),transparent_60%)] pointer-events-none z-0" />
      <div className="absolute top-[1200px] left-[-200px] h-[500px] w-[500px] bg-accent-cyan/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[2000px] right-[-200px] h-[600px] w-[600px] bg-accent-purple/5 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* 1. Header Navigation */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-white/5 bg-black/40 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-accent-primary to-accent-purple p-[1px] shadow-[0_0_20px_rgba(59,130,246,0.25)]">
              <div className="h-full w-full bg-[#050505] rounded-[15px] flex items-center justify-center">
                <Activity className="h-4.5 w-4.5 text-white" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-wider text-white font-mono">TRAXO</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-foreground-secondary">
            <Link href="/features" className="hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.05)] transition-all">Features</Link>
            <a href="/#how-it-works" className="hover:text-white transition-all">How it works</a>
            <a href="/#dashboard-preview" className="hover:text-white transition-all">Interactive Demo</a>
            <Link href="/pricing" className="hover:text-white transition-all">Pricing</Link>
            <Link href="/about-us" className="hover:text-white transition-all">About Us</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-bold uppercase tracking-widest text-foreground-secondary hover:text-white transition-colors px-4 py-2"
            >
              Login
            </Link>
            <Button
              onClick={() => router.push("/register")}
              className="gradient-bg-primary hover:shadow-[0_0_25px_rgba(59,130,246,0.45)] text-white text-xs font-extrabold uppercase tracking-widest px-5 h-10 rounded-xl transition-all"
            >
              Start Tracking Free
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground-secondary hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-20 left-0 w-full bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 py-8 px-6 flex flex-col gap-6 md:hidden z-40"
            >
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold uppercase tracking-wider text-foreground-secondary hover:text-white"
              >
                Features
              </Link>
              <a
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold uppercase tracking-wider text-foreground-secondary hover:text-white"
              >
                How It Works
              </a>
              <a
                href="/#dashboard-preview"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold uppercase tracking-wider text-foreground-secondary hover:text-white"
              >
                Interactive Demo
              </a>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold uppercase tracking-wider text-foreground-secondary hover:text-white"
              >
                Pricing
              </Link>
              <Link
                href="/about-us"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold uppercase tracking-wider text-foreground-secondary hover:text-white"
              >
                About Us
              </Link>
              <div className="h-[1px] bg-white/5 my-2" />
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/login");
                  }}
                  variant="outline"
                  className="w-full border-white/10 text-white rounded-xl h-11 text-xs uppercase tracking-widest font-bold"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/register");
                  }}
                  className="w-full gradient-bg-primary text-white rounded-xl h-11 text-xs uppercase tracking-widest font-bold"
                >
                  Start Tracking Free
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-28 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        {/* Hero Left Content */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-accent-primary/20 bg-accent-primary/5 px-4.5 py-1.5 text-xs text-accent-primary font-bold uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Web Scraping Engine v1.0</span>
          </motion.div>

          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl leading-[1.05]"
            >
              Never Miss <br />
              <span className="gradient-text-primary">What Matters.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-foreground-secondary max-w-xl leading-relaxed"
            >
              Track websites, career portals, product prices, PDF notices, and DOM sections automatically.
              Create trackers once. Traxo watches everything for you.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <Button
              onClick={() => router.push("/register")}
              className="gradient-bg-primary hover:shadow-[0_0_30px_rgba(59,130,246,0.45)] text-white px-7 h-13 text-xs uppercase tracking-widest font-extrabold rounded-xl transition-all"
            >
              Start Tracking Free
            </Button>
            <a
              href="#dashboard-preview"
              className="h-13 px-7 rounded-xl border border-white/10 bg-white/[0.02] text-xs uppercase tracking-widest font-extrabold flex items-center justify-center hover:bg-white/[0.06] transition-all text-white"
            >
              Watch Demo
            </a>
          </motion.div>
        </div>

        {/* Hero Right Content: Live Event Ticker */}
        <div className="lg:col-span-5 relative w-full flex justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-primary/10 to-accent-purple/10 rounded-3xl blur-[80px] -z-10 pointer-events-none" />
          
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0F0F10]/60 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
            {/* Console Head */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-accent-primary/20 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-accent-primary animate-pulse" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary font-mono">Live Monitoring Stream</span>
              </div>
              <span className="text-[10px] font-mono text-foreground-muted uppercase">Active</span>
            </div>

            {/* Event List */}
            <div className="space-y-3 relative.min-h-[260px]">
              <AnimatePresence mode="popLayout">
                {activeTickerEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="p-4.5 rounded-2xl border border-white/5 bg-white/[0.01] flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${event.color}`}>
                        {event.type}
                      </span>
                      <h4 className="text-sm font-bold text-white leading-snug">{event.site}</h4>
                      <p className="text-xs text-foreground-secondary">{event.change}</p>
                    </div>
                    <span className="text-[10px] text-foreground-muted font-mono whitespace-nowrap shrink-0">{event.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Social Proof Section */}
      <section className="border-y border-white/5 bg-white/[0.01] relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 text-center">
          <div className="space-y-2">
            <h3 className="text-4xl sm:text-5xl font-extrabold text-white font-mono">
              <CountUp end={10000} />+
            </h3>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">Tracked Websites</p>
          </div>
          <div className="space-y-2 border-y md:border-y-0 md:border-x border-white/5 py-8 md:py-0">
            <h3 className="text-4xl sm:text-5xl font-extrabold text-white font-mono">
              <CountUp end={500000} />+
            </h3>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">Changes Detected</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl sm:text-5xl font-extrabold text-white font-mono">
              99.9%
            </h3>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">Monitoring Accuracy</p>
          </div>
        </div>
      </section>

      {/* 4. Feature Showcase */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 md:py-32 space-y-16 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-purple/20 bg-accent-purple/5 px-4.5 py-1.5 text-xs text-accent-purple font-bold uppercase tracking-wider">
            <Sliders className="h-3.5 w-3.5" />
            <span>Versatile Crawler Utilities</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Intelligent Crawling Capabilities
          </h2>
          <p className="text-sm text-foreground-secondary">
            Traxo goes beyond static regex matching. Our parser supports dynamic script evaluations, binary hashing, and layout filters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Website Tracking */}
          <div className="glass-card rounded-3xl p-6.5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="h-12 w-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Globe className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Website Monitoring</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Track text shifts, structure updates, and layout changes. Receive clean diff reports with removed and added sentences mapped side-by-side.
            </p>
          </div>

          {/* Card 2: Job Tracking */}
          <div className="glass-card rounded-3xl p-6.5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="h-12 w-12 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <Briefcase className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Job Board Tracking</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Monitor top corporate career sites. Add filters like &quot;Software Engineer&quot;, &quot;Remote&quot;, or &quot;Internship&quot; to scrap listings without site pollution.
            </p>
          </div>

          {/* Card 3: Price Monitoring */}
          <div className="glass-card rounded-3xl p-6.5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="h-12 w-12 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(6_182_212,0.1)]">
              <DollarSign className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Price Drop Alerts</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Scrape price tags automatically on e-commerce platforms. Traxo maps value reductions, stores history charts, and flags lowest prices.
            </p>
          </div>

          {/* Card 4: PDF Monitoring */}
          <div className="glass-card rounded-3xl p-6.5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="h-12 w-12 rounded-2xl bg-success/10 border border-success/20 text-success flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(34,197,150,0.1)]">
              <FileText className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">PDF & Document Hashing</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Download and verify binary buffers on the edge. Perfect for checking class timetables, result notices, and governmental policy changes.
            </p>
          </div>

          {/* Card 5: Section Selection */}
          <div className="glass-card rounded-3xl p-6.5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="h-12 w-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Layers className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Granular Section Selection</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Define precise CSS targets to focus scans. Exclude header navigation menus, date badges, or user commentaries that trigger fake alerts.
            </p>
          </div>

          {/* Card 6: Developer Integrations */}
          <div className="glass-card rounded-3xl p-6.5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="h-12 w-12 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <Webhook className="h-5.5 w-5.5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Webhooks & API platform</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Dispatch change reports directly to Slack, Discord, or generic URLs. Key-authenticated queries fetch all tracking datasets in JSON.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Interactive How It Works Section */}
      <section id="how-it-works" className="border-t border-white/5 bg-white/[0.005] py-20 md:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* How It Works Left Text */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 px-4.5 py-1.5 text-xs text-accent-cyan font-bold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5" />
              <span>Edge-First Workflow</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Paste. Scan. <br />
              Receive Updates.
            </h2>
            <p className="text-sm text-foreground-secondary leading-relaxed">
              Traxo simplifies scraping down to a single click. No server configurations, script coding, or proxy monitoring required.
            </p>

            {/* Step list */}
            <div className="space-y-4 pt-2">
              <div className="flex gap-4 items-start">
                <span className="h-7 w-7 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-bold font-mono flex items-center justify-center shrink-0">1</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Input Target URL</h4>
                  <p className="text-xs text-foreground-secondary">Paste any website, career portal, or product link.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="h-7 w-7 rounded-lg bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-xs font-bold font-mono flex items-center justify-center shrink-0">2</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Traxo Automation Commences</h4>
                  <p className="text-xs text-foreground-secondary">Headless browsers navigate, parse elements, and verify diff hashes.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="h-7 w-7 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-bold font-mono flex items-center justify-center shrink-0">3</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Notification Alert Fired</h4>
                  <p className="text-xs text-foreground-secondary">Get detailed diffs on Telegram, Slack, or Email channels.</p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Right: Scan Simulator */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0F0F10] p-6 shadow-2xl space-y-6">
              {/* Simulator Input UI */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-foreground-secondary">Test the scanner simulator</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simulatorUrl}
                    onChange={(e) => setSimulatorUrl(e.target.value)}
                    disabled={simulatorStep > 0 && simulatorStep < 3}
                    className="flex-grow bg-white/[0.02] border border-white/10 rounded-xl px-4 h-12 text-xs font-mono text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                    placeholder="https://example.com/item"
                  />
                  <Button
                    onClick={runSimulator}
                    disabled={simulatorStep > 0 && simulatorStep < 3}
                    className="gradient-bg-primary text-white text-xs font-bold px-6 h-12 rounded-xl uppercase tracking-wider"
                  >
                    {simulatorStep === 0 ? "Scan URL" : simulatorStep === 3 ? "Re-Scan" : "Scanning..."}
                  </Button>
                </div>
              </div>

              {/* Simulator Display Screen */}
              <div className="rounded-2xl border border-white/5 bg-[#050505] p-5.5 min-h-[180px] flex flex-col justify-center items-center relative overflow-hidden font-mono text-xs">
                {simulatorStep === 0 && (
                  <div className="text-center space-y-2 text-foreground-muted">
                    <Terminal className="h-8 w-8 mx-auto stroke-1" />
                    <p className="text-[11px]">Paste a website link and click scan to test crawler logic.</p>
                  </div>
                )}

                {simulatorStep === 1 && (
                  <div className="space-y-3 text-center">
                    <div className="h-6 w-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-accent-primary font-bold text-[11px] animate-pulse">CONNECTING TO HOST & ROTATING PROXIES...</p>
                  </div>
                )}

                {simulatorStep === 2 && (
                  <div className="w-full space-y-3">
                    <p className="text-accent-purple font-bold text-[11px] animate-pulse">PARSING DOM STRUCTURE & ANALYZING CONTENT...</p>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.8 }}
                        className="bg-accent-purple h-full"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 opacity-35">
                      <div className="h-8 bg-white/10 rounded" />
                      <div className="h-8 bg-white/10 rounded border border-accent-purple border-dashed" />
                      <div className="h-8 bg-white/10 rounded" />
                    </div>
                  </div>
                )}

                {simulatorStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full space-y-4"
                  >
                    <div className="flex items-center gap-2 text-success font-bold">
                      <span className="h-2 w-2 rounded-full bg-success animate-ping" />
                      <span>BASELINE SNAPSHOT CREATED SUCCESSFULLY</span>
                    </div>
                    <p className="text-foreground-secondary text-[11px] leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      {simAlertMsg}
                    </p>
                    <div className="rounded-xl border border-white/10 bg-white/[0.01] p-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="h-4.5 w-4.5 text-accent-cyan" />
                        <div>
                          <p className="text-[10px] font-bold text-white">TELEGRAM NOTIFICATION LOG</p>
                          <p className="text-[9px] text-foreground-secondary">Alert dispatcher connected</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-success border border-success/20 bg-success/5 px-2 py-0.5 rounded-full">ACTIVE</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Dashboard Showcase */}
      <section id="dashboard-preview" className="max-w-7xl mx-auto px-6 py-20 md:py-32 space-y-12 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 px-4.5 py-1.5 text-xs text-accent-cyan font-bold uppercase tracking-wider">
            <Sliders className="h-3.5 w-3.5" />
            <span>Interactive Console Mockup</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            The Luxury Control Center
          </h2>
          <p className="text-sm text-foreground-secondary">
            Experience the design patterns of our tracking workspace, featuring visual diff side-by-side, area trends, and live alert tickers.
          </p>
        </div>

        {/* Console Container */}
        <div className="rounded-3xl border border-white/10 bg-[#0F0F10] shadow-2xl overflow-hidden max-w-5xl mx-auto">
          {/* Console Header / Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-white/5 px-6 py-4 bg-black/30 gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
              <span className="ml-3 text-xs font-mono font-bold text-white tracking-wider">WORKSPACE PREVIEW</span>
            </div>

            <div className="flex rounded-xl bg-[#050505] p-1 border border-white/5">
              <button
                onClick={() => setActiveDashTab("diff")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-colors ${
                  activeDashTab === "diff"
                    ? "bg-white/[0.06] text-white"
                    : "text-foreground-secondary hover:text-white"
                }`}
              >
                Visual Diff
              </button>
              <button
                onClick={() => setActiveDashTab("analytics")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-colors ${
                  activeDashTab === "analytics"
                    ? "bg-white/[0.06] text-white"
                    : "text-foreground-secondary hover:text-white"
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveDashTab("logs")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-colors ${
                  activeDashTab === "logs"
                    ? "bg-white/[0.06] text-white"
                    : "text-foreground-secondary hover:text-white"
                }`}
              >
                Event Timeline
              </button>
            </div>
          </div>

          {/* Console Content Screen */}
          <div className="p-6 min-h-[400px] bg-[#050505]/40 flex flex-col justify-center">
            {activeDashTab === "diff" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Interactive Visual Diff Slider</h4>
                    <p className="text-xs text-foreground-secondary">Drag the comparison slider to reveal content delta changes</p>
                  </div>
                  <span className="text-[10px] font-mono text-accent-cyan border border-accent-cyan/20 bg-accent-cyan/5 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">12.5% mismatch</span>
                </div>

                {/* Draggable Comparison Screen */}
                <div
                  ref={containerRef}
                  onMouseMove={(e) => handleDiffMove(e.clientX)}
                  onTouchMove={handleTouchMove}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                  className="w-full h-[280px] rounded-2xl border border-white/5 relative overflow-hidden select-none cursor-ew-resize bg-[#0F0F10]"
                >
                  {/* Underlay: "After" State with Diff Highlight */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-xs font-bold text-white font-mono">Store Ledger</span>
                        <span className="text-[10px] text-foreground-muted font-mono">2026-06-13</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-1/3 bg-white/5 rounded" />
                        {/* Highlights in glowing red */}
                        <div className="p-3.5 rounded-xl border border-error/20 bg-error/15 text-xs text-error font-bold font-mono">
                          + Price Dropped to ₹19,999 (Discount limit exceeded)
                        </div>
                        <div className="h-10 bg-white/5 rounded" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-error uppercase tracking-wider font-bold">Modified Image</span>
                  </div>

                  {/* Overlay: "Before" State */}
                  <div
                    className="absolute inset-y-0 left-0 overflow-hidden bg-[#0A0A0B] p-6 flex flex-col justify-between"
                    style={{ width: `${diffSliderPos}%`, borderRight: "2px solid var(--accent-primary)" }}
                  >
                    {/* Fixed Width Container for Overlay */}
                    <div className="absolute inset-y-0 left-0 p-6 flex flex-col justify-between" style={{ width: containerRef.current?.getBoundingClientRect().width ?? 500 }}>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                          <span className="text-xs font-bold text-white font-mono">Store Ledger</span>
                          <span className="text-[10px] text-foreground-muted font-mono">2026-06-12</span>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 w-1/3 bg-white/5 rounded" />
                          <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-foreground-secondary font-mono">
                            Base Price: ₹24,999 (No changes detected)
                          </div>
                          <div className="h-10 bg-white/5 rounded" />
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider font-bold">Original Image</span>
                    </div>
                  </div>

                  {/* Drag Handle Indicator */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-accent-primary border-2 border-white flex items-center justify-center pointer-events-none shadow-lg"
                    style={{ left: `calc(${diffSliderPos}% - 20px)` }}
                  >
                    <Sliders className="h-4.5 w-4.5 text-white" />
                  </div>
                </div>
              </div>
            )}

            {activeDashTab === "analytics" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-white">Central Analytics Trend Metrics</h4>
                  <p className="text-xs text-foreground-secondary">Monitored successes and crawl latencies</p>
                </div>

                {/* SVG Line Chart */}
                <div className="h-[250px] w-full rounded-2xl border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex gap-4 text-[10px] font-mono font-bold">
                    <span className="flex items-center gap-1.5 text-accent-primary">
                      <span className="h-2 w-2 rounded-full bg-accent-primary" /> Crawls (24h)
                    </span>
                    <span className="flex items-center gap-1.5 text-success">
                      <span className="h-2 w-2 rounded-full bg-success" /> Success Rate
                    </span>
                  </div>

                  {/* SVG Drawing of area trend */}
                  <svg className="w-full h-[180px] mt-8" viewBox="0 0 600 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <path
                      d="M0 160 Q 100 80, 200 120 T 400 40 T 600 60 L 600 180 L 0 180 Z"
                      fill="url(#chartGrad)"
                    />
                    {/* Grid lines */}
                    <line x1="0" y1="45" x2="600" y2="45" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="135" x2="600" y2="135" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    
                    {/* Curves */}
                    <path
                      d="M0 160 Q 100 80, 200 120 T 400 40 T 600 60"
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="2.5"
                    />
                    {/* Success Rate Flat Line */}
                    <line x1="0" y1="40" x2="600" y2="40" stroke="var(--success)" strokeWidth="1.5" strokeDasharray="4 4" />
                  </svg>

                  <div className="flex justify-between text-[9px] font-mono text-foreground-muted uppercase">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>23:59</span>
                  </div>
                </div>
              </div>
            )}

            {activeDashTab === "logs" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-white">Crawl Event Logs</h4>
                  <p className="text-xs text-foreground-secondary">Detailed history feed grouped chronologically</p>
                </div>

                <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-8.5 w-8.5 rounded-lg bg-success/10 border border-success/20 text-success flex items-center justify-center shrink-0">
                        <Check className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-white">Google Careers Monitor</h5>
                        <p className="text-[10px] text-foreground-secondary">Successfully parsed 14 roles matching selector criteria.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-foreground-muted font-bold">14:02:18</span>
                  </div>

                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-8.5 w-8.5 rounded-lg bg-accent-purple/10 border border-accent-purple/20 text-accent-purple flex items-center justify-center shrink-0">
                        <Zap className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-white">VSSUT Portal Hash Compare</h5>
                        <p className="text-[10px] text-foreground-secondary">Alert triggered: syllabus notice hash changed.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-foreground-muted font-bold">11:58:32</span>
                  </div>

                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-8.5 w-8.5 rounded-lg bg-white/5 border border-white/10 text-white flex items-center justify-center shrink-0">
                        <Globe className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-white">Apple Pricing Check</h5>
                        <p className="text-[10px] text-foreground-secondary">Crawl successfully processed. Content matches previous baseline.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-foreground-muted font-bold">09:30:00</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. Use Cases Section */}
      <section className="border-t border-white/5 py-20 md:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-purple/20 bg-accent-purple/5 px-4.5 py-1.5 text-xs text-accent-purple font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Who uses Traxo?</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Engineered for Diverse Needs
            </h2>
            <p className="text-sm text-foreground-secondary">
              Whether you are an active student verifying exam results, a job hunter mapping hiring portals, or a business auditing competitors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Card 1: Students */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-[280px]">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center">
                  <GraduationCap className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-base font-bold text-white">Students</h3>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  Track result notices, scholarship application guidelines, and timetables dynamically.
                </p>
              </div>
              <span className="text-[10px] font-bold text-accent-primary tracking-wider uppercase font-mono">No More Refreshing</span>
            </div>

            {/* Card 2: Job Seekers */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-[280px]">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple flex items-center justify-center">
                  <Briefcase className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-base font-bold text-white">Job Seekers</h3>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  Scrape corporate career boards. Keep track of hidden internship listings on startups.
                </p>
              </div>
              <span className="text-[10px] font-bold text-accent-purple tracking-wider uppercase font-mono">Hired Faster</span>
            </div>

            {/* Card 3: Researchers */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-[280px]">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan flex items-center justify-center">
                  <FileText className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-base font-bold text-white">Researchers</h3>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  Monitor peer-reviewed journals, publication indices, and governmental regulatory papers.
                </p>
              </div>
              <span className="text-[10px] font-bold text-accent-cyan tracking-wider uppercase font-mono">Stay Informed</span>
            </div>

            {/* Card 4: Deal Hunters */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-[280px]">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-success/10 border border-success/20 text-success flex items-center justify-center">
                  <DollarSign className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-base font-bold text-white">Deal Hunters</h3>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  Scrape retail price lines, stock additions, and discount structures. Get alerted on drops.
                </p>
              </div>
              <span className="text-[10px] font-bold text-success tracking-wider uppercase font-mono">Buy at Lows</span>
            </div>

            {/* Card 5: Businesses */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-[280px]">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                  <Globe className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-base font-bold text-white">Businesses</h3>
                <p className="text-xs text-foreground-secondary leading-relaxed">
                  Monitor competitor price models, corporate documentation updates, and compliance boards.
                </p>
              </div>
              <span className="text-[10px] font-bold text-white tracking-wider uppercase font-mono">Enterprise Edge</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Monitoring Engine Section (Pipeline) */}
      <section className="border-t border-white/5 py-20 md:py-32 relative overflow-hidden z-10 bg-white/[0.005]">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 px-4.5 py-1.5 text-xs text-accent-cyan font-bold uppercase tracking-wider">
              <Cpu className="h-3.5 w-3.5" />
              <span>Architectural Map</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Inside the Scraper Pipeline
            </h2>
            <p className="text-sm text-foreground-secondary">
              Understand the serverless flow that moves raw HTML content through our comparative engine down to real-time notification streams.
            </p>
          </div>

          {/* Animated Pipeline Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto relative">
            {/* Visual connector lines */}
            <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-accent-primary via-accent-purple to-accent-cyan z-0" />

            {/* Node 1 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="h-20 w-20 rounded-full bg-[#0F0F10] border border-white/10 flex items-center justify-center shadow-lg relative group">
                <div className="absolute inset-0 rounded-full border border-accent-primary animate-ping opacity-25" />
                <Globe className="h-7 w-7 text-accent-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">1. Target Website</h4>
                <p className="text-[11px] text-foreground-secondary max-w-[150px] mx-auto mt-1">Crawl trigger initiates browser navigations.</p>
              </div>
            </div>

            {/* Node 2 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="h-20 w-20 rounded-full bg-[#0F0F10] border border-white/10 flex items-center justify-center shadow-lg relative">
                <Cpu className="h-7 w-7 text-accent-purple" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">2. Crawl Engine</h4>
                <p className="text-[11px] text-foreground-secondary max-w-[150px] mx-auto mt-1">Cheerio normalizes DOM nodes; Playwright snaps screens.</p>
              </div>
            </div>

            {/* Node 3 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="h-20 w-20 rounded-full bg-[#0F0F10] border border-white/10 flex items-center justify-center shadow-lg relative">
                <Database className="h-7 w-7 text-accent-cyan" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">3. Compare & Hash</h4>
                <p className="text-[11px] text-foreground-secondary max-w-[150px] mx-auto mt-1">Computes SHA-256 hashes and visual diff maps.</p>
              </div>
            </div>

            {/* Node 4 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="h-20 w-20 rounded-full bg-[#0F0F10] border border-white/10 flex items-center justify-center shadow-lg relative">
                <Webhook className="h-7 w-7 text-success" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">4. Alert Dispatch</h4>
                <p className="text-[11px] text-foreground-secondary max-w-[150px] mx-auto mt-1">Deliver email templates, telegrams, or JSON webhooks.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Testimonials */}
      <section className="border-t border-white/5 py-20 md:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Trusted by Active Builders
            </h2>
            <p className="text-sm text-foreground-secondary">
              See how developers, students, and system administrators utilize our change trackers to simplify their workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Testimonial 1 */}
            <div className="glass-card rounded-2xl p-6.5 space-y-6">
              <p className="text-xs text-foreground-secondary leading-relaxed italic">
                &quot;Setting up scraping scripts was always a pain with proxy blocks. Traxo handled it in seconds. I track career pages for remote developer positions and have already gotten 3 interviews.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center text-xs font-bold font-mono">
                  S
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Subham Mohanty</h4>
                  <p className="text-[10px] text-foreground-muted">Frontend Engineer</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="glass-card rounded-2xl p-6.5 space-y-6">
              <p className="text-xs text-foreground-secondary leading-relaxed italic">
                &quot;The section-selector tracking is a game-changer. I ignore headers and track VSSUT exam circular boards. The instant Telegram alert saves me from checking the portal five times a day.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple flex items-center justify-center text-xs font-bold font-mono">
                  A
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Ananya Das</h4>
                  <p className="text-[10px] text-foreground-muted">Computer Science Student</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="glass-card rounded-2xl p-6.5 space-y-6">
              <p className="text-xs text-foreground-secondary leading-relaxed italic">
                &quot;Our sales team tracks competitor product price lists with Traxo. The JSON webhook dispatch feeds updates directly into our Slack, letting us adjust rates dynamically.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan flex items-center justify-center text-xs font-bold font-mono">
                  K
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Kartik Sharma</h4>
                  <p className="text-[10px] text-foreground-muted">Product Marketing Lead</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Pricing Section */}
      <section id="pricing" className="border-t border-white/5 bg-white/[0.005] py-20 md:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/20 bg-accent-primary/5 px-4.5 py-1.5 text-xs text-accent-primary font-bold uppercase tracking-wider">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Simple Quotas</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Flexible Subscriptions
            </h2>
            <p className="text-sm text-foreground-secondary">
              Unlock visual comparison slides, faster scan frequencies, and webhook pipelines as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="glass-card rounded-3xl p-8 flex flex-col justify-between h-[450px]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-foreground-secondary">Free Tier</h4>
                  <div className="flex items-baseline mt-4 gap-1 flex-wrap">
                    <span className="text-4xl font-extrabold text-white">$0</span>
                    <span className="text-xl font-bold text-foreground-secondary ml-1.5">/ ₹0</span>
                    <span className="text-xs text-foreground-muted font-mono ml-1.5">/forever</span>
                  </div>
                  <p className="text-xs text-foreground-secondary mt-2">Ideal for basic personal tracking needs.</p>
                </div>
                <ul className="space-y-3 text-xs text-foreground-secondary border-t border-white/5 pt-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-success shrink-0" />
                    <span>Up to 5 active trackers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-success shrink-0" />
                    <span>Daily scan frequency</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-success shrink-0" />
                    <span>Standard Email notifications</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => router.push("/register")}
                className="w-full rounded-2xl h-12 text-xs uppercase tracking-widest font-extrabold border-white/10 hover:bg-white/[0.04]"
                variant="outline"
              >
                Start Free
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-3xl border-2 border-accent-primary bg-[#0F0F10] p-8 flex flex-col justify-between h-[450px] shadow-[0_0_35px_rgba(59,130,246,0.15)]">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent-primary px-4 py-1 text-[9px] font-extrabold uppercase tracking-widest text-white">
                Most Popular
              </span>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-accent-primary">Pro Watcher</h4>
                  <div className="flex items-baseline mt-4 gap-1 flex-wrap">
                    <span className="text-4xl font-extrabold text-white">$15</span>
                    <span className="text-xl font-bold text-foreground-secondary ml-1.5">/ ₹1,249</span>
                    <span className="text-xs text-foreground-muted font-mono ml-1.5">/month</span>
                  </div>
                  <p className="text-xs text-foreground-secondary mt-2">Perfect for active developers & job seekers.</p>
                </div>
                <ul className="space-y-3 text-xs text-foreground-secondary border-t border-white/5 pt-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-success shrink-0" />
                    <span>Up to 50 active trackers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-success shrink-0" />
                    <span>Hourly scan frequency</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-success shrink-0" />
                    <span>Email & Telegram alert channels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-success shrink-0" />
                    <span>Visual diff screenshot highlights</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => router.push("/register")}
                className="w-full rounded-2xl h-12 text-xs uppercase tracking-widest font-extrabold gradient-bg-primary text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
              >
                Go Pro
              </Button>
            </div>

            {/* Business Plan */}
            <div className="glass-card rounded-3xl p-8 flex flex-col justify-between h-[450px]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-accent-purple">Enterprise</h4>
                  <div className="flex items-baseline mt-4 gap-1 flex-wrap">
                    <span className="text-4xl font-extrabold text-white">$49</span>
                    <span className="text-xl font-bold text-foreground-secondary ml-1.5">/ ₹4,099</span>
                    <span className="text-xs text-foreground-muted font-mono ml-1.5">/month</span>
                  </div>
                  <p className="text-xs text-foreground-secondary mt-2">Custom scheduling for high scale systems.</p>
                </div>
                <ul className="space-y-3 text-xs text-foreground-secondary border-t border-white/5 pt-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-success shrink-0" />
                    <span>Unlimited active trackers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-success shrink-0" />
                    <span>30-minute scan frequency</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-success shrink-0" />
                    <span>Slack/Discord webhooks integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 text-success shrink-0" />
                    <span>Dedicated API Key access platform</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => router.push("/register")}
                className="w-full rounded-2xl h-12 text-xs uppercase tracking-widest font-extrabold border-white/10 hover:bg-white/[0.04]"
                variant="outline"
              >
                Switch to Enterprise
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Founder Section */}
      <section className="border-t border-white/5 py-20 md:py-32 relative z-10 bg-white/[0.002]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="glass-card rounded-3xl p-8 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-50 pointer-events-none" />
            
            {/* Founder Image */}
            <div className="md:col-span-4 flex justify-center">
              <div className="relative w-48 h-48 rounded-2xl border border-white/10 p-1 bg-gradient-to-tr from-accent-primary to-accent-purple shadow-xl overflow-hidden group">
                <div className="absolute inset-0 bg-black/30 mix-blend-overlay z-10" />
                <img
                  src="/founder.png"
                  alt="Alok Kumar Sahu"
                  className="w-full h-full object-cover rounded-[12px] transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Founder Bio */}
            <div className="md:col-span-8 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/20 bg-accent-primary/5 px-3.5 py-1 text-xs text-accent-primary font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Meet the Founder</span>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">Alok Kumar Sahu</h3>
                <p className="text-xs font-mono font-bold text-accent-primary uppercase tracking-widest mt-1">Founder & Developer, Traxo</p>
              </div>
              <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                I am a B.Tech Computer Science student at Veer Surendra Sai University of Technology. I approach software engineering not just as code execution, but as product building — ensuring high-end responsiveness, scalable databases, and contextual AI capabilities.
              </p>

              {/* Socials */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a href="https://alokkumarsahu.in" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center text-foreground-secondary hover:text-white hover:bg-white/[0.06] transition-all" title="Portfolio Website">
                  <Globe className="h-4.5 w-4.5" />
                </a>
                <a href="https://github.com/alokkumar2510" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center text-foreground-secondary hover:text-white hover:bg-white/[0.06] transition-all" title="GitHub">
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/alok-kumar-sahu-7a7059370/" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center text-foreground-secondary hover:text-white hover:bg-white/[0.06] transition-all" title="LinkedIn">
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a href="https://x.com/alok_chintu" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center text-foreground-secondary hover:text-white hover:bg-white/[0.06] transition-all" title="X (Twitter)">
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://instagram.com/alokkumar.in" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center text-foreground-secondary hover:text-white hover:bg-white/[0.06] transition-all" title="Instagram">
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                
                <Link
                  href="/about-us"
                  className="text-xs font-bold text-white hover:text-accent-primary flex items-center gap-1 ml-auto"
                >
                  Read full story <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20 md:py-32 space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-foreground-secondary">
            Common questions about technical limits, crawling structures, and alert routing.
          </p>
        </div>

        {/* Custom Accordion Grid */}
        <div className="space-y-4">
          {faqData.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/5 bg-[#0F0F10]/40 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex justify-between items-center gap-4 text-sm font-bold text-white hover:text-accent-primary transition-colors focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4.5 w-4.5 text-foreground-secondary shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-xs text-foreground-secondary leading-relaxed border-t border-white/5 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 12. Final CTA */}
      <section className="relative py-28 text-center overflow-hidden z-10 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.12),transparent_70%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 space-y-8 relative">
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-tight">
            Stop Refreshing Websites. <br />
            <span className="gradient-text-primary">Start Tracking Them.</span>
          </h2>
          <p className="text-sm text-foreground-secondary max-w-lg mx-auto">
            Create your free account today and configure your first website monitor in 30 seconds.
          </p>
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => router.push("/register")}
              className="gradient-bg-primary hover:shadow-[0_0_30px_rgba(59,130,246,0.45)] text-white px-8 h-13 text-xs uppercase tracking-widest font-extrabold rounded-xl transition-all"
            >
              Start Tracking Free
            </Button>
          </div>
        </div>
      </section>

      {/* 13. Footer */}
      <footer className="border-t border-white/5 py-16 bg-[#050505] relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-white/10 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-base tracking-wider text-white font-mono">TRAXO</span>
            </div>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Autonomous website monitoring, section change tracking, and price verification executed securely on the edge.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Product</h5>
            <ul className="space-y-2.5 text-xs text-foreground-secondary">
              <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Resources</h5>
            <ul className="space-y-2.5 text-xs text-foreground-secondary">
              <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/api/developer" className="hover:text-white transition-colors">Developer API</Link></li>
              <li><a href="https://github.com/alokkumarsahu/traxo" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-1">GitHub <ExternalLink className="h-3 w-3" /></a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Legal</h5>
            <ul className="space-y-2.5 text-xs text-foreground-secondary">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted">
          <p>
            &copy; {new Date().getFullYear()} Traxo Inc. All rights reserved. Made with love by{" "}
            <a
              href="https://alokkumarsahu.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors underline font-bold"
            >
              ALOK KUMAR SAHU
            </a>
            .
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] uppercase font-mono tracking-wider border border-white/10 px-2 py-0.5 rounded bg-white/[0.01]">Production Build</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
