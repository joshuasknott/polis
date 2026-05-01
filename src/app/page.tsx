import Link from "next/link";
import { ArrowRight, BookOpen, FileText, Landmark, Layers3, PenLine, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Landmark className="h-6 w-6 text-accent" />
            <span className="text-lg font-semibold tracking-tight">Polis</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
          >
            Open Workspaces
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pt-24 pb-20">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
              <Landmark className="h-3.5 w-3.5" />
              Politics and International Relations coursework system
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
              Build module knowledge. Plan with context. Draft from evidence.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Polis is a private academic knowledge base and writing workspace for turning readings, lectures, notes, and briefs into source-aware plans and drafts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
              >
                Enter Polis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { label: "Sources", icon: BookOpen, desc: "Readings, lectures, briefs, notes." },
                { label: "Knowledge", icon: Layers3, desc: "Source briefs, concepts, cases, debates." },
                { label: "Context Pack", icon: ShieldCheck, desc: "The selected bundle for one assessment." },
                { label: "Plan", icon: FileText, desc: "Claims, evidence, counterarguments." },
                { label: "Draft", icon: PenLine, desc: "Writing grounded in context." },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-card p-5">
                  <item.icon className="h-5 w-5 text-accent" />
                  <h2 className="mt-3 text-sm font-semibold">{item.label}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
            <h2 className="text-2xl font-bold tracking-tight">By the time you write, Polis already understands the module.</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
              The workflow is deliberately simple: raw sources become compiled knowledge, knowledge becomes a context pack, and the context pack powers the plan, draft, and final revision process.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
