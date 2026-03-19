"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const sectionReveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const steps = [
  {
    num: "01",
    title: "Sign in",
    desc: "Use your @chitkara.edu.in email. We send a one-time code — no passwords.",
  },
  {
    num: "02",
    title: "Fill the form",
    desc: "Five guided sections: personal info, academics, skills, experience, summary.",
  },
  {
    num: "03",
    title: "Pick a template",
    desc: "Choose from 5 ATS-optimized layouts. Check your score before downloading.",
  },
  {
    num: "04",
    title: "Download PDF",
    desc: "Print-ready, recruiter-friendly. Upload to any job portal without formatting issues.",
  },
];

const features = [
  {
    title: "AI-written summary",
    desc: "Stuck on your professional summary? Our AI drafts one from your profile data in seconds.",
    span: "sm:col-span-2",
  },
  {
    title: "ATS score",
    desc: "See how applicant tracking systems read your resume. Get a score out of 100 with specific fixes.",
    span: "",
  },
  {
    title: "Auto-save",
    desc: "Your progress saves every few seconds. Close the tab, come back tomorrow — everything's there.",
    span: "",
  },
  {
    title: "Bullet enhancer",
    desc: "Weak project descriptions? One click rewrites them with action verbs and quantified impact.",
    span: "sm:col-span-2",
  },
  {
    title: "5 templates",
    desc: "Classic, Modern, Minimal, Academic, Technical. Each one designed to pass ATS filters and look clean on paper.",
    span: "sm:col-span-2",
  },
  {
    title: "University-only access",
    desc: "Restricted to Chitkara students. Your data stays private, your resume stays yours.",
    span: "",
  },
];

const stats = [
  { value: "6s", label: "Average time a recruiter spends on your resume" },
  { value: "75%", label: "Resumes rejected by ATS before a human sees them" },
  { value: "5", label: "Professional templates built for Indian placements" },
  { value: "<15m", label: "Time to build your complete resume on ChitkaraCV" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,var(--primary)/.08,transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)/.25_1px,transparent_1px),linear-gradient(to_bottom,var(--border)/.25_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black_20%,transparent_100%)]"
        aria-hidden
      />

      <main className="relative mx-auto max-w-5xl px-5 pb-32 pt-24 sm:px-8 sm:pt-32">
        {/* ═══════════════════════════════════════════════ */}
        {/* HERO                                           */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center"
        >
          <motion.div variants={item}>
            <Link
              href="/"
              className="font-akrobat text-3xl font-bold tracking-wider text-foreground transition-opacity hover:opacity-80 sm:text-5xl"
            >
              ChitkaraCV
            </Link>
          </motion.div>

          <motion.span
            variants={item}
            className="mt-4 inline-flex items-center rounded-full border border-border/70 bg-card/50 px-4 py-1.5 font-dm-mono text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur-sm"
          >
            for Chitkara University students
          </motion.span>

          <motion.h1
            variants={item}
            className="font-instrument-serif mt-8 max-w-3xl text-4xl leading-[1.15] tracking-wide text-foreground sm:text-5xl md:text-6xl"
          >
            Your resume shouldn&apos;t be
            <br className="hidden sm:block" />
            {" "}the reason you don&apos;t get called
          </motion.h1>

          <motion.p
            variants={item}
            className="font-manrope mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[17px]"
          >
            Guided form, AI-enhanced content, ATS-checked output.
            Build a placement-ready resume in under 15 minutes.
          </motion.p>

          <motion.div variants={item} className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="font-space-grotesk inline-flex h-12 items-center justify-center rounded-xl bg-foreground px-8 text-[15px] font-medium text-background shadow-lg shadow-black/8 transition-all hover:opacity-90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-foreground/30"
            >
              Create my resume →
            </Link>
            <a
              href="#how-it-works"
              className="font-manrope inline-flex h-12 items-center justify-center rounded-xl border border-border/80 bg-card/40 px-8 text-[15px] font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-card/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              How it works
            </a>
          </motion.div>

          <motion.p
            variants={item}
            className="mt-8 font-dm-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60"
          >
            Free · Auto-saves · Download anytime
          </motion.p>
        </motion.section>

        {/* ═══════════════════════════════════════════════ */}
        {/* STATS ROW                                      */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.section
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-24 sm:mt-32"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-2xl border border-border/60 bg-card/50 p-5 text-center backdrop-blur-sm"
              >
                <p className="font-neue-machina text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {stat.value}
                </p>
                <p className="font-manrope mt-1.5 text-xs leading-snug text-muted-foreground">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════ */}
        {/* THE PROBLEM                                    */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.section
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-20 sm:mt-28"
        >
          <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm sm:p-10">
            <div className="mx-auto max-w-2xl">
              <p className="font-dm-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">
                The problem
              </p>
              <h2 className="font-instrument-serif mt-3 text-2xl tracking-wide text-foreground sm:text-3xl">
                Most resumes never reach a human
              </h2>
              <p className="font-manrope mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Companies use Applicant Tracking Systems to filter resumes before
                anyone reads them. Wrong formatting, missing sections, or generic
                bullet points — your application gets auto-rejected. No feedback,
                no second chance.
              </p>
              <p className="font-manrope mt-3 text-[15px] leading-relaxed text-muted-foreground">
                ChitkaraCV fixes this. Every template is built to pass ATS scans.
                Every section is guided so you don&apos;t miss what matters. The AI
                helps you write content that stands out once it does reach the recruiter.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════ */}
        {/* HOW IT WORKS                                   */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.section
          id="how-it-works"
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-20 sm:mt-28"
        >
          <div className="mb-10 text-center">
            <p className="font-dm-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">
              Process
            </p>
            <h2 className="font-instrument-serif mt-2 text-2xl tracking-wide text-foreground sm:text-3xl">
              Four steps. Under fifteen minutes.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="group relative rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-border/90 hover:bg-card/70"
              >
                <span className="font-bogita-mono text-3xl font-medium text-primary/30 transition-colors group-hover:text-primary/50">
                  {s.num}
                </span>
                <h3 className="font-space-grotesk mt-3 text-sm font-semibold uppercase tracking-wider text-foreground">
                  {s.title}
                </h3>
                <p className="font-manrope mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════ */}
        {/* FEATURES — BENTO GRID                          */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.section
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-20 sm:mt-28"
        >
          <div className="mb-10 text-center">
            <p className="font-dm-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">
              Features
            </p>
            <h2 className="font-instrument-serif mt-2 text-2xl tracking-wide text-foreground sm:text-3xl">
              Built to remove the guesswork
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`group rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-border/90 hover:bg-card/70 ${f.span}`}
              >
                <h3 className="font-space-grotesk text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
                  {f.title}
                </h3>
                <p className="font-manrope mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════ */}
        {/* USE CASES                                      */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.section
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-20 sm:mt-28"
        >
          <div className="mb-10 text-center">
            <p className="font-dm-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">
              Use cases
            </p>
            <h2 className="font-instrument-serif mt-2 text-2xl tracking-wide text-foreground sm:text-3xl">
              Wherever you&apos;re applying
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Placement season",
                desc: "Campus drives, company forms, offline submissions. One resume that works everywhere.",
              },
              {
                title: "Internship applications",
                desc: "First internship? We help you frame projects and academics so they actually stand out.",
              },
              {
                title: "Off-campus roles",
                desc: "Applying outside Chitkara? ATS-friendly formatting means you get past the initial automated filter.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm"
              >
                <h3 className="font-space-grotesk text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
                  {card.title}
                </h3>
                <p className="font-manrope mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════ */}
        {/* PRO TIP                                        */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.section
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-20 sm:mt-28"
        >
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-6 sm:p-8">
            <p className="font-manrope mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              <span className="font-space-grotesk font-semibold text-foreground">
                Worth knowing —
              </span>{" "}
              Recruiters spend about 6 seconds scanning a resume. Clear section
              headers, strong opening bullets, and a clean single-column layout
              are what keep you in the pile. Every ChitkaraCV template is
              designed around this.
            </p>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════ */}
        {/* BOTTOM CTA                                     */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.section
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-24 sm:mt-32"
        >
          <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm">
            <div className="p-8 text-center sm:p-14">
              <p className="font-dm-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">
                Get started
              </p>
              <h2 className="font-instrument-serif mt-3 text-2xl tracking-wide text-foreground sm:text-3xl">
                Your next application deserves better
              </h2>
              <p className="font-manrope mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Sign in with your Chitkara email. We send a code, you fill the
                form, you download a resume. Under 15 minutes.
              </p>
              <Link
                href="/login"
                className="font-space-grotesk mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-foreground px-8 text-[15px] font-medium text-background shadow-lg shadow-black/8 transition-all hover:opacity-90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-foreground/30"
              >
                Create my resume →
              </Link>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════ */}
        {/* FOOTER                                         */}
        {/* ═══════════════════════════════════════════════ */}
        <footer className="mt-20 border-t border-border/40 pt-8 text-center">
          <p className="font-dm-mono text-[11px] tracking-wider text-muted-foreground/50">
            ChitkaraCV · Built by students, for students · Chitkara University
          </p>
        </footer>
      </main>
    </div>
  );
}