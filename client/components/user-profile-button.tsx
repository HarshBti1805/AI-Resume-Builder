"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

const defaultButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted print:hidden";

const defaultWrapperClass = "fixed right-16 top-4 z-50 print:hidden";

interface UserProfileButtonProps {
  /** When true, button is in-flow (e.g. in navbar) instead of fixed. */
  inline?: boolean;
  /** Optional class for the button. When inline, a navbar-friendly size is used if not provided. */
  className?: string;
}

export function UserProfileButton({ inline, className }: UserProfileButtonProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 120);
  }, [clearCloseTimeout]);

  const handleMouseEnter = useCallback(() => {
    clearCloseTimeout();
    setOpen(true);
  }, [clearCloseTimeout]);

  const handleMouseLeave = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  const handleClick = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!user) return null;

  const wrapperClass = inline ? "relative z-50 print:hidden" : defaultWrapperClass;
  const buttonClass = className ?? (inline ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 text-foreground transition-colors hover:bg-muted" : defaultButtonClass);

  return (
    <div
      className={wrapperClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.button
        type="button"
        aria-label="User profile"
        aria-expanded={open}
        aria-haspopup="true"
        className={buttonClass}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
      >
        <User className="h-[18px] w-[18px]" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-[100] mt-2 w-64 origin-top-right rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur-sm"
            role="menu"
          >
            <div className="space-y-3 border-b border-border/60 pb-3">
              <div>
                <p className="font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </p>
                <p className="font-manrope mt-0.5 text-sm font-medium text-foreground truncate">
                  {user.name || "—"}
                </p>
              </div>
              <div>
                <p className="font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Roll number
                </p>
                <p className="font-dm-mono mt-0.5 text-sm text-foreground truncate">
                  {user.rollNumber || "—"}
                </p>
              </div>
              <div>
                <p className="font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </p>
                <p className="font-manrope mt-0.5 text-sm text-foreground truncate">
                  {user.email || "—"}
                </p>
              </div>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="font-manrope w-full rounded-lg border border-border/70 bg-transparent px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                role="menuitem"
              >
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
