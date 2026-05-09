"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Target, Map, PenTool } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const MODEL_STEPS = [
  {
    label: "Module",
    icon: BookOpen,
    description: "The workspace. Upload all readings, lecture notes, and briefs for a university module.",
    detail: "Broad knowledge base",
    color: "bg-[#0f284d]",
    textColor: "text-white",
    borderColor: "border-[#0f284d]",
  },
  {
    label: "Assignment",
    icon: Target,
    description: "A focused production track inside the module. Scoped to a specific question, rubric, and deadline.",
    detail: "Filters module material",
    color: "bg-[#ba9858]",
    textColor: "text-white",
    borderColor: "border-[#ba9858]",
  },
  {
    label: "Argument",
    icon: Map,
    description: "A structured claim linked to evidence from sources. Built from the filtered, assignment-relevant material.",
    detail: "Claims bound to evidence",
    color: "bg-white",
    textColor: "text-[#0f284d]",
    borderColor: "border-[#0f284d]",
  },
  {
    label: "Draft",
    icon: PenTool,
    description: "A versioned piece of writing composed from the argument map, with source links attached throughout.",
    detail: "Sources stay connected",
    color: "bg-white",
    textColor: "text-[#0f284d]",
    borderColor: "border-[#ba9858]",
  },
];

export function ProductModelSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="product-model"
      className="relative py-28 lg:py-36 overflow-hidden bg-white"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={prefersReducedMotion ? undefined : fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[1.05] text-[#0f284d]">
            Module → Assignment → Argument →{" "}
            <span className="text-[#ba9858]">Draft.</span>
          </h2>
          <p className="mt-6 text-lg text-[#445f7c] leading-relaxed max-w-2xl mx-auto">
            The module is your workspace. Assignments are focused production tracks that refine
            module material into evidence-backed submissions. Every stage narrows the scope while
            keeping evidence attached.
          </p>
        </motion.div>

        {/* Desktop: horizontal connected flow */}
        <motion.div
          variants={prefersReducedMotion ? undefined : fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* Large screens: horizontal */}
          <div className="hidden lg:grid grid-cols-4 gap-0 items-stretch">
            {MODEL_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-stretch">
                <div className="flex-1 flex flex-col">
                  <div
                    className={`rounded-2xl border-2 ${step.borderColor} ${step.color} p-6 flex-1 flex flex-col`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          step.color === "bg-white"
                            ? "bg-[#f1f5f9]"
                            : "bg-white/15"
                        }`}
                      >
                        <step.icon
                          className={`w-5 h-5 ${
                            step.color === "bg-white" ? "text-[#0f284d]" : "text-white"
                          }`}
                        />
                      </div>
                      <div>
                        <h3
                          className={`text-lg font-semibold ${
                            step.color === "bg-white" ? "text-[#0f284d]" : "text-white"
                          }`}
                        >
                          {step.label}
                        </h3>
                      </div>
                    </div>
                    <p
                      className={`text-sm leading-relaxed mb-4 flex-1 ${
                        step.color === "bg-white" ? "text-[#445f7c]" : "text-white/80"
                      }`}
                    >
                      {step.description}
                    </p>
                    <div
                      className={`text-[10px] font-bold uppercase tracking-widest ${
                        step.color === "bg-white" ? "text-[#ba9858]" : "text-white/60"
                      }`}
                    >
                      {step.detail}
                    </div>
                  </div>
                </div>
                {i < MODEL_STEPS.length - 1 && (
                  <div className="flex items-center px-2 shrink-0">
                    <ArrowRight className="w-5 h-5 text-[#cbd5e1]" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="lg:hidden space-y-3">
            {MODEL_STEPS.map((step, i) => (
              <div key={step.label}>
                <div
                  className={`rounded-2xl border-2 ${step.borderColor} ${step.color} p-5`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        step.color === "bg-white" ? "bg-[#f1f5f9]" : "bg-white/15"
                      }`}
                    >
                      <step.icon
                        className={`w-4 h-4 ${
                          step.color === "bg-white" ? "text-[#0f284d]" : "text-white"
                        }`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-base font-semibold ${
                          step.color === "bg-white" ? "text-[#0f284d]" : "text-white"
                        }`}
                      >
                        {step.label}
                      </h3>
                      <div
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          step.color === "bg-white" ? "text-[#ba9858]" : "text-white/60"
                        }`}
                      >
                        {step.detail}
                      </div>
                    </div>
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${
                      step.color === "bg-white" ? "text-[#445f7c]" : "text-white/80"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
                {i < MODEL_STEPS.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowRight className="w-4 h-4 text-[#cbd5e1] rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Scope-narrowing annotation */}
          <div className="mt-8 flex items-center justify-center gap-3 text-[11px] text-[#94a3b8]">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#e2e8f0]" />
            <span className="uppercase tracking-widest font-medium">
              Each stage narrows scope · evidence stays attached
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#e2e8f0]" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
