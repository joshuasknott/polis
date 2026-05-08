"use client";

import Link from "next/link";
import { motion, MotionConfig, useReducedMotion } from "framer-motion";
import {
  FileText,
  BookOpen,
  GraduationCap,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const springTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 0.8,
};

const MESSY_INPUTS = [
  { icon: GraduationCap, label: "Assessment brief & grade descriptors" },
  { icon: BookOpen, label: "Journal articles, PDFs & reports" },
  { icon: FileText, label: "Lecture slides & seminar notes" },
  { icon: Lightbulb, label: "Rough ideas & reading notes" },
];

const EXTRACTION_ITEMS = [
  "Module requirements & deadlines",
  "Key themes across sources",
  "Assignment-relevant evidence",
  "Evidence gaps flagged",
];

const OUTPUT_ITEMS = [
  { label: "Argument structure with student angle", sourced: true },
  { label: "Point-by-point coursework plan", sourced: true },
  { label: "Source-linked writing canvas", sourced: true },
  { label: "2 unsupported claims flagged", sourced: false },
];

export function HeroSandboxWorkspace() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionConfig transition={prefersReducedMotion ? { duration: 0 } : springTransition}>
      <section
        className="relative min-h-screen overflow-hidden"
        style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8f9fc 100%)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(15,40,77,0.04),transparent)]" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-44 pb-20 lg:pb-28">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-[-0.04em] leading-[0.95] font-semibold text-[#0f284d]"
            >
              Turn coursework chaos{" "}
              <span className="text-[#ba9858]">into source-backed writing.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-8 text-base sm:text-lg lg:text-xl text-[#445f7c] leading-8 max-w-2xl mx-auto"
            >
              Upload module briefs, sources, lecture notes, and rough ideas. Polis extracts what
              matters, maps evidence to each assignment, and helps you plan and write with the
              sources still attached.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0f284d] px-8 text-sm font-medium text-white shadow-lg transition-all hover:bg-[#162f58] hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f284d] focus-visible:ring-offset-2"
              >
                Open Workspace
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#e2e8f0] px-8 text-sm font-medium text-[#445f7c] transition-all hover:bg-[#f8f9fc] hover:border-[#cbd5e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f284d] focus-visible:ring-offset-2"
              >
                See how it works
              </a>
            </motion.div>
          </div>

          {/* Product canvas — single large surface showing the transformation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-16 lg:mt-24 mx-auto max-w-6xl"
          >
            <div className="rounded-[2rem] border border-[#e2e8f0] bg-white shadow-[0_24px_90px_rgba(15,40,77,0.08)] overflow-hidden">
              {/* Window chrome */}
              <div className="h-10 border-b border-[#f1f5f9] bg-[#f8fafc] flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-[11px] text-[#94a3b8] font-medium">
                    polis.workspace / POL2028 Research Methods
                  </span>
                </div>
                <div className="w-14" />
              </div>

              {/* Three-column transformation: Inputs → Extraction → Output */}
              <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[380px]">
                {/* Left: messy inputs */}
                <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-[#f1f5f9]">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-5">
                    Messy inputs
                  </div>
                  <div className="space-y-2.5">
                    {MESSY_INPUTS.map((input, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.55 + i * 0.08, duration: 0.3 }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[#f1f5f9] bg-[#fafbfc]"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#f1f5f9] flex items-center justify-center shrink-0">
                          <input.icon className="w-3.5 h-3.5 text-[#94a3b8]" />
                        </div>
                        <span className="text-[13px] text-[#64748b] leading-snug">{input.label}</span>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.95 }}
                    className="mt-5 flex items-center gap-2 text-[11px] text-[#94a3b8]"
                  >
                    <div className="h-px flex-1 bg-[#e2e8f0]" />
                    <span>messy, unstructured, real</span>
                    <div className="h-px flex-1 bg-[#e2e8f0]" />
                  </motion.div>
                </div>

                {/* Center: Polis extraction */}
                <div className="p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-[#f1f5f9] bg-[#fafbfc]">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-5 h-5 rounded-md bg-[#ba9858]/15 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ba9858]" />
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#ba9858]">
                      Polis extracts & maps
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {EXTRACTION_ITEMS.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.75 + i * 0.08, duration: 0.3 }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[#ba9858]/10 bg-white"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ba9858] shrink-0" />
                        <span className="text-[13px] text-[#445f7c] leading-snug">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                  {/* Subtle connector line */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="mt-5 flex items-center gap-2"
                  >
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ba9858]/30 to-transparent" />
                  </motion.div>
                </div>

                {/* Right: structured output */}
                <div className="p-6 lg:p-8">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">
                    What comes out
                  </div>
                  <div className="text-[11px] font-semibold text-[#0f284d] mb-5">
                    Argument Map — POL2028 Assignment
                  </div>
                  <div className="space-y-2">
                    {OUTPUT_ITEMS.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.0 + i * 0.08, duration: 0.3 }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[#f1f5f9] bg-[#fafbfc]"
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            item.sourced ? "bg-[#ba9858]/15" : "bg-[#f59e0b]/15"
                          }`}
                        >
                          {item.sourced ? (
                            <CheckCircle className="w-2.5 h-2.5 text-[#ba9858]" />
                          ) : (
                            <AlertTriangle className="w-2.5 h-2.5 text-[#f59e0b]" />
                          )}
                        </div>
                        <span className="text-[13px] text-[#334155] flex-1 leading-snug">{item.label}</span>
                        {item.sourced && (
                          <span className="text-[9px] font-medium bg-[#ba9858] text-white px-1.5 py-0.5 rounded-full shrink-0">
                            sourced
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="mt-5 flex items-center gap-2 text-[11px] text-[#ba9858]"
                  >
                    <div className="h-px flex-1 bg-gradient-to-r from-[#ba9858]/40 to-transparent" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ba9858]" />
                      <span className="font-medium">Evidence trail active</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-[#ba9858]/40 to-transparent" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
