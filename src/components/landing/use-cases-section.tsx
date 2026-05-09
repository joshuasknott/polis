"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Landmark,
  Scale,
  Users,
  Briefcase,
  TrendingUp,
  BookOpen,
} from "lucide-react";

const USE_CASES = [
  {
    id: "politics",
    degree: "Politics",
    icon: Landmark,
    general:
      "Useful for theory-heavy essays, policy memos, comparative politics, political economy, and international relations.",
    example:
      "2,500-word essay on whether institutional design explains democratic backsliding.",
    inputs: [
      "Assignment brief",
      "Lecture notes on democratic backsliding",
      "Democracy readings (Levitsky, Mounk)",
      "Policy reports",
      "Rough argument notes",
    ],
    maps: [
      "Theories of institutional erosion",
      "Cases: Hungary, Turkey, Poland",
      "Evidence for/against institutional explanations",
      "Counterarguments from comparative politics",
    ],
    output:
      "Argument-led structure and source-backed draft sections with evidence links.",
  },
  {
    id: "law",
    degree: "Law",
    icon: Scale,
    general:
      "Useful for academic coursework, case notes, statute/source organisation, problem-question planning, and seminar prep.",
    example: "Problem question on negligence and duty of care.",
    inputs: [
      "Problem question",
      "Case reports and judicial decisions",
      "Statute extracts",
      "Lecture notes",
      "Seminar discussion notes",
    ],
    maps: [
      "Legal issues identified",
      "Relevant authorities per issue",
      "Factual links to problem facts",
      "Competing interpretations",
    ],
    output:
      "Issue-authority matrix and structured coursework answer plan. No legal advice — academic planning only.",
  },
  {
    id: "sociology",
    degree: "Sociology",
    icon: Users,
    general:
      "Useful for theory synthesis, qualitative methods, interview analysis, field notes, and empirical studies.",
    example:
      "Coursework analysing class identity through interview excerpts and Bourdieu.",
    inputs: [
      "Interview notes and field notes",
      "Theory readings (Giddens, Bourdieu)",
      "Methodology lecture slides",
      "Literature review brief",
    ],
    maps: [
      "Themes, codes, and key concepts",
      "Convergence across theorists",
      "Evidence by assignment brief",
      "Methodological frameworks",
    ],
    output:
      "Coded analysis map and source-backed sociology argument with literature review structure.",
  },
  {
    id: "business",
    degree: "Business",
    icon: Briefcase,
    general:
      "Useful for case study analysis, strategy coursework, organisational behaviour, management memos, and reports.",
    example: "Strategic analysis of a retailer entering a new market.",
    inputs: [
      "Case study pack (40+ pages)",
      "Strategy framework readings",
      "Company reports and financial data",
      "Lecture slides on Porter and RBV",
      "Rough recommendation notes",
    ],
    maps: [
      "Applicable frameworks: Porter, RBV, institutional theory",
      "Risks and supporting evidence",
      "Counterpoints to recommendation",
      "Case facts mapped to analysis",
    ],
    output:
      "Management memo plan with evidence-backed strategic recommendations.",
  },
  {
    id: "economics",
    degree: "Economics",
    icon: TrendingUp,
    general:
      "Useful for policy evaluation, model comparison, empirical reading notes, and economic argumentation.",
    example:
      "Policy brief on whether rent controls improve housing affordability.",
    inputs: [
      "Policy brief document",
      "Empirical papers (IMF, working papers)",
      "Model and data commentary notes",
      "Lecture notes on market intervention",
    ],
    maps: [
      "Assumptions and tradeoffs",
      "Empirical evidence per evaluation point",
      "Policy limitations",
      "Counterarguments from source material",
    ],
    output:
      "Policy evaluation plan and evidence-backed economic brief.",
  },
  {
    id: "history",
    degree: "History",
    icon: BookOpen,
    general:
      "Useful for historiography essays, primary/secondary source comparison, chronology, and evidence-led argument.",
    example:
      "Historiography essay on causes of the Russian Revolution.",
    inputs: [
      "Primary source extracts",
      "Secondary and historiographical readings",
      "Historiography notes",
      "Essay brief and marking criteria",
    ],
    maps: [
      "Schools of interpretation: revisionist, orthodox, post-revisionist",
      "Chronological source mapping",
      "Source relevance by argument",
      "Evidence gaps and contested claims",
    ],
    output:
      "Historiography map and argument plan with primary and secondary citations.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function UseCasesSection() {
  const [activeId, setActiveId] = useState("politics");
  const prefersReducedMotion = useReducedMotion();
  const activeCase = USE_CASES.find((uc) => uc.id === activeId)!;

  return (
    <section id="use-cases" className="relative py-28 lg:py-36 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.04em] leading-[1.05] text-[#0f284d]">
            Built for coursework across the social sciences.
          </h2>
          <p className="mt-6 text-lg text-[#445f7c] leading-relaxed">
            Polis adapts to essays, policy memos, case notes, literature reviews, source analysis,
            seminar prep, and assignment drafting — tailored to the way each degree actually
            works.
          </p>
        </div>

        {/* Degree selector + deep dive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: degree selector list */}
          <div className="lg:col-span-3">
            <div className="space-y-1">
              {USE_CASES.map((uc) => {
                const isActive = activeId === uc.id;
                return (
                  <button
                    key={uc.id}
                    onClick={() => setActiveId(uc.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border outline-none focus-visible:ring-2 focus-visible:ring-[#0f284d] focus-visible:ring-offset-2 ${
                      isActive
                        ? "bg-white border-[#e2e8f0] shadow-[0_1px_3px_rgba(15,40,77,0.04),0_8px_24px_rgba(15,40,77,0.06)]"
                        : "bg-transparent border-transparent hover:bg-[#f8f9fc]"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 transition-all ${
                        isActive
                          ? "bg-[#0f284d] text-white"
                          : "bg-[#f1f5f9] text-[#94a3b8]"
                      }`}
                    >
                      <uc.icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-sm font-semibold transition-colors ${
                        isActive ? "text-[#0f284d]" : "text-[#445f7c]"
                      }`}
                    >
                      {uc.degree}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: detailed deep-dive panel */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCase.id}
                variants={prefersReducedMotion ? undefined : cardVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
                className="rounded-2xl border border-[#e2e8f0] bg-white overflow-hidden shadow-[0_1px_1px_rgba(15,40,77,0.04),0_16px_60px_rgba(15,40,77,0.05)]"
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-6 lg:px-8 py-5 border-b border-[#f1f5f9]">
                  <div className="p-2.5 rounded-xl bg-[#0f284d] text-white shrink-0">
                    <activeCase.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-[#0f284d]">{activeCase.degree}</h3>
                    <p className="text-[13px] text-[#445f7c] leading-snug">{activeCase.general}</p>
                  </div>
                </div>

                {/* Example assignment */}
                <div className="px-6 lg:px-8 py-4 bg-[#fafbfc] border-b border-[#f1f5f9]">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5">
                    Example assignment
                  </div>
                  <p className="text-sm font-medium text-[#0f284d] leading-snug">
                    &ldquo;{activeCase.example}&rdquo;
                  </p>
                </div>

                {/* Three-column breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {/* Inputs */}
                  <div className="p-6 lg:p-7 border-b md:border-b-0 md:border-r border-[#f1f5f9]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#445f7c]" />
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#445f7c]">
                        Messy inputs
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {activeCase.inputs.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="w-1 h-1 rounded-full bg-[#cbd5e1] mt-2 shrink-0" />
                          <span className="text-sm text-[#334155] leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* What Polis maps */}
                  <div className="p-6 lg:p-7 border-b md:border-b-0 md:border-r border-[#f1f5f9] bg-[#fafbfc]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ba9858]" />
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#ba9858]">
                        What Polis maps
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {activeCase.maps.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="w-1 h-1 rounded-full bg-[#ba9858]/60 mt-2 shrink-0" />
                          <span className="text-sm text-[#334155] leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Output */}
                  <div className="p-6 lg:p-7">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0f284d]" />
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#0f284d]">
                        Final output
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                      <p className="text-sm text-[#334155] leading-relaxed">{activeCase.output}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] text-[#ba9858] font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ba9858]" />
                      Every claim source-grounded
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Mobile: accordion fallback is handled by the same selector above being stacked */}
          </div>
        </div>
      </div>
    </section>
  );
}
