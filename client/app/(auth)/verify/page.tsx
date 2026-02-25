"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

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

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const name = searchParams.get("name") ?? "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maskedEmail = email
    ? `${email.slice(0, 2)}***@${email.split("@")[1] ?? ""}`
    : "your email";

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) {
        const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
        const next = [...otp];
        digits.forEach((d, i) => {
          if (index + i < OTP_LENGTH) next[index + i] = d;
        });
        setOtp(next);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) return;
    setIsSubmitting(true);
    // TODO: call POST /api/auth/verify-otp with { email, otp: code }
    setTimeout(() => {
      router.push("/form/personal");
      setIsSubmitting(false);
    }, 600);
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
          <motion.p variants={item} className="mb-8 font-manrope text-sm text-muted-foreground">
            {name ? (
              <>
                Hi, <span className="font-medium text-foreground">{name}</span>. We sent a 6-digit
                code to <span className="text-foreground">{maskedEmail}</span>
              </>
            ) : (
              <>
                We sent a 6-digit code to{" "}
                <span className="text-foreground">{maskedEmail}</span>
              </>
            )}
          </motion.p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <motion.div variants={item} className="flex justify-center gap-2 sm:gap-3">
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
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { delay: 0.12 + index * 0.035 },
                  }}
                  className="font-dm-mono h-14 w-12 rounded-xl border border-border bg-muted/40 text-center text-xl font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none sm:h-14 sm:w-12"
                />
              ))}
            </motion.div>

            <motion.div variants={item}>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="font-space-grotesk w-full rounded-xl bg-foreground py-3.5 font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Verifying…" : "Verify & continue"}
              </button>
            </motion.div>
          </form>

          <motion.p
            variants={item}
            className="mt-6 text-center font-manrope text-sm text-muted-foreground"
          >
            Didn’t receive the code?{" "}
            <button
              type="button"
              className="text-foreground underline decoration-2 underline-offset-2 transition-opacity hover:opacity-80"
            >
              Resend
            </button>
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
