import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[52px] w-full rounded-xl border border-border-glass bg-bg-glass backdrop-blur-md px-4 py-2 text-sm text-foreground placeholder-foreground-muted shadow-sm outline-none transition-all duration-300",
          "focus:bg-surface focus:border-accent-primary focus:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-error/40 focus:border-error focus:shadow-[0_0_20px_rgba(239,68,68,0.1)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
