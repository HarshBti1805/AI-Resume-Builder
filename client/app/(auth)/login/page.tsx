"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !rollNumber.trim()) return;

    try {
      await sendOtp(email.trim());

      // OTP sent successfully — redirect to verify page with params
      const params = new URLSearchParams({
        email: email.trim(),
        name: name.trim(),
        roll: rollNumber.trim(),
      });
      router.push(`/verify?${params.toString()}`);
    } catch {
      // Error is already set in the store
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Subtle background */}
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
            className="font-instrument-serif mb-1 text-2xl text-foreground sm:text-3xl"
          >
            Sign in
          </motion.h1>
          <motion.p
            variants={item}
            className="mb-8 font-manrope text-sm text-muted-foreground"
          >
            Enter your details to receive a one-time code at your university
            email.
          </motion.p>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              {error}
              <button
                onClick={clearError}
                className="ml-2 font-medium underline"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <motion.div variants={item}>
              <label
                htmlFor="name"
                className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aditya Saini"
                required
                autoComplete="name"
                disabled={isLoading}
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </motion.div>

            <motion.div variants={item}>
              <label
                htmlFor="roll"
                className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Roll number
              </label>
              <input
                id="roll"
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="2310990001"
                required
                autoComplete="off"
                disabled={isLoading}
                className="font-dm-mono w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </motion.div>

            <motion.div variants={item}>
              <label
                htmlFor="email"
                className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                University email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aditya0001.be23@chitkara.edu.in"
                required
                autoComplete="email"
                disabled={isLoading}
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </motion.div>

            <motion.div variants={item} className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="font-space-grotesk w-full rounded-xl bg-foreground py-3.5 font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending code…" : "Send verification code"}
              </button>
            </motion.div>
          </form>

          <motion.p
            variants={item}
            className="mt-8 text-center font-manrope text-sm text-muted-foreground"
          >
            <Link
              href="/"
              className="text-foreground transition-opacity hover:opacity-80"
            >
              ← Back to home
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}