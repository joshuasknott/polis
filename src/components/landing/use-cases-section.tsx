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
      "Theory-heavy essays, policy memos, comparative politics, political economy, and international relations.",
    example:
      "2,500-word essay on whether institutional design explains democratic backsliding.",
    module: {
      name: "POL2041 Comparative Government",
      sources: "12 readings, 8 lecture decks, 3 policy reports",
    },
    assignment: {
      question: "Does institutional design explain democratic backsliding in Central Europe?",
      relevantSources: "6 of 12 readings scoped to assignment",
    },
    argument: [
      "Theories of institutional erosion mapped",
      "Cases: Hungary, Turkey, Poland — evidence allocated",
      "Counterarguments from comparative politics linked",
    ],
    outcome:
      "Argument-led draft with point-by-point source links. Refined against rubric with 2 evidence gaps flagged.",
  },
  {
    id: "law",
    degree: "Law",
    icon: Scale,
    general:
      "Academic coursework, case notes, statute/source organisation, problem-question planning, and seminar prep.",
    example: "Problem question on negligence and duty of care.",
    module: {
      name: "LAW2003 Tort Law",
      sources: "18 case reports, 4 statute extracts, 10 lecture notes",
    },
    assignment: {
      question: "Advise the claimant on whether a duty of care exists in the given scenario.",
      relevantSources: "8 case reports, 2 statutes scoped to problem question",
    },
    argument: [
      "Legal issues identified and mapped to authorities",
      "Factual links to problem facts established",
      "Competing judicial interpretations linked",
    ],
    outcome:
      "Issue-authority matrix and structured answer plan. Refined with citation coverage scan — no legal advice, academic planning only.",
  },
  {
    id: "sociology",
    degree: "Sociology",
    icon: Users,
    general:
      "Theory synthesis, qualitative methods, interview analysis, field notes, and empirical studies.",
    example:
      "Coursework analysing class identity through interview excerpts and Bourdieu.",
    module: {
      name: "SOC2012 Social Stratification",
      sources: "8 theory readings, interview transcripts, 6 methodology notes",
    },
    assignment: {
      question: "How does cultural capital shape educational attainment in working-class communities?",
      relevantSources: "5 theory readings, 3 interview sets scoped to assignment",
    },
    argument: [
      "Themes and codes mapped across theorists",
      "Interview evidence allocated to each claim",
      "Methodological frameworks linked to analysis",
    ],
    outcome:
      "Coded analysis map and source-backed argument. Draft refined with literature review structure and evidence gap warnings.",
  },
  {
    id: "business",
    degree: "Business",
    icon: Briefcase,
    general:
      "Case study analysis, strategy coursework, organisational behaviour, management memos, and reports.",
    example: "Strategic analysis of a retailer entering a new market.",
    module: {
      name: "BUS3001 Strategic Management",
      sources: "Case study pack, 6 framework readings, company reports",
    },
    assignment: {
      question: "Evaluate whether TechRetail should expand into the Southeast Asian market.",
      relevantSources: "Case facts, 4 strategy frameworks, 2 regional reports scoped",
    },
    argument: [
      "Applicable frameworks: Porter, RBV, institutional theory",
      "Risks and supporting evidence allocated",
      "Counterpoints to recommendation mapped",
    ],
    outcome:
      "Management memo plan with evidence-backed recommendations. Refined against rubric criteria with word budget allocated.",
  },
  {
    id: "economics",
    degree: "Economics",
    icon: TrendingUp,
    general:
      "Policy evaluation, model comparison, empirical reading notes, and economic argumentation.",
    example:
      "Policy brief on whether rent controls improve housing affordability.",
    module: {
      name: "ECN2015 Public Economics",
      sources: "10 empirical papers, 4 model commentaries, policy docs",
    },
    assignment: {
      question: "Evaluate the effectiveness of rent controls as a policy instrument for housing affordability.",
      relevantSources: "6 empirical papers, 2 policy evaluations scoped to assignment",
    },
    argument: [
      "Assumptions and tradeoffs mapped per model",
      "Empirical evidence allocated to evaluation points",
      "Policy limitations and counterarguments linked",
    ],
    outcome:
      "Policy evaluation plan with evidence-backed brief. Draft refined with rubric alignment and evidence sufficiency check.",
  },
  {
    id: "history",
    degree: "History",
    icon: BookOpen,
    general:
      "Historiography essays, primary/secondary source comparison, chronology, and evidence-led argument.",
    example:
      "Historiography essay on causes of the Russian Revolution.",
    module: {
      name: "HIS2008 Modern European History",
      sources: "Primary extracts, 12 historiographical readings, lecture notes",
    },
    assignment: {
      question: "To what extent was the Russian Revolution of 1917 caused by structural economic factors?",
      relevantSources: "4 primary sources, 7 secondary readings scoped to essay question",
    },
    argument: [
      "Schools of interpretation: revisionist, orthodox, post-revisionist",
      "Chronological source mapping to argument structure",
      "Evidence gaps and contested claims flagged",
    ],
    outcome:
      "Historiography map and argument plan. Draft refined with primary and secondary citation balance checked.",
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
            Every discipline follows the same structure: module context, assignment focus, argument
            map, and a draft refined with source-grounded guidance.
          </p>
        </div>

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

          {/* Right: detailed panel — module → assignment → argument → draft/refine */}
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

                {/* Module context */}
                <div className="px-6 lg:px-8 py-4 bg-[#fafbfc] border-b border-[#f1f5f9]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#0f284d] mb-1.5">
                        Module workspace
                      </div>
                      <p className="text-sm font-medium text-[#0f284d]">{activeCase.module.name}</p>
                      <p className="text-[12px] text-[#445f7c] mt-0.5">{activeCase.module.sources}</p>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#ba9858] mb-1.5">
                        Assignment focus
                      </div>
                      <p className="text-sm text-[#0f284d] leading-snug">
                        &ldquo;{activeCase.assignment.question}&rdquo;
                      </p>
                      <p className="text-[12px] text-[#ba9858] mt-0.5">{activeCase.assignment.relevantSources}</p>
                    </div>
                  </div>
                </div>

                {/* Argument map + Draft/Refine outcome */}
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Argument map */}
                  <div className="p-6 lg:p-7 border-b md:border-b-0 md:border-r border-[#f1f5f9]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0f284d]" />
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#0f284d]">
                        Argument map
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {activeCase.argument.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="w-1 h-1 rounded-full bg-[#ba9858] mt-2 shrink-0" />
                          <span className="text-sm text-[#334155] leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Draft / Refine outcome */}
                  <div className="p-6 lg:p-7">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ba9858]" />
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#ba9858]">
                        Draft & Refine outcome
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                      <p className="text-sm text-[#334155] leading-relaxed">{activeCase.outcome}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] text-[#ba9858] font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ba9858]" />
                      Every claim source-grounded
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
