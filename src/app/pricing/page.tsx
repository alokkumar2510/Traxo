"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Activity,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Menu,
  X,
  Zap,
  DollarSign,
  AlertCircle,
  BadgeAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("monthly");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Price Calculation helpers
  const getProPrice = () => (billingPeriod === "monthly" ? 15 : 12);
  const getBusinessPrice = () => (billingPeriod === "monthly" ? 49 : 39);
  const getProPriceRupees = () => (billingPeriod === "monthly" ? 1249 : 999);
  const getBusinessPriceRupees = () => (billingPeriod === "monthly" ? 4099 : 3249);

  return (
    <div className="bg-[#050505] text-foreground min-h-screen font-sans selection:bg-accent-primary/20 selection:text-accent-primary overflow-x-hidden flex flex-col justify-between relative">
      {/* Background Radial Auroras */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(circle_at_50%_-100px,rgba(139,92,246,0.12),rgba(59,130,246,0.06),transparent_60%)] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-[-200px] h-[500px] w-[500px] bg-accent-primary/5 rounded-full blur-[140px] pointer-events-none z-0" />

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
            <Link href="/pricing" className="text-white hover:text-white transition-all">Pricing</Link>
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
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/20 bg-accent-primary/5 px-4.5 py-1.5 text-xs text-accent-primary font-bold uppercase tracking-wider">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Pricing Architecture</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            SaaS Plan Structure
          </h1>
          <p className="text-sm text-foreground-secondary">
            Select a plan that matches your crawling speed and watcher capacity requirements.
          </p>

          {/* Billing Switch */}
          <div className="flex justify-center pt-4">
            <div className="flex rounded-xl bg-[#0F0F10] p-1 border border-white/5 relative">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wider transition-colors ${
                  billingPeriod === "monthly"
                    ? "bg-white/[0.06] text-white"
                    : "text-foreground-secondary hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingPeriod("annually")}
                className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5 ${
                  billingPeriod === "annually"
                    ? "bg-white/[0.06] text-white"
                    : "text-foreground-secondary hover:text-white"
                }`}
              >
                Annual Billing
                <span className="rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-[8px] font-extrabold px-1.5 py-0.5 uppercase tracking-wide">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch pt-4">
          {/* Free Plan */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between h-[480px]">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-foreground-secondary">Free Tier</h4>
                <div className="flex items-baseline mt-4 gap-1 flex-wrap">
                  <span className="text-5xl font-extrabold text-white">$0</span>
                  <span className="text-2xl font-bold text-foreground-secondary ml-1.5">/ ₹0</span>
                  <span className="text-xs text-foreground-muted font-mono ml-1.5">/forever</span>
                </div>
                <p className="text-xs text-foreground-secondary mt-2">Ideal for basic personal tracking needs.</p>
              </div>
              <ul className="space-y-3.5 text-xs text-foreground-secondary border-t border-white/5 pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>Up to 5 active trackers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>Daily scan frequency limit</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>Standard Email notifications</span>
                </li>
                <li className="flex items-center gap-2.5 text-foreground-muted">
                  <X className="h-4.5 w-4.5 text-error shrink-0" />
                  <span>No Telegram integration</span>
                </li>
                <li className="flex items-center gap-2.5 text-foreground-muted">
                  <X className="h-4.5 w-4.5 text-error shrink-0" />
                  <span>No Visual Diff history logs</span>
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
          <div className="relative rounded-3xl border-2 border-accent-primary bg-[#0F0F10] p-8 flex flex-col justify-between h-[480px] shadow-[0_0_35px_rgba(59,130,246,0.15)]">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent-primary px-4 py-1 text-[9px] font-extrabold uppercase tracking-widest text-white">
              Most Popular
            </span>
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-accent-primary">Pro Watcher</h4>
                <div className="flex items-baseline mt-4 gap-1 flex-wrap">
                  <span className="text-5xl font-extrabold text-white">${getProPrice()}</span>
                  <span className="text-2xl font-bold text-foreground-secondary ml-1.5">/ ₹{getProPriceRupees()}</span>
                  <span className="text-xs text-foreground-muted font-mono ml-1.5">/month</span>
                </div>
                <p className="text-xs text-foreground-secondary mt-2">Perfect for active developers & job seekers.</p>
              </div>
              <ul className="space-y-3.5 text-xs text-foreground-secondary border-t border-white/5 pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>Up to 50 active trackers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>Hourly scan frequency allowed</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>Email & Telegram alert channels</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>Visual diff screenshot comparisons</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>15-day history retention</span>
                </li>
              </ul>
            </div>
            <Button
              onClick={() => router.push("/register")}
              className="w-full rounded-2xl h-12 text-xs uppercase tracking-widest font-extrabold gradient-bg-primary text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
            >
              Get Started Pro
            </Button>
          </div>

          {/* Business Plan */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between h-[480px]">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-accent-purple">Enterprise</h4>
                <div className="flex items-baseline mt-4 gap-1 flex-wrap">
                  <span className="text-5xl font-extrabold text-white">${getBusinessPrice()}</span>
                  <span className="text-2xl font-bold text-foreground-secondary ml-1.5">/ ₹{getBusinessPriceRupees()}</span>
                  <span className="text-xs text-foreground-muted font-mono ml-1.5">/month</span>
                </div>
                <p className="text-xs text-foreground-secondary mt-2">Custom scheduling for high scale systems.</p>
              </div>
              <ul className="space-y-3.5 text-xs text-foreground-secondary border-t border-white/5 pt-6">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>Unlimited active trackers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>30-minute scan frequency allowed</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>Slack & Discord webhooks integration</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>Dedicated API key access platform</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  <span>90-day history retention</span>
                </li>
              </ul>
            </div>
            <Button
              onClick={() => router.push("/register")}
              className="w-full rounded-2xl h-12 text-xs uppercase tracking-widest font-extrabold border-white/10 hover:bg-white/[0.04]"
              variant="outline"
            >
              Choose Enterprise
            </Button>
          </div>
        </div>

        {/* Feature Comparison Chart */}
        <div className="max-w-4xl mx-auto space-y-6 pt-16">
          <h3 className="text-xl font-bold text-white text-center">Detailed Feature Checklist</h3>
          <div className="rounded-3xl border border-white/10 bg-[#0F0F10]/50 p-6 overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-white font-mono uppercase tracking-widest pb-4">
                  <th className="pb-4">Features</th>
                  <th className="pb-4 text-center">Free</th>
                  <th className="pb-4 text-center">Pro</th>
                  <th className="pb-4 text-center font-bold text-accent-purple">Business</th>
                </tr>
              </thead>
              <tbody className="text-foreground-secondary divide-y divide-white/5">
                <tr>
                  <td className="py-4 font-bold text-white">Active Trackers limit</td>
                  <td className="py-4 text-center">5</td>
                  <td className="py-4 text-center">50</td>
                  <td className="py-4 text-center font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-white">Minimum Scan Gap</td>
                  <td className="py-4 text-center">24 hours (Daily)</td>
                  <td className="py-4 text-center">1 hour (Hourly)</td>
                  <td className="py-4 text-center font-bold">30 minutes</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-white">Crawl Channels</td>
                  <td className="py-4 text-center">Webpage HTML</td>
                  <td className="py-4 text-center">HTML + Prices</td>
                  <td className="py-4 text-center font-bold">HTML + Prices + PDF + Jobs</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-white">Alert Destinations</td>
                  <td className="py-4 text-center">Email Only</td>
                  <td className="py-4 text-center">Email + Telegram</td>
                  <td className="py-4 text-center font-bold">Email + Telegram + Webhooks</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-white">Visual Screenshot Diffs</td>
                  <td className="py-4 text-center">No</td>
                  <td className="py-4 text-center">Yes</td>
                  <td className="py-4 text-center font-bold">Yes (Priority resolution)</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-white">History Logs Retention</td>
                  <td className="py-4 text-center">1 Day</td>
                  <td className="py-4 text-center">15 Days</td>
                  <td className="py-4 text-center font-bold">90 Days</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-white">REST API Access</td>
                  <td className="py-4 text-center">No</td>
                  <td className="py-4 text-center">No</td>
                  <td className="py-4 text-center font-bold">Yes (Custom Key generation)</td>
                </tr>
              </tbody>
            </table>
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
