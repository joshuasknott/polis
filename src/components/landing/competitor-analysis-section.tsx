"use client";

import { motion, useReducedMotion } from "framer-motion";

type SupportLevel = "yes" | "partial" | "no";

const COMPETITORS = [
  {
    id: "polis",
    name: "Polis",
    bestFor: "Module-scoped coursework: assignment focus, argument map, draft and refine",
    highlight: true,
  },
  {
    id: "notebooklm",
    name: "NotebookLM",
    bestFor: "Asking questions across uploaded sources",
    highlight: false,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    bestFor: "Flexible general AI help",
    highlight: false,
  },
  {
    id: "claude",
    name: "Claude",
    bestFor: "Long-document analysis and drafting",
    highlight: false,
  },
  {
    id: "grammarly",
    name: "Grammarly",
    bestFor: "Polishing final prose",
    highlight: false,
  },
] as const;

type CompetitorId = (typeof COMPETITORS)[number]["id"];

const ROWS: { feature: string; levels: Record<CompetitorId, SupportLevel> }[] = [
  {
    feature: "Built around university coursework",
    levels: { polis: "yes", notebooklm: "no", chatgpt: "no", claude: "no", grammarly: "no" },
  },
  {
    feature: "Separates work by module",
    levels: { polis: "yes", notebooklm: "no", chatgpt: "no", claude: "no", grammarly: "no" },
  },
  {
    feature: "Maps evidence to assignments",
    levels: { polis: "yes", notebooklm: "no", chatgpt: "no", claude: "no", grammarly: "no" },
  },
  {
    feature: "Turns notes into argument maps",
    levels: { polis: "yes", notebooklm: "no", chatgpt: "partial", claude: "partial", grammarly: "no" },
  },
  {
    feature: "Supports source-backed writing",
    levels: { polis: "yes", notebooklm: "partial", chatgpt: "partial", claude: "partial", grammarly: "no" },
  },
  {
    feature: "Flags unsupported claims while writing",
    levels: { polis: "yes", notebooklm: "no", chatgpt: "no", claude: "no", grammarly: "no" },
  },
  {
    feature: "Helps polish final prose",
    levels: { polis: "partial", notebooklm: "no", chatgpt: "partial", claude: "partial", grammarly: "yes" },
  },
];

function LevelSymbol({ level }: { level: SupportLevel; isPolis: boolean }) {
  if (level === "yes") {
    return (
      <span
        className="text-sm font-medium text-[#2F6B4A]"
        aria-label="Native strength"
      >
        ✓
      </span>
    );
  }
  if (level === "partial") {
    return (
      <span className="text-sm text-[#ba9858]" aria-label="Possible but manual">
        ◐
      </span>
    );
  }
  return (
    <span className="text-sm text-[#cbd5e1]" aria-label="Not the focus">
      —
    </span>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function CompetitorAnalysisSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="compare"
      className="relative py-28 lg:py-36 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8f9fc 100%)" }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-4xl mb-16">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.04em] leading-[1.05] text-[#0f284d]">
            The missing layer for coursework.
          </h2>
          <p className="mt-6 text-base sm:text-lg text-[#445f7c] leading-relaxed max-w-3xl">
            Polis is best for university coursework when you need module context, assignment focus,
            argument mapping, and source-grounded drafting and refinement. Every other tool does
            something useful — Polis connects the whole workflow.
          </p>
        </div>

        <motion.div
          variants={prefersReducedMotion ? undefined : fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* Best-for cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-12">
            {COMPETITORS.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl border p-4 ${
                  c.highlight
                    ? "bg-[#0f284d] border-[#0f284d] text-white"
                    : "bg-white border-[#e2e8f0] text-[#0f284d]"
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-1.5 ${
                    c.highlight ? "text-white" : "text-[#0f284d]"
                  }`}
                >
                  {c.name}
                </div>
                <p
                  className={`text-[12px] leading-snug ${
                    c.highlight ? "text-white/70" : "text-[#445f7c]"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider mr-1 ${
                      c.highlight ? "text-[#ba9858]" : "text-[#94a3b8]"
                    }`}
                  >
                    Best for:
                  </span>
                  {c.bestFor}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop comparison table */}
          <div className="hidden lg:block rounded-2xl border border-[#e2e8f0] bg-white overflow-hidden shadow-[0_1px_1px_rgba(15,40,77,0.04),0_8px_30px_rgba(15,40,77,0.04)]">
            {/* Header */}
            <div
              className="grid border-b border-[#f1f5f9]"
              style={{ gridTemplateColumns: "minmax(260px, 1.8fr) repeat(5, 1fr)" }}
            >
              <div className="p-4 text-sm font-medium text-[#94a3b8]">Feature</div>
              {COMPETITORS.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 text-center ${
                    c.id === "polis" ? "bg-[#0f284d]" : ""
                  }`}
                >
                  <div
                    className={`text-[11px] font-semibold ${
                      c.id === "polis" ? "text-white" : "text-[#0f284d]"
                    }`}
                  >
                    {c.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid items-center ${
                  i < ROWS.length - 1 ? "border-b border-[#f1f5f9]" : ""
                } hover:bg-[#fafbfc] transition-colors`}
                style={{ gridTemplateColumns: "minmax(260px, 1.8fr) repeat(5, 1fr)" }}
              >
                <div className="p-4">
                  <div className="text-sm text-[#334155]">{row.feature}</div>
                </div>
                {COMPETITORS.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 flex justify-center ${
                      c.id === "polis" ? "bg-[#0f284d]/[0.03]" : ""
                    }`}
                  >
                    <LevelSymbol level={row.levels[c.id]} isPolis={c.id === "polis"} />
                  </div>
                ))}
              </div>
            ))}

            {/* Legend */}
            <div
              className="grid bg-[#fafbfc] border-t border-[#f1f5f9]"
              style={{ gridTemplateColumns: "minmax(260px, 1.8fr) repeat(5, 1fr)" }}
            >
              <div className="p-4 flex items-center gap-5 text-[10px] text-[#94a3b8]">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#2F6B4A]">✓</span>
                  Native strength
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[#ba9858]">◐</span>
                  Possible, but manual
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[#cbd5e1]">—</span>
                  Not the focus
                </span>
              </div>
              {COMPETITORS.map((c) => (
                <div key={c.id} className="p-4" />
              ))}
            </div>
          </div>

          {/* Mobile comparison */}
          <div className="lg:hidden space-y-4">
            {COMPETITORS.map((product) => (
              <div
                key={product.id}
                className={`rounded-2xl border overflow-hidden ${
                  product.id === "polis"
                    ? "border-[#0f284d] bg-[#0f284d] text-white"
                    : "border-[#e2e8f0] bg-white text-[#0f284d]"
                }`}
              >
                <div
                  className={`p-5 border-b ${
                    product.id === "polis" ? "border-white/10" : "border-[#f1f5f9]"
                  }`}
                >
                  <div
                    className={`text-base font-semibold ${
                      product.id === "polis" ? "text-white" : "text-[#0f284d]"
                    }`}
                  >
                    {product.name}
                  </div>
                  <p
                    className={`text-[12px] mt-1 leading-snug ${
                      product.id === "polis" ? "text-white/70" : "text-[#445f7c]"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider mr-1 ${
                        product.id === "polis" ? "text-[#ba9858]" : "text-[#94a3b8]"
                      }`}
                    >
                      Best for:
                    </span>
                    {product.bestFor}
                  </p>
                </div>
                <div
                  className={`divide-y ${
                    product.id === "polis" ? "divide-white/10" : "divide-[#f1f5f9]"
                  }`}
                >
                  {ROWS.map((row) => {
                    const level = row.levels[product.id];
                    return (
                      <div
                        key={row.feature}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <span
                          className={`text-sm pr-4 leading-snug ${
                            product.id === "polis" ? "text-white/80" : "text-[#445f7c]"
                          }`}
                        >
                          {row.feature}
                        </span>
                        <LevelSymbol level={level} isPolis={product.id === "polis"} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Notion AI note */}
            <div className="text-center text-[11px] text-[#94a3b8] mt-4">
              Notion AI is also useful for notes — but it&apos;s not built around coursework workflows.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
