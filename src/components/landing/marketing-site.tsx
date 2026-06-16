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
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

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

const checks = [
  "No fake citations or page numbers",
  "Soft warnings when evidence is thin",
  "Writing help is allowed, labelled, and source-aware",
  "Student responsibility stays explicit",
];

export function MarketingSite() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <header className="polis-gold-rule fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Polis home">
            <PolisMark priority iconClassName="h-7 w-7" textClassName="h-5" />
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            <a href="#workflow" className="-my-2 inline-flex min-h-9 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Workflow
            </a>
            <a href="#integrity" className="-my-2 inline-flex min-h-9 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Source-backed AI
            </a>
            <a href="#product" className="-my-2 inline-flex min-h-9 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Product
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="-my-2 hidden min-h-9 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
            >
              Start
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 polis-grid" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_0%,var(--gold-soft)_0%,transparent_55%)] opacity-50" aria-hidden="true" />

        <div className="relative mx-auto grid min-h-[calc(100vh-16px)] max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-16 pt-28 sm:px-6 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:pt-24">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[3.6rem] xl:text-[3.9rem]">
              Your module, organized into a source-backed workspace.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              Polis turns scattered coursework into one command center for each module. Import
              your materials, plan the assessment, write with evidence attached, and review before
              submission.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-[0_14px_40px_rgba(22,42,74,0.18)] transition-colors hover:bg-accent/90"
              >
                Start your workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="#workflow"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                See how Polis works
              </a>
            </div>
          </div>

          <WorkspacePreview />
        </div>
      </section>

      <section id="product" className="border-b border-border bg-muted/40 px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionHeading
            title="Built around the way coursework actually moves."
            description="The module is the workspace. Assessments are focused tracks inside it. The source base stays live, so planning and writing never drift away from the material."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Workspace", "One module, one source base, every file in context."],
              ["Assessment", "Question, rubric, deadline, weight, and relevant sources."],
              ["Evidence map", "Claims, counterpoints, and links back to uploaded material."],
              ["Write / Review", "Drafting, restructuring, critique, and citation checks."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset]"
              >
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Import. Plan. Write. Review."
            description="Polis keeps the workflow short on the surface and rigorous underneath. Students see the stages they need, not an abstract AI chat destination."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {workflow.map((item, index) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-5 shadow-[0_16px_45px_rgba(7,17,31,0.05)] transition-all hover:border-border-strong hover:shadow-[0_16px_45px_rgba(7,17,31,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground/70">0{index + 1}</span>
                </div>
                <h3 className="mt-6 font-serif text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="integrity" className="border-y border-border bg-muted/40 px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <SectionHeading
              title="Powerful writing help, with evidence truth kept visible."
              description="Polis can draft, paraphrase, critique, restructure, and revise. It does not pretend unsupported claims are sourced. Evidence gaps become soft warnings, not fabricated references."
            />
            <ul className="mt-8 space-y-3">
              {checks.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_24px_70px_rgba(7,17,31,0.08)]">
            <div className="rounded-xl border border-border bg-card-elevated p-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">Review run</div>
                  <div className="mt-1 text-xs text-muted-foreground">Digital governance essay</div>
                </div>
                <ShieldCheck className="h-5 w-5 text-success" />
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
                <Badge tone="source">Source-supported</Badge>
                <Badge tone="stage">Interpretation</Badge>
                <Badge tone="warning">Needs evidence</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="polis-focal-rule flex flex-col gap-8 rounded-2xl border border-border bg-card-elevated p-8 pl-10 shadow-[0_24px_70px_rgba(7,17,31,0.07)] sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
                Start with a module name, semester, and year.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Then import the material you already have. Polis turns it into the workspace for
                every assessment in that module.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Create workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <PolisMark iconClassName="h-6 w-6" textClassName="h-[1.125rem]" />
          <div className="text-sm text-muted-foreground">
            Source-backed coursework workspace for students.
          </div>
        </div>
      </footer>
    </main>
  );
}

function WorkspacePreview() {
  return (
    <div className="rounded-2xl border border-border bg-card-elevated p-3 shadow-[0_40px_110px_rgba(7,17,31,0.12)]">
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex h-11 items-center gap-2 border-b border-border bg-muted/50 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">PIRR30041 / workspace</span>
        </div>
        <div className="grid min-h-[410px] grid-cols-1 lg:grid-cols-[190px_1fr]">
          <aside className="hidden border-r border-border bg-muted/30 p-4 lg:block">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
                PIR
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight text-foreground">International Security</div>
                <div className="text-xs text-muted-foreground">2026 Spring</div>
              </div>
            </div>
            {["Home", "Imports", "Assessments", "Knowledge Base", "Settings"].map((item, index) => (
              <div
                key={item}
                className={cn(
                  "relative mb-1 rounded-lg px-3 py-1.5 pl-4 text-sm transition-colors",
                  index === 0
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  index === 0 && "before:absolute before:left-1.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:rounded before:bg-gold",
                )}
              >
                {item}
              </div>
            ))}
          </aside>
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl">
                  International Security
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Deterrence, intervention, institutions, and contemporary conflict.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">18 sources</Badge>
                <Badge tone="neutral">3 assessments</Badge>
                <Badge tone="warning">1 needs review</Badge>
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
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm leading-7 text-foreground">
                    Deterrence remains useful when treated as a political signal rather than a
                    purely military doctrine.
                  </p>
                  <div className="mt-4">
                    <Badge tone="success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Source-supported
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/8 p-3 text-xs leading-5 text-warning">
                  <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
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
    <section className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Layers3 className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </section>
  );
}

function PreviewRow({ title, meta, stage }: { title: string; meta: string; stage: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-3 last:mb-0">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{meta}</div>
      </div>
      <Badge tone="stage">{stage}</Badge>
    </div>
  );
}

function EvidenceLine({ label, text, warning = false }: { label: string; text: string; warning?: boolean }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className={cn("text-xs font-semibold", warning ? "text-warning" : "text-success")}>
        {label}
      </div>
      <div className="mt-1 text-sm leading-6 text-foreground">{text}</div>
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
    <div className="flex gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          tone === "source" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="mt-1 text-sm leading-6 text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}
