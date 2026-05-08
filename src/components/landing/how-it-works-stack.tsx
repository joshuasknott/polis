"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
} from "framer-motion";
import {
  Info,
  BookOpen,
  FileText,
  Map,
  PenTool,
  Edit3,
} from "lucide-react";

const PHASES = [
  { label: "Context Intake", range: [0, 2] as const },
  { label: "Assignment Mapping", range: [3, 3] as const },
  { label: "Writing System", range: [4, 5] as const },
];

const STAGES = [
  {
    id: 0,
    label: "Module Info",
    icon: Info,
    phase: 0,
    headline: "Extract the control layer",
    body: "Upload or paste the module description, assessment briefs, grade descriptors, marking criteria, deadlines, and course structure. Polis extracts the important information automatically and creates the control layer for the module.",
    visual: {
      title: "POL2028 Research Methods",
      items: [
        { label: "Assessment: 3,000-word essay (60%) + presentation (40%)", type: "info" as const },
        { label: "Marking criteria: argument, evidence, analysis, structure", type: "info" as const },
        { label: "Deadline: Week 12 · Dr. Sarah Chen", type: "info" as const },
        { label: "Learning outcomes: 4 extracted", type: "info" as const },
      ],
    },
  },
  {
    id: 1,
    label: "Sources",
    icon: BookOpen,
    phase: 0,
    headline: "Build the broad knowledge base",
    body: "Drop journal articles, book chapters, PDFs, reports, datasets, primary texts, policy documents, and cases. Sources remain broad and context-rich — Polis preserves the full base so it can make connections later.",
    visual: {
      title: "Source Library — 6 sources",
      items: [
        { label: "Foucault — Discipline and Punish.pdf", type: "source" as const },
        { label: "Zuboff — Surveillance Capitalism.pdf", type: "source" as const },
        { label: "Scott — Seeing Like a State.pdf", type: "source" as const },
        { label: "Dean — Governmentality.pdf", type: "source" as const },
        { label: "HMGOV Policy Report 2023.pdf", type: "source" as const },
        { label: "Pasquale — The Black Box Society.pdf", type: "source" as const },
      ],
    },
  },
  {
    id: 2,
    label: "Module Notes",
    icon: FileText,
    phase: 0,
    headline: "Turn lecture dumps into structured themes",
    body: "Paste lecture slides, seminar notes, tutorial notes, student notes, and rough ideas from class. Polis extracts concepts, theories, methods, recurring arguments, lecture themes, and seminar points.",
    visual: {
      title: "Extracted themes — Week 1–8",
      items: [
        { label: "Theme: Power, surveillance, and the state", type: "theme" as const },
        { label: "Theory: Foucauldian disciplinary power", type: "theme" as const },
        { label: "Concept: Governmentality and population management", type: "theme" as const },
        { label: "Recurring tension: legibility vs. resistance", type: "theme" as const },
      ],
    },
  },
  {
    id: 3,
    label: "Evidence Map",
    icon: Map,
    phase: 1,
    headline: "Map evidence to each assignment",
    body: "Polis extracts source-level evidence, claims, methods, quotes, cases, concepts, and counterpoints — then maps them against the current assignment brief. Separate evidence streams if a module has multiple coursework tasks.",
    visual: {
      title: "Evidence Map — Essay 1",
      items: [
        { label: "Panopticism as metaphor — Foucault pp. 195–228", type: "evidence" as const },
        { label: "Behavioural surplus — Zuboff Ch. 3", type: "evidence" as const },
        { label: "Legibility & state simplification — Scott pp. 1–52", type: "evidence" as const },
        { label: "Counter: Resistance through opacity — Scott Ch. 2", type: "counter" as const },
      ],
    },
  },
  {
    id: 4,
    label: "Argument Map",
    icon: PenTool,
    phase: 2,
    headline: "Build argument structure from evidence",
    body: "Establish the student's critical angle, argument structure, point-by-point plan, source-to-claim mapping, evidence placement, and counterarguments. Polis queries the student: \"What angle do you want to take?\" — preventing directionless output.",
    visual: {
      title: "Argument Map — Digital Governance Essay",
      items: [
        { label: "Angle: Institutional failure, not just technological change", type: "plan" as const },
        { label: "Point 1: Panopticism as architectural metaphor → Foucault", type: "plan" as const },
        { label: "Point 2: Behavioural surplus extraction → Zuboff", type: "plan" as const },
        { label: "Counterargument: Resistance through illegibility → Scott", type: "counter" as const },
      ],
    },
  },
  {
    id: 5,
    label: "Draft & Refine",
    icon: Edit3,
    phase: 2,
    headline: "Write with evidence still attached",
    body: "Draft from the argument map, refine paragraphs, keep source links attached, suggest where evidence belongs, flag unsupported claims, and run scans for grammar, missing citations, evidence gaps, and assignment alignment.",
    visual: {
      title: "Writing Canvas — Draft in progress",
      items: [
        { label: "¶ The convergence of disciplinary power and digital surveillance…", type: "writing" as const },
        { label: "↳ Foucault, 1975 · pp. 195–228  ✓ sourced", type: "citation" as const },
        { label: "¶ Zuboff extends this by demonstrating behavioural surplus…", type: "writing" as const },
        { label: "⚠ 1 claim needs source support — review flagged", type: "warning" as const },
      ],
    },
  },
];

const AUTOPLAY_INTERVAL = 6000;
const PAUSE_DURATION = 12000;

export function HowItWorksStack() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleManualSelect = useCallback((idx: number) => {
    setActiveStep(idx);
    setIsPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setIsPaused(false), PAUSE_DURATION);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STAGES.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [isPaused, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        handleManualSelect((activeStep + 1) % STAGES.length);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        handleManualSelect((activeStep - 1 + STAGES.length) % STAGES.length);
      }
    },
    [activeStep, handleManualSelect]
  );

  const activeStage = STAGES[activeStep];

  const typeStyles: Record<string, { dot: string; badge?: string }> = {
    info: { dot: "bg-[#445f7c]" },
    source: { dot: "bg-[#445f7c]" },
    theme: { dot: "bg-[#0f284d]" },
    evidence: { dot: "bg-[#ba9858]", badge: "Essay 1" },
    counter: { dot: "bg-[#94a3b8]", badge: "Counter" },
    plan: { dot: "bg-[#0f284d]", badge: "Sourced" },
    writing: { dot: "bg-[#0f284d]" },
    citation: { dot: "bg-[#ba9858]" },
    warning: { dot: "bg-[#f59e0b]" },
  };

  return (
    <MotionConfig
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 260, damping: 30, mass: 0.8 }
      }
    >
      <section
        id="how-it-works"
        className="relative py-28 lg:py-36 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #f8f9fc 0%, #ffffff 100%)" }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-[#0f284d]">
              Six stages.{" "}
              <span className="text-[#ba9858]">One workspace.</span>
            </h2>
            <p className="mt-6 text-lg text-[#445f7c] leading-relaxed max-w-xl mx-auto">
              From messy module inputs to grounded final coursework. Each stage builds on the last,
              keeping evidence connected throughout.
            </p>
          </div>

          {/* Coursework Intelligence Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-start">
            {/* Left: vertical stage navigation with phase groups */}
            <div
              className="lg:col-span-4 lg:pr-8"
              role="tablist"
              aria-label="Workflow stages"
              onKeyDown={handleKeyDown}
            >
              {PHASES.map((phase, pi) => (
                <div key={pi} className="mb-6 last:mb-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2 px-4">
                    {phase.label}
                  </div>
                  <div className="space-y-1">
                    {STAGES.filter((_, i) => i >= phase.range[0] && i <= phase.range[1]).map(
                      (stage) => {
                        const isActive = activeStep === stage.id;
                        const isPast = stage.id < activeStep;
                        return (
                          <button
                            key={stage.id}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`stage-panel-${stage.id}`}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => handleManualSelect(stage.id)}
                            className={`group w-full text-left p-3.5 rounded-xl transition-all duration-200 border outline-none focus-visible:ring-2 focus-visible:ring-[#0f284d] focus-visible:ring-offset-2 ${
                              isActive
                                ? "bg-white border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,40,77,0.04),0_8px_24px_rgba(15,40,77,0.06)]"
                                : "bg-transparent border-transparent hover:bg-white/60"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                  isActive
                                    ? "bg-[#0f284d] text-white shadow-sm"
                                    : isPast
                                    ? "bg-[#0f284d]/10 text-[#0f284d]"
                                    : "bg-[#f1f5f9] text-[#94a3b8] group-hover:bg-[#e2e8f0] group-hover:text-[#445f7c]"
                                }`}
                              >
                                <stage.icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-[#cbd5e1] tabular-nums">
                                  0{stage.id + 1}
                                </span>
                                <h3
                                  className={`text-sm font-semibold transition-colors ${
                                    isActive ? "text-[#0f284d]" : "text-[#445f7c]"
                                  }`}
                                >
                                  {stage.label}
                                </h3>
                              </div>
                              {isActive && stage.id >= 3 && (
                                <span className="ml-auto text-[9px] font-medium text-[#ba9858] bg-[#ba9858]/10 px-2 py-0.5 rounded-full shrink-0">
                                  mapped
                                </span>
                              )}
                            </div>
                            {isActive && (
                              <motion.div
                                layoutId="step-progress"
                                className="mt-2.5 ml-9 h-0.5 bg-[#ba9858] rounded-full origin-left"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{
                                  duration: isPaused
                                    ? PAUSE_DURATION / 1000
                                    : AUTOPLAY_INTERVAL / 1000,
                                  ease: "linear",
                                }}
                                key={`progress-${activeStep}-${isPaused}`}
                              />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: large product surface */}
            <div className="lg:col-span-8">
              <div
                className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_1px_1px_rgba(15,40,77,0.04),0_20px_70px_rgba(15,40,77,0.06)] overflow-hidden"
                id={`stage-panel-${activeStage.id}`}
                role="tabpanel"
                aria-labelledby={`stage-tab-${activeStage.id}`}
              >
                {/* Panel title bar */}
                <div className="h-11 border-b border-[#f1f5f9] bg-[#fafbfc] flex items-center px-5 gap-3 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]" />
                  </div>
                  <div className="text-[11px] font-medium text-[#94a3b8] ml-2">
                    {activeStage.label}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {activeStage.id >= 3 && (
                      <span className="text-[9px] font-medium text-[#ba9858] bg-[#ba9858]/10 px-2 py-0.5 rounded-full">
                        assignment-mapped
                      </span>
                    )}
                    <span className="text-[10px] text-[#cbd5e1] font-medium">POL2028</span>
                  </div>
                </div>

                {/* Panel content */}
                <div className="p-6 lg:p-8 min-h-[420px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStage.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <h4 className="text-lg font-semibold text-[#0f284d] mb-2">
                        {activeStage.headline}
                      </h4>
                      <p className="text-sm text-[#445f7c] mb-6 leading-relaxed max-w-xl">
                        {activeStage.body}
                      </p>

                      {/* Visual: product-like artifact list */}
                      <div className="rounded-xl border border-[#f1f5f9] bg-[#fafbfc] overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-[#f1f5f9] flex items-center gap-2">
                          <activeStage.icon className="w-3.5 h-3.5 text-[#445f7c]" />
                          <span className="text-[11px] font-semibold text-[#0f284d]">
                            {activeStage.visual.title}
                          </span>
                        </div>
                        <div className="divide-y divide-[#f1f5f9]">
                          {activeStage.visual.items.map((item, ai) => {
                            const style = typeStyles[item.type] || { dot: "bg-[#94a3b8]" };
                            return (
                              <motion.div
                                key={ai}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: ai * 0.06, duration: 0.25 }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white transition-colors"
                              >
                                <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                                <span className="text-sm text-[#334155] flex-1 leading-snug">
                                  {item.label}
                                </span>
                                {style.badge && (
                                  <span
                                    className={`text-[9px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                                      item.type === "counter"
                                        ? "text-[#445f7c] border border-[#e2e8f0]"
                                        : item.type === "evidence"
                                        ? "text-[#445f7c] border border-[#e2e8f0]"
                                        : "bg-[#ba9858] text-white"
                                    }`}
                                  >
                                    {style.badge}
                                  </span>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* What this unlocks */}
                      <div className="mt-6 flex items-center gap-3 text-[11px]">
                        <div className="h-px flex-1 bg-gradient-to-r from-[#ba9858]/30 to-transparent" />
                        <span className="text-[#ba9858] font-medium uppercase tracking-wider">
                          {activeStage.id <= 2
                            ? "Context captured"
                            : activeStage.id === 3
                            ? "Evidence mapped to assignment"
                            : "Writing with sources attached"}
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-l from-[#ba9858]/30 to-transparent" />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
