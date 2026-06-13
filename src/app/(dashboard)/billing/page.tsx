"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/services/firebase";
import { doc, onSnapshot, setDoc, Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Check,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  Zap,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserBilling {
  customerId?: string;
  subscriptionId?: string;
  plan: "free" | "pro" | "business";
  status: "active" | "cancelled" | "expired";
  currentPeriodEnd?: any;
}

export default function BillingPage() {
  const { user } = useAuthStore();
  const userId = user?.uid;

  // Billing states
  const [billing, setBilling] = useState<UserBilling>({
    plan: "free",
    status: "active",
  });
  const [loading, setLoading] = useState(true);
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load billing document
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const billingRef = doc(db, "billing", userId);

    const unsubscribe = onSnapshot(billingRef, (snap) => {
      if (snap.exists()) {
        setBilling(snap.data() as UserBilling);
      } else {
        // Initialize Free Billing document
        const initialBilling: UserBilling = {
          plan: "free",
          status: "active",
          createdAt: Timestamp.now(),
        } as any;
        setDoc(billingRef, initialBilling);
        setBilling(initialBilling);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Mock plan update (without payment gateway integration)
  const handleUpgradeMock = async (plan: "free" | "pro" | "business") => {
    if (!userId) return;

    try {
      setUpdatingPlan(plan);
      setSuccessMsg(null);

      const billingRef = doc(db, "billing", userId);
      const updatedBilling: UserBilling = {
        ...billing,
        plan,
        status: "active",
        currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
      };

      await setDoc(billingRef, updatedBilling);
      
      // Sync user profile plan as well
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { plan }, { merge: true });

      setSuccessMsg(`Successfully subscribed to the ${plan.toUpperCase()} plan!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Failed to update plan:", err);
    } finally {
      setUpdatingPlan(null);
    }
  };

  // Plan limits configs
  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      priceRupees: "₹0",
      period: "forever",
      description: "Ideal for basic personal tracking needs.",
      features: [
        "Up to 5 active trackers",
        "Daily scan frequency limit",
        "Standard HTML text changes",
        "Email notifications",
        "1-day history log retention",
      ],
      limits: { trackers: 5, frequency: "Daily" },
      glow: false,
    },
    {
      id: "pro",
      name: "Pro Watcher",
      price: "$15",
      priceRupees: "₹1,249",
      period: "month",
      description: "Perfect for active developers & job seekers.",
      features: [
        "Up to 50 active trackers",
        "Hourly scan frequency allowed",
        "Section selection + price drops",
        "Email & Telegram notification routing",
        "15-day history log retention",
        "Visual diff highlights screenshots",
      ],
      limits: { trackers: 50, frequency: "Hourly" },
      glow: true,
    },
    {
      id: "business",
      name: "Enterprise Edge",
      price: "$49",
      priceRupees: "₹4,099",
      period: "month",
      description: "Custom scheduling for high scale systems.",
      features: [
        "Unlimited active trackers",
        "30-minute scan frequency allowed",
        "Visual diffs, PDF, & Jobs trackers",
        "Webhooks integration (Slack/Discord)",
        "90-day history log retention",
        "Dedicated API key access platform",
      ],
      limits: { trackers: 9999, frequency: "30-min" },
      glow: false,
    },
  ] as const;

  // Active usage calculations based on current plan
  const activePlanDetails = useMemo(() => {
    return plans.find((p) => p.id === billing.plan) ?? plans[0];
  }, [billing.plan]);

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <Clock className="h-8 w-8 text-accent-primary animate-spin" />
        <p className="text-sm font-mono text-foreground-secondary">Syncing billing ledger...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Manage your subscription plans, monitor active usage quotas, and unlock pro features.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-success/20 bg-success/10 p-4 text-sm font-semibold text-success flex items-center gap-2">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Active Quotas Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Subscription Info Card */}
        <Card className="bg-bg-glass border-border-glass">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent-primary" /> Active Plan Status
            </CardTitle>
            <CardDescription>Details of your current active service levels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-xl border border-border-glass bg-white/[0.01]">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-foreground-secondary">
                  Current Tier
                </p>
                <h4 className="text-lg font-bold text-foreground capitalize mt-0.5">
                  {billing.plan} Plan
                </h4>
              </div>
              <span className="rounded-full bg-success/15 border border-success/20 text-success text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">
                {billing.status}
              </span>
            </div>

            {billing.currentPeriodEnd && (
              <div className="flex justify-between items-center text-xs text-foreground-secondary px-2">
                <span>Renewal Cycle Date:</span>
                <span className="font-mono text-foreground font-semibold">
                  {billing.currentPeriodEnd.toDate?.()?.toLocaleDateString() ?? "Next Month"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quota Progress Meter Card */}
        <Card className="bg-bg-glass border-border-glass">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent-purple" /> Feature Allocations
            </CardTitle>
            <CardDescription>Track scan speeds and watcher capacities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Active Trackers Quota */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground-secondary">Scan Frequency Limit</span>
                <span className="text-foreground font-mono">{activePlanDetails.limits.frequency}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
                <div
                  className="h-full bg-accent-primary"
                  style={{
                    width: billing.plan === "free" ? "33%" : billing.plan === "pro" ? "75%" : "100%",
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-foreground-secondary px-1 pt-1 bg-white/[0.01] p-3 rounded-lg border border-border-glass">
              <Info className="h-4 w-4 text-accent-cyan shrink-0" />
              <span>
                Want faster crawls or higher watcher volume? Select a tier below to transition instantly.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Grid */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold tracking-tight text-foreground text-center">
          Compare Available Plans
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = billing.plan === p.id;

            return (
              <Card
                key={p.id}
                className={`relative rounded-3xl border flex flex-col justify-between p-6 transition-all duration-300 ${
                  p.glow
                    ? "border-accent-primary/45 bg-accent-primary/[0.02] shadow-[0_0_30px_rgba(59,130,246,0.06)]"
                    : "border-border-glass bg-bg-glass"
                }`}
              >
                {/* Popular Badge */}
                {p.glow && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">
                    Most Popular
                  </span>
                )}

                <div className="space-y-6">
                  {/* Name & price */}
                  <div>
                    <h4 className="text-lg font-bold text-foreground capitalize">{p.name}</h4>
                    <p className="text-xs text-foreground-secondary mt-1">{p.description}</p>
                    <div className="flex items-baseline mt-4 gap-1 flex-wrap">
                      <span className="text-3xl font-extrabold text-foreground">{p.price}</span>
                      <span className="text-xl font-bold text-foreground-secondary ml-1.5">/ {p.priceRupees}</span>
                      <span className="text-xs text-foreground-secondary font-mono ml-1.5">/{p.period}</span>
                    </div>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-3 text-xs text-foreground-secondary border-t border-border-glass pt-6">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  {isCurrent ? (
                    <Button variant="secondary" className="w-full rounded-2xl h-11 border-success/25" disabled>
                      <span className="text-success font-semibold flex items-center justify-center gap-1.5">
                        <Check className="h-4 w-4" /> Active Plan
                      </span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgradeMock(p.id)}
                      className={`w-full rounded-2xl h-11 font-semibold ${
                        p.glow ? "gradient-bg-primary text-white" : ""
                      }`}
                      disabled={updatingPlan !== null}
                    >
                      {updatingPlan === p.id ? "Updating..." : `Switch to ${p.name}`}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
