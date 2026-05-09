"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FileText, CheckCircle, ArrowRight, Shield } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const PIPELINE = [
  { label: "Ingest", desc: "Collect raw material" },
  { label: "Understand", desc: "Comprehend sources" },
  { label: "Map", desc: "Link to assignment" },
  { label: "Judge", desc: "Evaluate strength" },
  { label: "Build", desc: "Structure argument" },
  { label: "Draft", desc: "Compose with sources" },
  { label: "Refine", desc: "Review & validate" },
];

const EVIDENCE_TRAIL = [
  {
    stage: "Ingest",
    action: "Source text extracted and stored",
    status: "attached" as const,
  },
  {
    stage: "Understand",
    action: "Summaries reference original passages",
    status: "attached" as const,
  },
  {
    stage: "Map",
    action: "Evidence linked to assignment question",
    status: "attached" as const,
  },
  {
    stage: "Judge",
    action: "Gaps flagged against source base",
    status: "attached" as const,
  },
  {
    stage: "Build",
    action: "Every claim maps to a source",
    status: "attached" as const,
  },
  {
    stage: "Draft",
    action: "Inline citations verified while writing",
    status: "attached" as const,
  },
  {
    stage: "Refine",
    action: "Citation coverage scanned before submission",
    status: "attached" as const,
  },
];

export function GroundedGenerationSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      className="relative py-28 lg:py-36 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f8f9fc 0%, #eef2f8 100%)" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(186,152,88,0.04),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={prefersReducedMotion ? undefined : fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-[#0f284d]">
            Evidence stays attached{" "}
            <span className="text-[#ba9858]">through every stage.</span>
          </h2>
          <p className="mt-6 text-lg text-[#445f7c] leading-relaxed max-w-2xl mx-auto">
            Most tools check citations at the end. Polis carries the evidence trail forward
            from the first upload to the final review — so nothing gets fabricated along the way.
          </p>
        </motion.div>

        {/* Evidence pipeline — 7 stages */}
        <motion.div
          variants={prefersReducedMotion ? undefined : fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mb-16"
        >
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 lg:p-8 shadow-[0_1px_1px_rgba(15,40,77,0.04),0_8px_30px_rgba(15,40,77,0.04)]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-6 text-center">
              Evidence pipeline — grounding at every stage
            </div>

            {/* Desktop: horizontal pipeline */}
            <div className="hidden lg:grid grid-cols-7 gap-0 relative">
              <div
                className="absolute top-6 left-[7%] right-[7%] h-px"
                style={{
                  background: "linear-gradient(90deg, #ba9858 0%, #ba9858 100%)",
                  opacity: 0.2,
                }}
              />
              <div
                className="absolute top-6 left-[7%] right-[7%] h-px"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, #ba9858 0px, #ba9858 4px, transparent 4px, transparent 12px)",
                  opacity: 0.35,
                }}
              />
              {PIPELINE.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center relative">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 relative z-10 border shadow-sm transition-all ${
                      i === 0
                        ? "bg-[#445f7c] border-[#445f7c] text-white"
                        : i === PIPELINE.length - 1
                        ? "bg-[#0f284d] border-[#0f284d] text-white"
                        : i >= 2 && i <= 4
                        ? "bg-white border-[#ba9858]/40 text-[#ba9858]"
                        : "bg-white border-[#e2e8f0] text-[#445f7c]"
                    }`}
                  >
                    <span className="text-[11px] font-bold">0{i + 1}</span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div className="hidden lg:flex absolute top-6 -right-0.5 z-20 items-center justify-center w-3 h-3">
                      <ArrowRight className="w-2.5 h-2.5 text-[#ba9858]/40" />
                    </div>
                  )}
                  <div className="text-[11px] font-semibold text-[#0f284d] mb-1">{step.label}</div>
                  <div className="text-[10px] text-[#94a3b8] leading-snug">{step.desc}</div>
                </div>
              ))}
            </div>

            {/* Mobile: vertical pipeline */}
            <div className="lg:hidden space-y-3">
              {PIPELINE.map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                      i === 0
                        ? "bg-[#445f7c] border-[#445f7c] text-white"
                        : i === PIPELINE.length - 1
                        ? "bg-[#0f284d] border-[#0f284d] text-white"
                        : i >= 2 && i <= 4
                        ? "bg-white border-[#ba9858]/40 text-[#ba9858]"
                        : "bg-white border-[#e2e8f0] text-[#445f7c]"
                    }`}
                  >
                    <span className="text-[10px] font-bold">0{i + 1}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0f284d]">{step.label}</div>
                    <div className="text-[11px] text-[#94a3b8]">{step.desc}</div>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-[#ba9858]/40 ml-auto shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Evidence trail — how grounding persists */}
        <motion.div
          variants={prefersReducedMotion ? undefined : fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl border border-[#ba9858]/20 bg-white p-6 lg:p-8 shadow-[0_1px_1px_rgba(15,40,77,0.03),0_8px_30px_rgba(186,152,88,0.06)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-[#ba9858]" />
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#ba9858]">
                  Evidence trail — stage by stage
                </div>
              </div>
              <div className="space-y-2">
                {EVIDENCE_TRAIL.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-[#f1f5f9] bg-[#fafbfc]"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#ba9858]/10 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-[#ba9858]">0{i + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-[#0f284d]">{item.stage}</span>
                      <span className="text-[11px] text-[#94a3b8] mx-1.5">·</span>
                      <span className="text-[11px] text-[#445f7c]">{item.action}</span>
                    </div>
                    <CheckCircle className="w-3.5 h-3.5 text-[#2F6B4A] shrink-0" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-3">
                Writing canvas — POL2028 Research Methods
              </div>
              <div className="space-y-3 text-sm text-[#334155] leading-relaxed">
                <p>
                  The convergence of disciplinary power and digital surveillance represents a
                  qualitative shift in governance mechanisms.{" "}
                  <span className="inline-flex items-center gap-1 bg-[#ba9858]/15 text-[#ba9858] text-[10px] font-medium px-2 py-0.5 rounded-full align-middle">
                    <FileText className="w-2.5 h-2.5" />
                    Foucault, 1975 · pp. 195–228
                  </span>
                </p>
                <p>
                  Zuboff extends this by demonstrating how behavioural surplus is extracted through
                  opaque computational processes.{" "}
                  <span className="inline-flex items-center gap-1 bg-[#ba9858]/15 text-[#ba9858] text-[10px] font-medium px-2 py-0.5 rounded-full align-middle">
                    <FileText className="w-2.5 h-2.5" />
                    Zuboff, 2019 · Ch. 3
                  </span>
                </p>
              </div>
              <div className="mt-5 rounded-xl border border-[#f59e0b]/30 bg-[#fffbeb] p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#92400e] mb-1.5">
                  <div className="w-3.5 h-3.5 rounded-full border border-[#f59e0b] flex items-center justify-center shrink-0">
                    <div className="w-1 h-1 rounded-full bg-[#f59e0b]" />
                  </div>
                  Evidence gap flagged
                </div>
                <p className="text-[12px] text-[#92400e]/80 leading-relaxed">
                  The claim about &quot;instrumentarian power operating through prediction markets&quot; lacks
                  direct support from uploaded sources. Consider adding Pasquale (2015) or verifying
                  in Zuboff Ch. 8.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-[10px] text-[#445f7c] border border-[#e2e8f0] rounded-full px-2.5 py-1 flex items-center gap-1.5 bg-white">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2F6B4A]" />
                  2 claims sourced
                </span>
                <span className="text-[10px] text-[#445f7c] border border-[#e2e8f0] rounded-full px-2.5 py-1 flex items-center gap-1.5 bg-white">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  1 gap flagged
                </span>
                <span className="text-[10px] text-[#445f7c] border border-[#e2e8f0] rounded-full px-2.5 py-1 flex items-center gap-1.5 bg-white">
                  <CheckCircle className="w-2.5 h-2.5 text-[#2F6B4A]" />
                  Brief alignment confirmed
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
