import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:pointer-events-none disabled:opacity-55 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "gradient-bg-primary text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] hover:translate-y-[-1px]",
        secondary:
          "border border-border-glass bg-bg-glass backdrop-blur-md text-foreground hover:bg-surface-elevated hover:border-foreground-muted hover:translate-y-[-1px]",
        outline:
          "border border-border-glass bg-transparent text-foreground hover:bg-surface/50 hover:text-foreground",
        ghost:
          "text-foreground-secondary hover:bg-surface-elevated hover:text-foreground",
        destructive:
          "bg-error text-white hover:bg-error/90 hover:shadow-[0_0_30px_rgba(239,68,68,0.25)] hover:translate-y-[-1px]",
        link: "text-accent-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[48px] px-5 py-2.5",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
