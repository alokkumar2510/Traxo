"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { UserPlus, Mail, Lock, User, ShieldAlert } from "lucide-react";
import { auth } from "@/services/firebase";
import { logger } from "@/utils/logger";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    setGeneralError(null);
    try {
      // Create user in Firebase Auth
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      
      // Update display name in Firebase Auth
      await updateProfile(credential.user, {
        displayName: values.name,
      });

      logger.info({
        service: "auth",
        event: "email_registration_success",
        userId: credential.user.uid,
        metadata: { email: values.email, name: values.name },
      });
    } catch (err: any) {
      logger.error({
        service: "auth",
        event: "email_registration_failed",
        error: err,
      });
      if (err.code === "auth/email-already-in-use") {
        setGeneralError("This email address is already in use. Please sign in instead.");
      } else if (err.code === "auth/invalid-email") {
        setGeneralError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setGeneralError("The password is too weak. Please choose a stronger password.");
      } else {
        setGeneralError(err.message || "Failed to create your account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
        <p className="text-sm text-foreground-secondary">
          Monitor website changes automatically and get notified.
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

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name-input" className="text-xs font-medium text-foreground-secondary">
            Full Name
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-4 h-5 w-5 text-foreground-muted" />
            <input
              id="name-input"
              type="text"
              disabled={loading}
              placeholder="Alok Kumar Sahu"
              {...register("name")}
              className={`h-[52px] w-full rounded-xl border bg-surface/50 pl-11 pr-4 text-sm text-foreground placeholder-foreground-muted outline-none transition-all duration-200 focus:bg-surface focus:border-accent-primary focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] ${
                errors.name ? "border-error/40 focus:border-error focus:shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-border-glass"
              }`}
            />
          </div>
          {errors.name && <span className="text-xs text-error mt-0.5">{errors.name.message}</span>}
        </div>

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

        {/* Password Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password-input" className="text-xs font-medium text-foreground-secondary">
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-4 h-5 w-5 text-foreground-muted" />
            <input
              id="password-input"
              type="password"
              disabled={loading}
              placeholder="••••••••"
              {...register("password")}
              className={`h-[52px] w-full rounded-xl border bg-surface/50 pl-11 pr-4 text-sm text-foreground placeholder-foreground-muted outline-none transition-all duration-200 focus:bg-surface focus:border-accent-primary focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] ${
                errors.password ? "border-error/40 focus:border-error focus:shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-border-glass"
              }`}
            />
          </div>
          {errors.password && (
            <span className="text-xs text-error mt-0.5">{errors.password.message}</span>
          )}
        </div>

        {/* Confirm Password Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password-input" className="text-xs font-medium text-foreground-secondary">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-4 h-5 w-5 text-foreground-muted" />
            <input
              id="confirm-password-input"
              type="password"
              disabled={loading}
              placeholder="••••••••"
              {...register("confirmPassword")}
              className={`h-[52px] w-full rounded-xl border bg-surface/50 pl-11 pr-4 text-sm text-foreground placeholder-foreground-muted outline-none transition-all duration-200 focus:bg-surface focus:border-accent-primary focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] ${
                errors.confirmPassword
                  ? "border-error/40 focus:border-error focus:shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                  : "border-border-glass"
              }`}
            />
          </div>
          {errors.confirmPassword && (
            <span className="text-xs text-error mt-0.5">{errors.confirmPassword.message}</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          id="register-submit-btn"
          type="submit"
          disabled={loading}
          className="h-[48px] w-full rounded-xl font-medium text-white gradient-bg-primary transition-all duration-300 transform active:scale-[0.98] hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <div className="h-5 w-5 animate-pulse rounded-full bg-white/30" />
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      {/* Footer Switch Link */}
      <p className="mt-6 text-center text-sm text-foreground-secondary">
        Already have an account?{" "}
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
