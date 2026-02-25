"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function PersonalPage() {
  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    phone: "",
    contactEmail: "",
    city: "",
    state: "",
    linkedin: "",
    github: "",
    portfolio: "",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Section header */}
      <motion.div variants={item} className="mb-8">
        <p className="font-dm-mono text-[11px] uppercase tracking-[0.2em] text-primary/70">
          Step 1 of 5
        </p>
        <h1 className="font-instrument-serif mt-1 text-2xl tracking-wide text-foreground sm:text-3xl">
          Personal details
        </h1>
        <p className="font-manrope mt-2 text-sm leading-relaxed text-muted-foreground">
          Basic info that goes at the top of your resume. Make sure your contact
          details are accurate — recruiters will use these to reach you.
        </p>
      </motion.div>

      <form className="flex flex-col gap-8">
        {/* ─── Name & DOB ─── */}
        <motion.div variants={item} className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Full name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Aditya Saini"
              required
              className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Date of birth
            </label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
              className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </motion.div>

        {/* ─── Contact ─── */}
        <motion.div variants={item}>
          <h3 className="font-space-grotesk mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            Contact
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="font-dm-mono w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
                placeholder="aditya@gmail.com"
                required
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </motion.div>

        {/* ─── Location ─── */}
        <motion.div variants={item}>
          <h3 className="font-space-grotesk mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            Location
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                City
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="Chandigarh"
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                State
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                placeholder="Punjab"
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </motion.div>

        {/* ─── Links ─── */}
        <motion.div variants={item}>
          <h3 className="font-space-grotesk mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            Online profiles
          </h3>
          <div className="flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                LinkedIn
              </label>
              <input
                type="url"
                value={form.linkedin}
                onChange={(e) => update("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/aditya-saini"
                className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  GitHub
                </label>
                <input
                  type="url"
                  value={form.github}
                  onChange={(e) => update("github", e.target.value)}
                  placeholder="https://github.com/aditya-saini"
                  className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-manrope text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Portfolio
                </label>
                <input
                  type="url"
                  value={form.portfolio}
                  onChange={(e) => update("portfolio", e.target.value)}
                  placeholder="https://aditya.dev"
                  className="font-manrope w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Navigation ─── */}
        <motion.div
          variants={item}
          className="flex items-center justify-end border-t border-border/40 pt-6"
        >
          <Link
            href="/form/academic"
            className="font-space-grotesk inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-7 text-sm font-medium text-background shadow-md transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/30"
          >
            Next: Academics →
          </Link>
        </motion.div>
      </form>
    </motion.div>
  );
}