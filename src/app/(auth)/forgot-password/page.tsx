"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { Mail, ShieldAlert, CheckCircle, ArrowLeft } from "lucide-react";
import { auth } from "@/services/firebase";
import { logger } from "@/utils/logger";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    setGeneralError(null);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setSuccess(true);
      logger.info({
        service: "auth",
        event: "password_reset_requested",
        metadata: { email: values.email },
      });
    } catch (err: any) {
      logger.error({
        service: "auth",
        event: "password_reset_request_failed",
        error: err,
      });
      if (err.code === "auth/user-not-found") {
        // For security reasons, standard practice is to show success anyway,
        // but here we can show a user friendly warning or generic message.
        setGeneralError("No user was found with this email address.");
      } else {
        setGeneralError(err.message || "Failed to send password reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 border border-success/30 text-success"
        >
          <CheckCircle className="h-6 w-6" />
        </motion.div>
        <h1 className="text-xl font-bold text-foreground mb-2">Check your email</h1>
        <p className="text-sm text-foreground-secondary mb-6">
          We have sent a secure password reset link to your email address. Please check your inbox and spam folders.
        </p>
        <Link
          href="/login"
          className="h-[48px] w-full rounded-xl border border-border-glass bg-surface/50 hover:bg-surface font-medium text-foreground transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:translate-y-[-2px] active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset password</h1>
        <p className="text-sm text-foreground-secondary">
          Enter your email address to receive a password reset link.
        </p>
      </div>

      {generalError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-3 rounded-lg border border-error/20 bg-error/5 p-4 text-sm text-error"
        >
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>{generalError}</div>
        </motion.div>
      )}

      {/* Forgot Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email-input" className="text-xs font-medium text-foreground-secondary">
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-4 h-5 w-5 text-foreground-muted" />
            <input
              id="email-input"
              type="email"
              disabled={loading}
              placeholder="name@example.com"
              {...register("email")}
              className={`h-[52px] w-full rounded-xl border bg-surface/50 pl-11 pr-4 text-sm text-foreground placeholder-foreground-muted outline-none transition-all duration-200 focus:bg-surface focus:border-accent-primary focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] ${
                errors.email ? "border-error/40 focus:border-error focus:shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-border-glass"
              }`}
            />
          </div>
          {errors.email && <span className="text-xs text-error mt-0.5">{errors.email.message}</span>}
        </div>

        {/* Submit Button */}
        <button
          id="forgot-submit-btn"
          type="submit"
          disabled={loading}
          className="h-[48px] w-full rounded-xl font-medium text-white gradient-bg-primary transition-all duration-300 transform active:scale-[0.98] hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <div className="h-5 w-5 animate-pulse rounded-full bg-white/30" />
          ) : (
            <span>Send Reset Link</span>
          )}
        </button>
      </form>

      {/* Footer Switch Link */}
      <p className="mt-6 text-center text-sm text-foreground-secondary">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-medium text-accent-primary hover:text-accent-primary/80 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
