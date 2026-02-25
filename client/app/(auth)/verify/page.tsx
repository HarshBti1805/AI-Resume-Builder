"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const name = searchParams.get("name") ?? "";
  const rollNumber = searchParams.get("roll") ?? "";

  const { verifyOtp, sendOtp, isLoading, error, clearError } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resendMessage, setResendMessage] = useState("");

  // Redirect if no email in params (user navigated directly)
  useEffect(() => {
    if (!email) {
      router.replace("/login");
    }
  }, [email, router]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const maskedEmail = email
    ? `${email.slice(0, 3)}***@${email.split("@")[1] ?? ""}`
    : "your email";

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      // Handle paste (multiple digits at once)
      if (value.length > 1) {
        const digits = value
          .replace(/\D/g, "")
          .slice(0, OTP_LENGTH)
          .split("");
        const next = [...otp];
        digits.forEach((d, i) => {
          if (index + i < OTP_LENGTH) next[index + i] = d;
        });
        setOtp(next);

        // Focus the next empty input or last input
        const focusIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[name="otp-${focusIndex}"]`
        );
        nextInput?.focus();
        return;
      }

      const digit = value.replace(/\D/g, "").slice(-1);
      const next = [...otp];
      next[index] = digit;
      setOtp(next);

      if (digit && index < OTP_LENGTH - 1) {
        const nextInput = document.querySelector<HTMLInputElement>(
          `input[name="otp-${index + 1}"]`
        );
        nextInput?.focus();
      }
    },
    [otp]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        const prevInput = document.querySelector<HTMLInputElement>(
          `input[name="otp-${index - 1}"]`
        );
        prevInput?.focus();
      }
    },
    [otp]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) return;

    try {
      await verifyOtp({
        email,
        otp: code,
        name,
        rollNumber,
      });

      // Verification successful — redirect to form
      router.push("/form/personal");
    } catch {
      // Error is set in the store — clear OTP inputs for retry
      setOtp(Array(OTP_LENGTH).fill(""));
      const firstInput = document.querySelector<HTMLInputElement>(
        `input[name="otp-0"]`
      );
      firstInput?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !email) return;
    clearError();
    setResendMessage("");

    try {
      await sendOtp(email);
      setResendTimer(RESEND_COOLDOWN);
      setResendMessage("New code sent!");
      setOtp(Array(OTP_LENGTH).fill(""));

      // Auto-clear success message after 3 seconds
      setTimeout(() => setResendMessage(""), 3000);
    } catch {
      // Error handled by store
    }
  };

  const canSubmit = otp.every((d) => d !== "");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Matching subtle background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--primary)/.08),var(--background)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)/.4_1px_transparent,transparent_1px),linear-gradient(to_bottom,var(--border)/.4_1px_transparent,transparent_1px)] bg-[size:24px_24px]"
        aria-hidden
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-[420px]"
      >
        <motion.div
          variants={item}
          className="rounded-2xl border border-border/80 bg-card/80 p-8 shadow-xl shadow-black/5 backdrop-blur-sm dark:border-border/60 dark:bg-card/60 dark:shadow-none"
        >
          <motion.div variants={item} className="mb-8 text-center">
            <Link
              href="/"
              className="font-space-grotesk text-2xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80 sm:text-3xl"
            >
              ChitkaraCV
            </Link>
          </motion.div>

          <motion.h1
            variants={item}
            className="font-instrument-serif tracking-wide mb-1 text-2xl text-foreground sm:text-3xl"
          >
            Verify your email
          </motion.h1>
          <motion.p
            variants={item}
            className="mb-8 font-manrope text-sm text-muted-foreground"
          >
            {name ? (
              <>
                Hi,{" "}
                <span className="font-medium text-foreground">{name}</span>. We
                sent a 6-digit code to{" "}
                <span className="text-foreground">{maskedEmail}</span>
              </>
            ) : (
              <>
                We sent a 6-digit code to{" "}
                <span className="text-foreground">{maskedEmail}</span>
              </>
            )}
          </motion.p>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}

          {/* Resend success message */}
          {resendMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400"
            >
              {resendMessage}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <motion.div
              variants={item}
              className="flex justify-center gap-2 sm:gap-3"
            >
              {otp.map((digit, index) => (
                <motion.input
                  name={`otp-${index}`}
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { delay: 0.12 + index * 0.035 },
                  }}
                  className="font-dm-mono h-14 w-12 rounded-xl border border-border bg-muted/40 text-center text-xl font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none sm:h-14 sm:w-12"
                />
              ))}
            </motion.div>

            <motion.div variants={item}>
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                className="font-space-grotesk w-full rounded-xl bg-foreground py-3.5 font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying…" : "Verify & continue"}
              </button>
            </motion.div>
          </form>

          <motion.p
            variants={item}
            className="mt-6 text-center font-manrope text-sm text-muted-foreground"
          >
            Didn&apos;t receive the code?{" "}
            {resendTimer > 0 ? (
              <span className="font-dm-mono text-xs text-muted-foreground/70">
                Resend in {resendTimer}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-foreground underline decoration-2 underline-offset-2 transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                Resend
              </button>
            )}
          </motion.p>

          <motion.p
            variants={item}
            className="mt-4 text-center font-manrope text-sm text-muted-foreground"
          >
            <Link
              href="/login"
              className="text-foreground transition-opacity hover:opacity-80"
            >
              ← Use a different email
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function VerifyFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyContent />
    </Suspense>
  );
}