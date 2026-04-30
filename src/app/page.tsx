import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Brain,
  FileText,
  Shield,
  ArrowRight,
  Layers,
  Search,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-accent" />
            <span className="text-lg font-semibold tracking-tight">SocialSciencr</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
            <a href="#integrity" className="hover:text-foreground transition-colors">Integrity</a>
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
          >
            Get Started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
            <GraduationCap className="h-3.5 w-3.5" />
            Built for social science coursework
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
            Turn scattered readings into{" "}
            <span className="text-accent">structured arguments</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            SocialSciencr helps social science students organise sources, understand
            readings, build essay plans, and review drafts — using source-grounded AI
            that keeps citations visible and evidence honest.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">70%</div>
              <div className="mt-1 text-sm text-muted-foreground">
                of essay marks depend on source use and argument quality
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">4-6</div>
              <div className="mt-1 text-sm text-muted-foreground">
                modules managed simultaneously by third-year students
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">20+</div>
              <div className="mt-1 text-sm text-muted-foreground">
                readings per module per semester on average
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            From chaos to clarity, one step at a time
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            SocialSciencr mirrors how you actually work: collect materials, understand them, connect ideas, build arguments, draft essays, and review.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { step: "1", label: "Collect", desc: "Organise modules and upload sources", icon: Layers },
            { step: "2", label: "Understand", desc: "Summarise readings and extract concepts", icon: BookOpen },
            { step: "3", label: "Connect", desc: "Compare theories and build evidence banks", icon: Search },
            { step: "4", label: "Argue", desc: "Plan essays with source-grounded arguments", icon: Brain },
            { step: "5", label: "Draft", desc: "Write with evidence and citation awareness", icon: FileText },
            { step: "6", label: "Review", desc: "Check claims, citations, and structure", icon: Shield },
          ].map((item) => (
            <div
              key={item.step}
              className="flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-muted text-sm font-bold text-accent">
                {item.step}
              </div>
              <item.icon className="mt-3 h-5 w-5 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">{item.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Not another PDF chatbot
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              A coursework workflow system that understands how social science students actually work.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Layers,
                title: "Module Workspaces",
                desc: "Each module gets its own workspace with folders for readings, lectures, notes, essays, and drafts — mirroring your course structure.",
              },
              {
                icon: BookOpen,
                title: "Source-Grounded AI",
                desc: "Ask questions and get answers backed by your actual readings, with inline citations and source references. Not generic AI output.",
              },
              {
                icon: Brain,
                title: "Theory Comparison",
                desc: "Compare frameworks and arguments across sources. See where they agree, conflict, and complement each other.",
              },
              {
                icon: FileText,
                title: "Essay Planning",
                desc: "Turn your question and sources into a structured plan with evidence allocation, counterarguments, and gap identification.",
              },
              {
                icon: Shield,
                title: "Citation Safety",
                desc: "Flag unsupported claims, missing citations, and evidence gaps before you submit. Never accidentally misattribute a source.",
              },
              {
                icon: MessageSquare,
                title: "Draft Review",
                desc: "Get structured feedback on your drafts against marking rubrics — strengths, weaknesses, missing evidence, revision priorities.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-sm transition-shadow"
              >
                <feature.icon className="h-5 w-5 text-accent" />
                <h3 className="mt-3 text-sm font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="integrity" className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
              <Shield className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Academic integrity is not optional
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
                SocialSciencr is built to support learning, not replace it. Every AI output is
                labelled as source-supported, interpretation, or general context. Unsupported
                claims are flagged. Citations are traced to real source text. The student
                remains responsible for their final work.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "No fabricated citations or page numbers",
                  "No essay generation for submission",
                  "Clear labelling of all AI outputs",
                  "Warnings when evidence is insufficient",
                  "Source-grounded claims with references",
                  "Draft feedback, not draft writing",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Start organising your coursework
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Explore the prototype. See how SocialSciencr would help you move from scattered PDFs to coherent, source-grounded coursework.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>SocialSciencr — Phase 0 Prototype</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Built for social science students. Not a cheating tool.
          </div>
        </div>
      </footer>
    </div>
  );
}
