"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
} from "framer-motion";
import {
  Download,
  BookOpen,
  Map,
  Scale,
  Hammer,
  PenTool,
  Sparkles,
} from "lucide-react";

const PHASES = [
  { label: "Understand your material", range: [0, 1] as const },
  { label: "Build your argument", range: [2, 4] as const },
  { label: "Produce your submission", range: [5, 6] as const },
];

const STAGES = [
  {
    id: 0,
    label: "Ingest",
    icon: Download,
    phase: 0,
    headline: "Collect raw material into the module workspace",
    body: "Upload PDFs, DOCXs, slides, assignment briefs, and rough notes. Polis extracts text, chunks it for retrieval, and stores everything inside the module — the broad knowledge base that all assignments will draw from.",
    visual: {
      title: "Module — POL2028 Research Methods",
      items: [
        { label: "Foucault — Discipline and Punish.pdf  ✓ extracted", type: "source" as const },
        { label: "Zuboff — Surveillance Capitalism.pdf  ✓ extracted", type: "source" as const },
        { label: "Scott — Seeing Like a State.pdf  ✓ extracted", type: "source" as const },
        { label: "Week 1–8 lecture slides  ✓ chunked", type: "notes" as const },
        { label: "Assignment brief uploaded", type: "info" as const },
      ],
    },
    unlocks: "Raw material collected — nothing lost",
    risk: "No AI interpretation yet — zero hallucination risk",
  },
  {
    id: 1,
    label: "Understand",
    icon: BookOpen,
    phase: 0,
    headline: "Comprehend individual sources",
    body: "Polis generates reading summaries, identifies key concepts and main arguments within each source. Students can query individual sources to deepen understanding before connecting ideas across the module.",
    visual: {
      title: "Source Understanding — 6 sources analysed",
      items: [
        { label: "Foucault: disciplinary power, panopticism, docile bodies", type: "theme" as const },
        { label: "Zuboff: behavioural surplus, surveillance capitalism, instrumentarian power", type: "theme" as const },
        { label: "Scott: legibility, state simplification, resistance through opacity", type: "theme" as const },
        { label: "3 key tensions identified across module readings", type: "info" as const },
      ],
    },
    unlocks: "Individual sources understood",
    risk: "Summaries reference uploaded text — grounded by design",
  },
  {
    id: 2,
    label: "Map",
    icon: Map,
    phase: 1,
    headline: "Connect ideas across sources for the assignment",
    body: "Map evidence, themes, theories, and counterarguments from the module's sources against the assignment question. Polis highlights connections, tensions, and gaps — filtering the broad module base to what's relevant for this specific piece of coursework.",
    visual: {
      title: "Evidence Map — Essay 1: Digital Governance",
      items: [
        { label: "Panopticism as architectural metaphor — Foucault pp. 195–228", type: "evidence" as const },
        { label: "Behavioural surplus extraction — Zuboff Ch. 3", type: "evidence" as const },
        { label: "State legibility & simplification — Scott pp. 1–52", type: "evidence" as const },
        { label: "Counter: Resistance through opacity — Scott Ch. 2", type: "counter" as const },
        { label: "⚠ Gap: No source on post-2020 digital regulation", type: "warning" as const },
      ],
    },
    unlocks: "Evidence mapped to assignment question",
    risk: "Mapping draws only from uploaded sources",
  },
  {
    id: 3,
    label: "Judge",
    icon: Scale,
    phase: 1,
    headline: "Evaluate argument strength and evidence sufficiency",
    body: "Before building the argument, assess whether the evidence is strong enough. Polis flags gaps, identifies weak counterarguments, checks evidence sufficiency against the rubric, and warns where the source base falls short.",
    visual: {
      title: "Judgement Panel — Evidence Assessment",
      items: [
        { label: "✓ Core claim: 3 sources with direct textual support", type: "evidence" as const },
        { label: "✓ Counterargument: Scott Ch. 2 provides adequate challenge", type: "evidence" as const },
        { label: "⚠ Weakness: Zuboff claim on prediction markets under-supported", type: "warning" as const },
        { label: "Rubric check: 'critical analysis' criterion — 2 of 4 descriptors met", type: "info" as const },
      ],
    },
    unlocks: "Evidence sufficiency evaluated before writing",
    risk: "Warns about gaps — does not fabricate evidence to fill them",
  },
  {
    id: 4,
    label: "Build",
    icon: Hammer,
    phase: 1,
    headline: "Structure the argument from evidence",
    body: "Establish the student's critical angle, build a point-by-point argument structure, allocate evidence to each claim, plan sections, and set word budgets. The student chooses the direction — Polis structures it from the available evidence.",
    visual: {
      title: "Argument Map — Digital Governance Essay",
      items: [
        { label: "Angle: Institutional failure, not just technological change", type: "plan" as const },
        { label: "Point 1: Panopticism as architectural metaphor → Foucault", type: "plan" as const },
        { label: "Point 2: Behavioural surplus extraction → Zuboff", type: "plan" as const },
        { label: "Point 3: Legibility as prerequisite → Scott", type: "plan" as const },
        { label: "Counter: Resistance through illegibility → Scott Ch. 2", type: "counter" as const },
      ],
    },
    unlocks: "Argument structured with evidence allocated",
    risk: "Every claim in the plan links to a specific source",
  },
  {
    id: 5,
    label: "Draft",
    icon: PenTool,
    phase: 2,
    headline: "Compose with sources still attached",
    body: "Write from the argument map in a source-linked canvas. As the student composes, Polis shows which sources support each paragraph, suggests where evidence should be cited, and keeps inline source references attached throughout drafting.",
    visual: {
      title: "Writing Canvas — Draft in progress",
      items: [
        { label: "¶ The convergence of disciplinary power and digital surveillance…", type: "writing" as const },
        { label: "↳ Foucault, 1975 · pp. 195–228  ✓ sourced", type: "citation" as const },
        { label: "¶ Zuboff extends this by demonstrating behavioural surplus…", type: "writing" as const },
        { label: "↳ Zuboff, 2019 · Ch. 3  ✓ sourced", type: "citation" as const },
      ],
    },
    unlocks: "Draft composed — every paragraph source-linked",
    risk: "Inline citations verified against uploaded material",
  },
  {
    id: 6,
    label: "Refine",
    icon: Sparkles,
    phase: 2,
    headline: "Review, validate, and polish",
    body: "Run the draft against the rubric, check citation coverage, flag unsupported claims, identify structural weaknesses, and get revision priorities. Polis reviews like a supervisor — it does not rewrite for the student.",
    visual: {
      title: "Refinement Report — Essay 1",
      items: [
        { label: "✓ 8 of 9 claims have direct source support", type: "evidence" as const },
        { label: "⚠ 1 claim needs source support — para. 4, line 3", type: "warning" as const },
        { label: "Rubric alignment: argument (strong), evidence (strong), structure (review)", type: "info" as const },
        { label: "Priority: strengthen conclusion with explicit theoretical link", type: "plan" as const },
      ],
    },
    unlocks: "Submission reviewed — revision priorities clear",
    risk: "Feedback only — no content generated for insertion",
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
    notes: { dot: "bg-[#94a3b8]" },
    theme: { dot: "bg-[#0f284d]" },
    evidence: { dot: "bg-[#ba9858]", badge: "Sourced" },
    counter: { dot: "bg-[#94a3b8]", badge: "Counter" },
    plan: { dot: "bg-[#0f284d]", badge: "Planned" },
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
              Seven stages.{" "}
              <span className="text-[#ba9858]">Progressive refinement.</span>
            </h2>
            <p className="mt-6 text-lg text-[#445f7c] leading-relaxed max-w-xl mx-auto">
              Ingest → Understand → Map → Judge → Build → Draft → Refine.
              Each stage narrows the scope, strengthens the argument, and reduces
              the risk of unsupported claims.
            </p>
          </div>

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
                              {isActive && stage.id >= 2 && (
                                <span className="ml-auto text-[9px] font-medium text-[#ba9858] bg-[#ba9858]/10 px-2 py-0.5 rounded-full shrink-0">
                                  assignment-scoped
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
                    {activeStage.id >= 2 && (
                      <span className="text-[9px] font-medium text-[#ba9858] bg-[#ba9858]/10 px-2 py-0.5 rounded-full">
                        assignment-scoped
                      </span>
                    )}
                    <span className="text-[10px] text-[#cbd5e1] font-medium">POL2028</span>
                  </div>
                </div>

                {/* Panel content */}
                <div className="p-6 lg:p-8 min-h-[460px]">
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
                                        ? "bg-[#ba9858] text-white"
                                        : item.type === "plan"
                                        ? "bg-[#0f284d] text-white"
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

                      {/* What this unlocks + risk level */}
                      <div className="mt-6 space-y-2">
                        <div className="flex items-center gap-3 text-[11px]">
                          <div className="h-px flex-1 bg-gradient-to-r from-[#ba9858]/30 to-transparent" />
                          <span className="text-[#ba9858] font-medium uppercase tracking-wider">
                            {activeStage.unlocks}
                          </span>
                          <div className="h-px flex-1 bg-gradient-to-l from-[#ba9858]/30 to-transparent" />
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#94a3b8]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#2F6B4A]" />
                          <span>{activeStage.risk}</span>
                        </div>
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
