"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Dialog = ({ isOpen, onClose, children }: DialogProps) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-2xl"
          />

          {/* Dialog Content Wrapper */}
          {children}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onClose, showCloseButton = true }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
        className={cn(
          "relative z-10 w-full max-w-[500px] rounded-2xl glass-modal p-6 md:p-8 shadow-large overflow-hidden border border-border-glass",
          className
        )}
      >
        {/* Subtle neon gradient highlight orb inside the modal top */}
        <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 w-[200px] h-[60px] bg-accent-primary/10 rounded-full blur-[30px]" />

        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-foreground-secondary hover:bg-surface-elevated hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        )}
        {children}
      </motion.div>
    );
  }
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-left mb-4", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn("text-lg font-bold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-foreground-secondary", className)} {...props} />
);
DialogDescription.displayName = "DialogDescription";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
