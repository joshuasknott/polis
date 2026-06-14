import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  FileText,
  Layers3,
  Map,
  PenLine,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { PolisMark } from "@/components/brand/polis-mark";

const workflow = [
  {
    title: "Import",
    text: "Bring in readings, lecture notes, briefs, slides, and rough notes for a module.",
    icon: Upload,
  },
  {
    title: "Plan",
    text: "Understand sources, map evidence, judge gaps, and build the argument before writing.",
    icon: Map,
  },
  {
    title: "Write",
    text: "Draft with source links visible, including clear labels for supported and unsupported claims.",
    icon: PenLine,
  },
  {
    title: "Review",
    text: "Check coverage, citation integrity, rubric fit, and weak evidence before submission.",
    icon: ShieldCheck,
  },
];

const sourceLabels = [
  { label: "Source-supported", tone: "bg-[#2F6B4A]/12 text-[#bff1d1] border-[#2F6B4A]/35" },
  { label: "Interpretation", tone: "bg-[#ba9858]/15 text-[#f4d28c] border-[#ba9858]/35" },
  { label: "Needs evidence", tone: "bg-[#e0952f]/15 text-[#ffcf8c] border-[#e0952f]/35" },
];

const checks = [
  "No fake citations or page numbers",
  "Soft warnings when evidence is thin",
  "Writing help is allowed, labelled, and source-aware",
  "Student responsibility stays explicit",
];

export function MarketingSite() {
  return (
    <main className="min-h-screen bg-[#060b14] text-white antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#070d18]/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Polis home" className="text-white">
            <PolisMark priority iconClassName="h-7 w-7" textClassName="h-5" />
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            <a href="#workflow" className="-my-2 inline-flex min-h-9 items-center text-sm font-medium text-white/62 transition-colors hover:text-white">
              Workflow
            </a>
            <a href="#integrity" className="-my-2 inline-flex min-h-9 items-center text-sm font-medium text-white/62 transition-colors hover:text-white">
              Source-backed AI
            </a>
            <a href="#product" className="-my-2 inline-flex min-h-9 items-center text-sm font-medium text-white/62 transition-colors hover:text-white">
              Product
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="-my-2 hidden min-h-9 items-center text-sm font-medium text-white/62 transition-colors hover:text-white sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/12 bg-white px-4 text-sm font-semibold text-[#07111f] shadow-[0_10px_30px_rgba(255,255,255,0.12)] transition-colors hover:bg-[#f4f7fb]"
            >
              Start
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(68,95,124,0.24)_0%,rgba(6,11,20,0)_42%),linear-gradient(180deg,#07111f_0%,#060b14_76%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-16px)] max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-12 pt-24 sm:px-6 lg:grid-cols-[0.98fr_1.02fr] lg:px-8 lg:pt-20">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl font-semibold leading-[0.99] tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.8rem] xl:text-[4rem]">
              Your module, organized into a source-backed workspace.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#b7c4d6] sm:text-lg">
              Polis turns scattered coursework into one command center for each module. Import
              your materials, plan the assessment, write with evidence attached, and review before
              submission.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-[#07111f] shadow-[0_18px_45px_rgba(255,255,255,0.14)] transition-colors hover:bg-[#f4f7fb]"
              >
                Start your workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="#workflow"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] px-6 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/[0.08]"
              >
                See how Polis works
              </a>
            </div>
          </div>

          <WorkspacePreview />
        </div>
      </section>

      <section id="product" className="border-b border-white/10 bg-[#07111f] px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Built around the way coursework actually moves.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#9fb0c6]">
              The module is the workspace. Assessments are focused tracks inside it. The source
              base stays live, so planning and writing never drift away from the material.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Workspace", "One module, one source base, every file in context."],
              ["Assessment", "Question, rubric, deadline, weight, and relevant sources."],
              ["Evidence map", "Claims, counterpoints, and links back to uploaded material."],
              ["Write / Review", "Drafting, restructuring, critique, and citation checks."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
              >
                <div className="text-sm font-semibold text-white">{title}</div>
                <p className="mt-2 text-sm leading-6 text-[#9fb0c6]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-[#f7f9fc] px-5 py-20 text-[#07111f] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="font-serif text-4xl font-semibold tracking-[-0.025em] sm:text-5xl">
              Import. Plan. Write. Review.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#43546c]">
              Polis keeps the workflow short on the surface and rigorous underneath. Students see
              the stages they need, not an abstract AI chat destination.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {workflow.map((item, index) => (
              <div key={item.title} className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-[0_16px_45px_rgba(7,17,31,0.06)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#07111f] text-white">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-xs text-[#8a98aa]">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-base font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#52637a]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="integrity" className="bg-[#07111f] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <h2 className="font-serif text-4xl font-semibold leading-tight tracking-[-0.025em] text-white sm:text-5xl">
              Powerful writing help, with evidence truth kept visible.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#a9b8ca]">
              Polis can draft, paraphrase, critique, restructure, and revise. It does not pretend
              unsupported claims are sourced. Evidence gaps become soft warnings, not fabricated
              references.
            </p>
            <ul className="mt-8 space-y-3">
              {checks.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[#dce6f3]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7ee0a1]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
            <div className="rounded-xl border border-white/10 bg-[#0a1423]/90 p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="text-sm font-semibold text-white">Review run</div>
                  <div className="mt-1 text-xs text-[#7f90a7]">Digital governance essay</div>
                </div>
                <ShieldCheck className="h-5 w-5 text-[#7ee0a1]" />
              </div>
              <div className="mt-5 space-y-3">
                <IntegrityRow
                  icon={FileText}
                  title="Claim supported"
                  text="Foucault passage attached to paragraph 2."
                  tone="source"
                />
                <IntegrityRow
                  icon={CircleAlert}
                  title="Soft warning"
                  text="Prediction-market claim needs another source."
                  tone="warning"
                />
                <IntegrityRow
                  icon={BookOpen}
                  title="Citation checked"
                  text="Harvard reference matches uploaded source record."
                  tone="source"
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {sourceLabels.map((item) => (
                  <span key={item.label} className={`rounded-full border px-3 py-1 text-xs font-medium ${item.tone}`}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fc] px-5 py-20 text-[#07111f] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[#dfe6ef] bg-white p-8 shadow-[0_24px_70px_rgba(7,17,31,0.08)] sm:p-10 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Start with a module name, semester, and year.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#52637a]">
              Then import the material you already have. Polis turns it into the workspace for
              every assessment in that module.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#07111f] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#13243a] lg:mt-0"
          >
            Create workspace
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#060b14] px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <PolisMark className="text-white" iconClassName="h-6 w-6" textClassName="h-[1.125rem]" />
          <div className="text-sm text-[#7f90a7]">
            Source-backed coursework workspace for students.
          </div>
        </div>
      </footer>
    </main>
  );
}

function WorkspacePreview() {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-3 shadow-[0_40px_110px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a1423]/92">
        <div className="flex h-11 items-center gap-2 border-b border-white/10 bg-white/[0.035] px-4">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff6b5d]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#f4c76c]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#7ee0a1]" />
          <div className="ml-auto font-mono text-[11px] text-[#7f90a7]">PIRR30041 / workspace</div>
        </div>
        <div className="grid min-h-[410px] grid-cols-1 lg:grid-cols-[190px_1fr]">
          <aside className="hidden border-r border-white/10 bg-white/[0.025] p-4 lg:block">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2f6df6] text-xs font-bold text-white">
                PIR
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight text-white">International Security</div>
                <div className="text-xs text-[#7f90a7]">2026 Spring</div>
              </div>
            </div>
            {["Home", "Imports", "Assessments", "Knowledge Base", "Settings"].map((item, index) => (
              <div
                key={item}
                className={`mb-1 rounded-lg px-3 py-1.5 text-sm ${
                  index === 0 ? "bg-white text-[#07111f]" : "text-[#a9b8ca]"
                }`}
              >
                {item}
              </div>
            ))}
          </aside>
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                  International Security
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#9fb0c6]">
                  Deterrence, intervention, institutions, and contemporary conflict.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["18 sources", "3 assessments", "1 needs review"].map((item) => (
                  <span key={item} className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-[#dce6f3]">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <PreviewPanel title="Assessment deadlines">
                  <PreviewRow title="Deterrence essay" meta="2 Jul 2026 / 2,500 words" stage="Draft" />
                  <PreviewRow title="Literature review" meta="11 Jul 2026 / 3,000 words" stage="Build" />
                </PreviewPanel>
                <PreviewPanel title="Evidence map">
                  <EvidenceLine label="Main claim" text="Deterrence still shapes security policy, but through institutions." />
                  <EvidenceLine label="Counter" text="Over-reliance on deterrence misses domestic political incentives." />
                  <EvidenceLine label="Gap" text="Needs one current NATO policy source." warning />
                </PreviewPanel>
              </div>
              <PreviewPanel title="Write / Review">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm leading-7 text-[#dce6f3]">
                    Deterrence remains useful when treated as a political signal rather than a
                    purely military doctrine.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#2F6B4A]/30 bg-[#2F6B4A]/12 px-2.5 py-1 text-xs font-medium text-[#bff1d1]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Source-supported
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-[#e0952f]/30 bg-[#e0952f]/10 p-3 text-xs leading-5 text-[#ffcf8c]">
                  Soft warning: add evidence before treating this as a supported claim.
                </div>
              </PreviewPanel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7f90a7]">
        <Layers3 className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </section>
  );
}

function PreviewRow({ title, meta, stage }: { title: string; meta: string; stage: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#07111f]/70 px-3 py-3 last:mb-0">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-white">{title}</div>
        <div className="mt-1 text-xs text-[#7f90a7]">{meta}</div>
      </div>
      <span className="shrink-0 rounded-md bg-[#ba9858]/15 px-2 py-1 text-xs font-semibold text-[#f4d28c]">
        {stage}
      </span>
    </div>
  );
}

function EvidenceLine({ label, text, warning = false }: { label: string; text: string; warning?: boolean }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className={warning ? "text-xs font-semibold text-[#ffcf8c]" : "text-xs font-semibold text-[#bff1d1]"}>
        {label}
      </div>
      <div className="mt-1 text-sm leading-6 text-[#dce6f3]">{text}</div>
    </div>
  );
}

function IntegrityRow({
  icon: Icon,
  title,
  text,
  tone,
}: {
  icon: typeof FileText;
  title: string;
  text: string;
  tone: "source" | "warning";
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <div
        className={
          tone === "source"
            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2F6B4A]/14 text-[#7ee0a1]"
            : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e0952f]/14 text-[#ffcf8c]"
        }
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="mt-1 text-sm leading-6 text-[#9fb0c6]">{text}</div>
      </div>
    </div>
  );
}
