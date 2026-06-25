import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  LogIn,
  Map,
  PenLine,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { PolisMark } from "@/components/brand/polis-mark";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const walkthrough = [
  {
    title: "Sign up or log in",
    text: "Polis opens into a simple workspace launcher, not a generic chat page.",
    icon: LogIn,
  },
  {
    title: "Create a workspace",
    text: "Enter the module name only. The workspace becomes the command center.",
    icon: Sparkles,
  },
  {
    title: "Track Module Info",
    text: "The setup tracker shows what is present, missing, processing, or ready.",
    icon: CheckCircle2,
  },
  {
    title: "Import Sources",
    text: "Drop in readings, slides, notes, briefs, rubrics, and handbooks.",
    icon: Upload,
  },
  {
    title: "Open Assignments",
    text: "Each assessment track shows deadline, missing context, coverage, and next action.",
    icon: ClipboardList,
  },
  {
    title: "Plan / Write / Review",
    text: "Plan absorbs source selection, evidence, gaps, thesis, and outline before drafting.",
    icon: Map,
  },
];

const phaseRows = [
  {
    phase: "Plan",
    icon: Map,
    text: "Brief, selected sources, source understanding, Evidence Map, gap analysis, thesis, and section plan.",
  },
  {
    phase: "Write",
    icon: PenLine,
    text: "Drafting, source provenance, citation labels, and writing help stay beside the text.",
  },
  {
    phase: "Review",
    icon: ShieldCheck,
    text: "Review findings, citation safety, rubric fit, revision priorities, and readiness checks.",
  },
];

export function MarketingSite() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <header className="polis-gold-rule fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Polis home">
            <PolisMark priority iconClassName="h-7 w-7" textClassName="h-5" />
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            <a href="#walkthrough" className="-my-2 inline-flex min-h-9 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Walkthrough
            </a>
            <a href="#assessment-flow" className="-my-2 inline-flex min-h-9 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Plan / Write / Review
            </a>
            <a href="#source-truth" className="-my-2 inline-flex min-h-9 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Source truth
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="-my-2 hidden min-h-9 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border pt-16 lg:min-h-[calc(100svh-2rem)]">
        <HeroWalkthrough />
        <div className="relative z-10 mx-auto flex max-w-7xl items-center px-5 py-12 sm:px-6 sm:py-16 lg:min-h-[calc(100svh-6rem)] lg:px-8">
          <div className="max-w-2xl">
            <h1 className="font-serif text-5xl font-semibold leading-[1.02] text-foreground sm:text-6xl lg:text-7xl">
              Polis
            </h1>
            <p className="mt-5 max-w-xl text-xl leading-8 text-foreground sm:text-2xl">
              Your module, organized into a source-backed workspace.
            </p>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
              Create a workspace from a module name, import what you already have,
              then work through every assessment with Plan, Write, and Review.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-[0_14px_40px_rgba(22,42,74,0.18)] transition-colors hover:bg-accent/90"
              >
                Start your workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Log in
              </Link>
            </div>
            <MobileHeroWalkthrough />
          </div>
        </div>
      </section>

      <section id="walkthrough" className="border-b border-border px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
              The real product flow, front to back.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Polis follows the way coursework moves: workspace first, sources next,
              assessment tracks after that, then Plan / Write / Review inside the assessment.
            </p>
          </div>

          <div className="mt-12 divide-y divide-border border-y border-border">
            {walkthrough.map((step, index) => (
              <WalkthroughRow key={step.title} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section id="assessment-flow" className="border-b border-border bg-muted/35 px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
              Assessment tracks are local.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Opening an assessment never sends the student to a separate tool.
              The local navigation is Plan, Write, Review, with CoThinker embedded
              where the work is happening.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card-elevated p-4 shadow-[0_24px_70px_rgba(7,17,31,0.07)]">
            <div className="rounded-lg border border-border bg-background">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Digital governance essay</p>
                  <p className="mt-1 text-xs text-muted-foreground">Assessment track</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="warning">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Due in 9d
                  </Badge>
                  <Badge tone="success">8/12 sources</Badge>
                </div>
              </div>
              <div className="grid gap-0 lg:grid-cols-[11rem_1fr]">
                <nav className="border-b border-border p-3 lg:border-b-0 lg:border-r">
                  {phaseRows.map((row, index) => (
                    <div
                      key={row.phase}
                      className={cn(
                        "mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                        index === 0
                          ? "bg-gold-soft/50 text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      <row.icon className="h-4 w-4" />
                      {row.phase}
                    </div>
                  ))}
                </nav>
                <div className="p-5">
                  <div className="grid gap-4 md:grid-cols-3">
                    {phaseRows.map((row) => (
                      <div key={row.phase} className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <row.icon className="h-4 w-4 text-accent" />
                          {row.phase}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {row.text}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-lg border border-warning/30 bg-warning/10 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                      <CircleAlert className="h-4 w-4" />
                      Soft warning, not a hard block
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      If evidence is thin, Polis labels the risk and keeps the student
                      responsible for the final submission.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="source-truth" className="border-b border-border px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
              Writing help is powerful, but evidence truth stays visible.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Polis can draft, paraphrase, critique, restructure, and revise.
              Anything labelled source-supported must trace to a real uploaded source.
            </p>
          </div>
          <div className="space-y-3">
            <TruthRow title="No fake citations" text="Authors, page numbers, quotes, and source records are never invented." tone="success" />
            <TruthRow title="Labels on AI output" text="Source-supported, interpretation, general context, unsupported, and needs evidence stay visible." tone="neutral" />
            <TruthRow title="Citation safety in Review" text="Review findings show unsupported claims, missing evidence, rubric fit, and readiness." tone="warning" />
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="polis-focal-rule flex flex-col gap-8 rounded-xl border border-border bg-card-elevated p-8 pl-10 shadow-[0_24px_70px_rgba(7,17,31,0.07)] sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Start with a module name.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Polis turns the material you already have into a workspace for every assessment in that module.
              </p>
            </div>
            <Link
              href="/sign-up"
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

function WalkthroughRow({
  step,
  index,
}: {
  step: (typeof walkthrough)[number];
  index: number;
}) {
  const Icon = step.icon;
  return (
    <div className="grid gap-5 py-6 md:grid-cols-[6rem_1fr_1.3fr] md:items-center">
      <div className="font-mono text-xs text-muted-foreground">0{index + 1}</div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
      </div>
      <p className="text-sm leading-7 text-muted-foreground">{step.text}</p>
    </div>
  );
}

function TruthRow({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "success" | "warning" | "neutral";
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          tone === "success" && "bg-success/10 text-success",
          tone === "warning" && "bg-warning/10 text-warning",
          tone === "neutral" && "bg-muted text-muted-foreground",
        )}
      >
        {tone === "warning" ? (
          <CircleAlert className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function HeroWalkthrough() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="polis-grid absolute inset-0" />
      <div className="absolute inset-y-10 right-[-8rem] hidden w-[58rem] rotate-[-2deg] lg:block">
        <div className="polis-hero-float rounded-xl border border-border bg-card-elevated p-3 shadow-[0_36px_100px_rgba(7,17,31,0.12)]">
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex h-11 items-center gap-2 border-b border-border bg-muted/50 px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-gold/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                polis / workspace
              </span>
            </div>
            <div className="grid min-h-[33rem] grid-cols-[12rem_1fr_18rem]">
              <aside className="border-r border-border bg-muted/30 p-4">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
                    IR
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-tight text-foreground">International Security</div>
                    <div className="text-xs text-muted-foreground">Workspace</div>
                  </div>
                </div>
                {["Module Info", "Sources", "Assignments", "Settings"].map((item, index) => (
                  <div
                    key={item}
                    className={cn(
                      "mb-1 rounded-lg px-3 py-2 text-sm",
                      index === 2
                        ? "bg-gold-soft/50 text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {item}
                  </div>
                ))}
              </aside>

              <div className="p-5">
                <div className="border-b border-border pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-3xl font-semibold text-foreground">Assessments</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Deadline, missing context, source coverage, next action.
                      </p>
                    </div>
                    <Badge tone="neutral">3 tracks</Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <HeroTrack active title="Digital governance essay" due="Due in 9d" coverage="8/12 sources" action="Open Plan" />
                  <HeroTrack title="Policy briefing" due="Due in 18d" coverage="4/12 sources" action="Select sources" />
                  <HeroTrack title="Literature review" due="No due date" coverage="0/12 sources" action="Add brief" />
                </div>

                <div className="mt-5 rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Map className="h-4 w-4 text-accent" />
                    Plan
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["Brief", "Sources", "Evidence Map"].map((item, index) => (
                      <div
                        key={item}
                        className={cn(
                          "rounded-md border px-3 py-2 text-xs",
                          index < 2
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-warning/30 bg-warning/10 text-warning",
                        )}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="border-l border-border bg-card/70 p-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-foreground">CoThinker</span>
                </div>
                <div className="mt-4 space-y-3">
                  <HeroAssistantCard title="Next action" text="Finish the evidence map before drafting." />
                  <HeroAssistantCard title="Source gap" text="Add one current policy source for the NATO paragraph." warning />
                  <HeroAssistantCard title="Citation safety" text="Only cite uploaded sources with verified metadata." />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileHeroWalkthrough() {
  return (
    <div className="mt-8 rounded-xl border border-border bg-card-elevated p-3 shadow-[0_18px_45px_rgba(7,17,31,0.08)] lg:hidden">
      <div className="rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <div>
            <p className="text-xs font-semibold text-foreground">Assignments</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Assessment tracks</p>
          </div>
          <Badge tone="warning">Due in 9d</Badge>
        </div>
        <div className="p-3">
          <div className="rounded-md border border-gold/50 bg-gold-soft/25 p-3">
            <p className="text-xs font-semibold text-foreground">Digital governance essay</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[9px] text-muted-foreground">8/12 sources</span>
              <span className="rounded-md border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[9px] text-warning">1 gap</span>
              <span className="rounded-md bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-accent-foreground">Open Plan</span>
            </div>
          </div>
          <div className="mt-3 flex rounded-md border border-border bg-card p-1">
            {["Plan", "Write", "Review"].map((phase, index) => (
              <span
                key={phase}
                className={cn(
                  "flex-1 rounded px-2 py-1 text-center text-[10px] font-medium",
                  index === 0 ? "bg-gold-soft/50 text-foreground" : "text-muted-foreground",
                )}
              >
                {phase}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroTrack({
  title,
  due,
  coverage,
  action,
  active = false,
}: {
  title: string;
  due: string;
  coverage: string;
  action: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "polis-hero-step rounded-lg border bg-card p-3",
        active ? "border-gold/50 bg-gold-soft/25" : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">{due}</span>
            <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">{coverage}</span>
          </div>
        </div>
        <span className="shrink-0 rounded-md bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground">
          {action}
        </span>
      </div>
    </div>
  );
}

function HeroAssistantCard({
  title,
  text,
  warning = false,
}: {
  title: string;
  text: string;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        warning ? "border-warning/30 bg-warning/10" : "border-border bg-background",
      )}
    >
      <p className={cn("text-xs font-semibold", warning ? "text-warning" : "text-foreground")}>{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
