"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const features = [
  {
    title: "OTP-Based Auth",
    description: "Verify with your university email for secure, one-time access.",
  },
  {
    title: "5-Step Guided Form",
    description:
      "Personal → Academics → Skills & Projects → Experience → Summary.",
  },
  {
    title: "5 ATS-Compliant Templates",
    description: "Classic, Modern, Minimal, Academic, Technical — pick your style.",
  },
  {
    title: "AI Content Generation",
    description: "Auto-generate summaries and enhance bullet points with GPT.",
  },
  {
    title: "ATS Checker",
    description: "Rule-based + AI scoring with actionable suggestions.",
  },
  {
    title: "PDF Download",
    description: "Server-side generation — polished, print-ready resumes.",
  },
];

const steps = [
  { step: "01", label: "Sign in with your university email" },
  { step: "02", label: "Fill the guided 5-step form" },
  { step: "03", label: "Pick a template & run ATS check" },
  { step: "04", label: "Download your PDF resume" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeToggle />

      {/* Layered background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--primary)/.12),var(--background)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,var(--primary)/.06),transparent_70%]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)/.35_1px_transparent,transparent_1px),linear-gradient(to_bottom,var(--border)/.35_1px_transparent,transparent_1px)] bg-[size:28px_28px]"
        aria-hidden
      />

      <main className="relative mx-auto max-w-4xl px-4 pb-32 pt-28 sm:px-6 sm:pt-36">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center"
        >


          {/* Logo */}
          <motion.div variants={item} className="mb-4">
            <Link
              href="/"
              className="font-akrobat text-4xl font-semibold tracking-wide text-foreground transition-opacity normal-case tracking-wider hover:opacity-80 sm:text-5xl"
            >
              ChitkaraCV
            </Link>
          </motion.div>

          {/* Badge */}
          <motion.div
            variants={item}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-4 py-1.5 font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm"
          >
            For Chitkara University students
          </motion.div>

          {/* Hero */}
          <motion.h1
            variants={item}
            className="font-instrument-serif mb-5 max-w-2xl tracking-wide text-foreground sm:tracking-wider text-3xl sm:text-4xl md:text-5xl"
          >
            Build a resume that gets noticed
          </motion.h1>
          <motion.p
            variants={item}
            className="font-manrope mb-10 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            A structured, AI-enhanced resume builder for university students.
            Guided form, ATS-friendly templates, and one-click PDF — no design
            skills required.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="font-space-grotesk inline-flex h-12 items-center justify-center rounded-xl bg-foreground px-8 font-medium text-background shadow-lg shadow-black/10 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-black/15 focus:outline-none focus:ring-2 focus:ring-foreground/30 dark:shadow-black/20 dark:hover:shadow-black/30"
            >
              Get started
            </Link>
            <a
              href="#how-it-works"
              className="font-manrope inline-flex h-12 items-center justify-center rounded-xl border border-border bg-muted/40 px-8 font-medium text-foreground transition-colors hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              How it works
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.p
            variants={item}
            className="mt-8 font-manrope text-xs uppercase tracking-widest text-muted-foreground/80"
          >
            ATS-optimized · Auto-save · One-click PDF
          </motion.p>
        </motion.div>

        {/* How it works */}
        <motion.section
          id="how-it-works"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mt-28 sm:mt-36"
        >
          <h2 className="font-instrument-serif mb-10 text-center tracking-wide text-xl text-foreground sm:tracking-wider sm:text-2xl">
            How it works
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="group relative rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:border-border hover:shadow-md dark:border-border/60 dark:bg-card/60 dark:hover:border-border/80"
              >
                <span className="font-dm-mono text-2xl font-medium text-primary/80">
                  {s.step}
                </span>
                <p className="mt-2 font-manrope text-sm text-muted-foreground leading-relaxed">
                  {s.label}
                </p>
                {i < steps.length - 1 && (
                  <span
                    className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-muted-foreground/40 lg:block"
                    aria-hidden
                  >
                    →
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Problem statement card */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mt-20 sm:mt-28"
        >
          <div className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-lg shadow-black/5 backdrop-blur-sm dark:border-border/60 dark:bg-card/60 sm:p-8">
            <div className="border-l-4 border-primary/50 pl-5 sm:pl-6">
              <h2 className="font-instrument-serif mb-3 tracking-wide text-xl text-foreground sm:tracking-wider sm:text-2xl">
                Why ChitkaraCV?
              </h2>
              <p className="font-manrope text-sm leading-relaxed text-muted-foreground sm:text-base">
                Students often use inconsistent resume formats, which hurts ATS
                (Applicant Tracking System) compatibility and reduces interview
                chances. ChitkaraCV gives you a guided flow so every resume is
                structured, professional, and ATS-friendly — regardless of design
                experience.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Features grid */}
        <motion.section
          id="features"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mt-20 sm:mt-28"
        >
          <h2 className="font-instrument-serif mb-10 text-center tracking-wide text-xl text-foreground sm:tracking-wider sm:text-2xl">
            What you get
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.li
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="group rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:border-border hover:shadow-md dark:border-border/60 dark:bg-card/60 dark:hover:border-border/80"
              >
                <h3 className="font-space-grotesk mb-1.5 text-sm font-semibold uppercase tracking-wider text-foreground">
                  {feature.title}
                </h3>
                <p className="font-manrope text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* Bottom CTA */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mt-24 sm:mt-32"
        >
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/80 shadow-xl shadow-black/5 backdrop-blur-sm dark:border-border/60 dark:bg-card/60">
            <div className="bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-8 text-center sm:p-12">
              <h2 className="font-instrument-serif mb-3 tracking-wide text-xl text-foreground sm:tracking-wider sm:text-2xl">
                Ready to build your resume?
              </h2>
              <p className="font-manrope mb-8 text-sm text-muted-foreground">
                Sign in with your university email and get started in minutes.
              </p>
              <Link
                href="/login"
                className="font-space-grotesk inline-flex h-12 items-center justify-center rounded-xl bg-foreground px-8 font-medium text-background shadow-lg shadow-black/10 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-black/15 focus:outline-none focus:ring-2 focus:ring-foreground/30 dark:shadow-black/20 dark:hover:shadow-black/30"
              >
                Sign in to get started
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
