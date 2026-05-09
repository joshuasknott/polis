"use client";

import { useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Quote,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  Minus,
  ArrowDown,
  RefreshCw,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Argument, EvidenceLink, EvidenceStrength, Assignment } from "@/lib/types";

const STRENGTH_META: Record<EvidenceStrength, { label: string; icon: React.ElementType; colour: string }> = {
  strong: { label: "Strong", icon: ArrowUp, colour: "text-success" },
  moderate: { label: "Moderate", icon: Minus, colour: "text-warning" },
  weak: { label: "Weak", icon: ArrowDown, colour: "text-danger" },
};

function buildReadiness(arg: Argument): { ready: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!arg.claim.trim()) issues.push("Claim is empty");
  if (arg.evidenceLinks.length === 0) issues.push("No evidence linked");
  if (arg.evidenceLinks.every((l) => l.strength === "weak")) issues.push("All evidence is weak");
  if (arg.counterarguments.length === 0) issues.push("No counterarguments identified");
  if (!arg.synthesis.trim()) issues.push("Synthesis note missing");
  return { ready: issues.length === 0, issues };
}

function EvidencePill({ link }: { link: EvidenceLink }) {
  const s = STRENGTH_META[link.strength];
  const Icon = s.icon;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <Quote className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground line-clamp-1">{link.sourceTitle}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 italic">&ldquo;{link.quote}&rdquo;</p>
        <p className="text-xs text-muted-foreground mt-1">{link.pageRange}</p>
      </div>
      <span className={cn("inline-flex items-center gap-1 text-xs font-medium flex-shrink-0", s.colour)}>
        <Icon className="h-3 w-3" />
        {s.label}
      </span>
    </div>
  );
}

function CounterargumentRow({ text, rebuttal }: { text: string; rebuttal?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-sm text-foreground font-medium">{text}</p>
      {rebuttal ? (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          <span className="font-medium text-foreground">Rebuttal: </span>
          {rebuttal}
        </p>
      ) : (
        <p className="text-xs text-warning mt-1.5 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Rebuttal not yet drafted — address this before building the draft.
        </p>
      )}
    </div>
  );
}

interface ArgumentCardProps {
  argument: Argument;
  index: number;
}

function ArgumentCard({ argument, index }: ArgumentCardProps) {
  const [expanded, setExpanded] = useState(true);
  const { ready, issues } = buildReadiness(argument);

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-colors",
        ready ? "border-success/30 bg-success/5" : "border-border bg-card"
      )}
    >
      {/* Header */}
      <button
        id={`argument-card-${argument.id}`}
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold mt-0.5",
            ready ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
          )}
        >
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">{argument.claim}</p>
          <div className="flex items-center gap-3 mt-1.5">
            {ready ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Build-ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                <AlertTriangle className="h-3.5 w-3.5" />
                {issues.length} issue{issues.length !== 1 ? "s" : ""}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {argument.evidenceLinks.length} evidence · {argument.counterarguments.length} counterarg.
            </span>
          </div>
        </div>

        {expanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-1" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-1" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-5">
          {/* Issues */}
          {!ready && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
              <p className="text-xs font-semibold text-warning mb-1.5">Before building:</p>
              <ul className="space-y-1">
                {issues.map((issue, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-warning flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Linked evidence
              </p>
              <button
                id={`add-evidence-${argument.id}`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            {argument.evidenceLinks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-6 text-center">
                <p className="text-xs text-muted-foreground">No evidence linked yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {argument.evidenceLinks.map((link) => (
                  <EvidencePill key={link.id} link={link} />
                ))}
              </div>
            )}
          </div>

          {/* Synthesis */}
          {argument.synthesis && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Synthesis
              </p>
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
                <p className="text-sm text-foreground leading-relaxed">{argument.synthesis}</p>
              </div>
            </div>
          )}

          {/* Counterarguments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Counterarguments &amp; rebuttals
              </p>
              <button
                id={`add-counter-${argument.id}`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            {argument.counterarguments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-6 text-center">
                <p className="text-xs text-muted-foreground">No counterarguments mapped yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {argument.counterarguments.map((counter, i) => (
                  <CounterargumentRow
                    key={i}
                    text={counter}
                    rebuttal={undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ThesisBlock({ thesis }: { thesis: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(thesis);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Working thesis</p>
        <button
          id="thesis-edit-toggle"
          onClick={() => setEditing((e) => !e)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {editing ? (
        <textarea
          id="thesis-textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm font-serif text-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          placeholder="Write your working thesis…"
        />
      ) : (
        <p className="text-base font-serif text-foreground leading-relaxed border-l-4 border-accent pl-4 py-1">
          {value || <span className="text-muted-foreground italic">No thesis yet — click Edit to add one.</span>}
        </p>
      )}
    </div>
  );
}

function BuildReadinessSummary({ args }: { args: Argument[] }) {
  const readinessResults = args.map((a) => buildReadiness(a));
  const readyCount = readinessResults.filter((r) => r.ready).length;
  const allReady = readyCount === args.length && args.length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-start gap-3",
        allReady ? "border-success/30 bg-success/5" : "border-border bg-muted/30"
      )}
    >
      <FileText
        className={cn("h-5 w-5 flex-shrink-0 mt-0.5", allReady ? "text-success" : "text-muted-foreground")}
      />
      <div>
        <p className="text-sm font-semibold text-foreground">
          {allReady
            ? `All ${args.length} arguments build-ready — proceed to Draft`
            : `${readyCount} of ${args.length} arguments build-ready`}
        </p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {allReady
            ? "Each argument has claims, evidence, synthesis, and counterarguments. You can move to the Draft stage when ready."
            : "Resolve the issues flagged on each argument card before drafting. Polis will not write your draft, but will help you check structure and evidence once you start."}
        </p>
      </div>
    </div>
  );
}

interface ArgumentBuilderProps {
  assignment: Assignment;
  arguments: Argument[];
  workingThesis?: string;
}

const DEFAULT_THESIS =
  "While majoritarian democracies offer greater decisiveness, consensus democracies produce more durable and legitimate policy outcomes when supported by stable bargaining norms.";

export function ArgumentBuilder({ arguments: args, workingThesis }: ArgumentBuilderProps) {
  return (
    <div className="space-y-8">
      {/* Build readiness banner */}
      <BuildReadinessSummary args={args} />

      {/* Working thesis */}
      <ThesisBlock thesis={workingThesis ?? DEFAULT_THESIS} />

      {/* Argument cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Argument claims
          </h3>
          <button
            id="add-argument"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted/60 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add claim
          </button>
        </div>

        {args.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No arguments yet. Add your first claim to begin building.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {args.map((arg, i) => (
              <ArgumentCard key={arg.id} argument={arg} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
