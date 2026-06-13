"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { LogIn, Mail, Lock, ShieldAlert } from "lucide-react";
import { auth } from "@/services/firebase";
import { logger } from "@/utils/logger";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setGeneralError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      logger.info({
        service: "auth",
        event: "email_login_success",
        metadata: { email: values.email },
      });
    } catch (err: any) {
      logger.error({
        service: "auth",
        event: "email_login_failed",
        error: err,
      });
      // Map Firebase auth errors to user friendly messages
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setGeneralError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setGeneralError("This account has been temporarily disabled due to too many failed login attempts.");
      } else {
        setGeneralError(err.message || "Something went wrong during sign-in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      logger.info({
        service: "auth",
        event: "google_login_success",
      });
    } catch (err: any) {
      logger.error({
        service: "auth",
        event: "google_login_failed",
        error: err,
      });
      if (err.code !== "auth/popup-closed-by-user") {
        setGeneralError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-foreground-secondary">
          Enter your credentials to access your control dashboard.
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

      {/* Email / Password Form */}
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

        {/* Password Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password-input" className="text-xs font-medium text-foreground-secondary">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-accent-primary hover:text-accent-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
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

        {/* Submit Button */}
        <button
          id="login-submit-btn"
          type="submit"
          disabled={loading}
          className="h-[48px] w-full rounded-xl font-medium text-white gradient-bg-primary transition-all duration-300 transform active:scale-[0.98] hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <div className="h-5 w-5 animate-pulse rounded-full bg-white/30" />
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Separator */}
      <div className="my-6 flex items-center justify-center gap-3">
        <div className="h-[1px] flex-1 bg-border-glass" />
        <span className="text-xs font-mono text-foreground-muted uppercase tracking-wider">or</span>
        <div className="h-[1px] flex-1 bg-border-glass" />
      </div>

      {/* Google Login Button */}
      <button
        id="google-login-btn"
        type="button"
        disabled={loading}
        onClick={handleGoogleLogin}
        className="h-[48px] w-full rounded-xl border border-border-glass bg-surface/50 hover:bg-surface font-medium text-foreground transition-all duration-200 transform hover:translate-y-[-2px] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
          <path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.33 0 3.357 2.72 1.5 6.7L5.266 9.765z"
          />
          <path
            fill="#34A853"
            d="M16.04 15.345c-1.077.737-2.43 1.182-4.04 1.182a7.073 7.073 0 0 1-6.734-4.855L1.5 14.736A11.99 11.99 0 0 0 12 24c3.245 0 6.223-1.09 8.441-2.964l-4.401-5.69z"
          />
          <path
            fill="#4285F4"
            d="M23.518 12.31c0-.828-.078-1.624-.21-2.39H12v4.545h6.47c-.28 1.477-1.114 2.731-2.378 3.58l4.4 5.69C22.613 21.722 23.518 17.51 23.518 12.31z"
          />
          <path
            fill="#FBBC05"
            d="M5.266 14.235A7.03 7.03 0 0 1 4.91 12c0-.79.13-1.555.356-2.265L1.5 6.7C.542 8.3.001 10.1.001 12c0 1.9.54 3.7 1.499 5.3l3.766-3.065z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Footer Switch Link */}
      <p className="mt-6 text-center text-sm text-foreground-secondary">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-accent-primary hover:text-accent-primary/80 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
