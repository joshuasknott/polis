"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
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
  Trash2,
  Target,
  LayoutList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Argument, EvidenceLink, EvidenceStrength, Assignment, SectionPlan } from "@/lib/types";

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

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Linked evidence
            </p>
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

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Counterarguments &amp; rebuttals
            </p>
            {argument.counterarguments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-6 text-center">
                <p className="text-xs text-muted-foreground">No counterarguments mapped yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {argument.counterarguments.map((counter, i) => (
                  <CounterargumentRow key={i} text={counter} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ThesisBlock({ thesis, assignmentConvexId }: { thesis: string; assignmentConvexId: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(thesis);
  const [lastThesis, setLastThesis] = useState(thesis);
  const updateThesis = useMutation(api.assignments.updateThesis);

  if (thesis !== lastThesis) {
    setValue(thesis);
    setLastThesis(thesis);
  }

  const handleSave = async () => {
    await updateThesis({
      assignmentId: assignmentConvexId as Id<"assignments">,
      thesis: value,
    });
    setEditing(false);
  };

  const hasThesis = value.trim().length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Working thesis</p>
        <button
          id="thesis-edit-toggle"
          onClick={() => {
            if (editing) handleSave();
            else setEditing(true);
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          {editing ? "Save" : "Edit"}
        </button>
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            id="thesis-textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm font-serif text-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder="Write your working thesis…"
          />
          {!hasThesis && (
            <p className="text-xs text-muted-foreground italic">
              <span className="font-medium text-warning">[Scaffold]</span> A working thesis helps structure your argument. Write one based on your evidence and position judgement.
            </p>
          )}
        </div>
      ) : (
        <p className="text-base font-serif text-foreground leading-relaxed border-l-4 border-accent pl-4 py-1">
          {hasThesis ? value : <span className="text-muted-foreground italic">No thesis yet — click Edit to add one.</span>}
        </p>
      )}
    </div>
  );
}

interface SectionPlanCardProps {
  plan: SectionPlan;
  arguments: Argument[];
  onDelete: () => void;
}

function SectionPlanCard({ plan, arguments: args, onDelete }: SectionPlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(plan.label);
  const [wordBudget, setWordBudget] = useState(plan.wordBudget);
  const [counterargumentPlan, setCounterargumentPlan] = useState(plan.counterargumentPlan);
  const [rebuttalPlan, setRebuttalPlan] = useState(plan.rebuttalPlan);
  const [selectedArgIds, setSelectedArgIds] = useState<Set<string>>(new Set(plan.argumentIds));

  const updatePlan = useMutation(api.assignments.updateSectionPlan);

  const assignedArgs = args.filter((a) => selectedArgIds.has(a.id));
  const totalEvidence = assignedArgs.reduce((sum, a) => sum + a.evidenceLinks.length, 0);

  const handleSave = async () => {
    await updatePlan({
      sectionPlanId: plan.id as Id<"sectionPlans">,
      label,
      wordBudget,
      argumentIds: Array.from(selectedArgIds) as Id<"arguments">[],
      counterargumentPlan: counterargumentPlan || undefined,
      rebuttalPlan: rebuttalPlan || undefined,
    });
    setEditing(false);
  };

  const toggleArg = (argId: string) => {
    setSelectedArgIds((prev) => {
      const next = new Set(prev);
      if (next.has(argId)) next.delete(argId);
      else next.add(argId);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent/10">
          <span className="text-xs font-bold text-accent">{plan.sortOrder + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{plan.label}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">{plan.wordBudget} words</span>
            <span className="text-xs text-muted-foreground">{assignedArgs.length} arg · {totalEvidence} evidence</span>
          </div>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Section label</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Word budget</label>
                <input
                  type="number"
                  value={wordBudget}
                  onChange={(e) => setWordBudget(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Assigned arguments</label>
                <div className="space-y-1">
                  {args.map((arg) => (
                    <label key={arg.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedArgIds.has(arg.id)}
                        onChange={() => toggleArg(arg.id)}
                        className="rounded border-border"
                      />
                      <span className="line-clamp-1">{arg.claim}</span>
                    </label>
                  ))}
                  {args.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No arguments created yet.</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Counterargument plan</label>
                <textarea
                  value={counterargumentPlan}
                  onChange={(e) => setCounterargumentPlan(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="How will this section address counterarguments?"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Rebuttal plan</label>
                <textarea
                  value={rebuttalPlan}
                  onChange={(e) => setRebuttalPlan(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Planned rebuttal strategy for this section"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                <button onClick={handleSave} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-foreground">Save</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
                <button onClick={onDelete} className="flex items-center gap-1 text-xs text-danger hover:text-danger/80">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>

              {assignedArgs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Arguments</p>
                  <ul className="space-y-1">
                    {assignedArgs.map((a) => (
                      <li key={a.id} className="text-xs text-foreground flex items-start gap-1.5">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-accent flex-shrink-0" />
                        {a.claim}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.counterargumentPlan && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-warning mb-1">Counterargument plan</p>
                  <p className="text-xs text-muted-foreground">{plan.counterargumentPlan}</p>
                </div>
              )}

              {plan.rebuttalPlan && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-success mb-1">Rebuttal plan</p>
                  <p className="text-xs text-muted-foreground">{plan.rebuttalPlan}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface NewSectionPlanFormProps {
  assignmentConvexId: string;
  onClose: () => void;
  existingCount: number;
}

function NewSectionPlanForm({ assignmentConvexId, onClose, existingCount }: NewSectionPlanFormProps) {
  const createPlan = useMutation(api.assignments.createSectionPlan);
  const [label, setLabel] = useState("");
  const [wordBudget, setWordBudget] = useState(500);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!label.trim()) return;
    setSubmitting(true);
    try {
      await createPlan({
        assignmentId: assignmentConvexId as Id<"assignments">,
        label,
        wordBudget,
        sortOrder: existingCount,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New section</h4>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
        placeholder="Section label (e.g. Introduction, Theoretical Framework…)"
      />
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Word budget</label>
        <input
          type="number"
          value={wordBudget}
          onChange={(e) => setWordBudget(Number(e.target.value))}
          className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
          min={0}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!label.trim() || submitting}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-foreground disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Add section"}
        </button>
      </div>
    </div>
  );
}

function WordBudgetBar({ sections, wordLimit }: { sections: SectionPlan[]; wordLimit: number }) {
  const allocated = sections.reduce((sum, s) => sum + s.wordBudget, 0);
  const remaining = wordLimit - allocated;
  const overBudget = remaining < 0;
  const pct = wordLimit > 0 ? Math.min((allocated / wordLimit) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" />
          Word budget
        </p>
        <span className={cn("text-xs font-medium", overBudget ? "text-danger" : remaining === 0 ? "text-success" : "text-muted-foreground")}>
          {allocated} / {wordLimit} words
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", overBudget ? "bg-danger" : "bg-accent")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-muted-foreground">
          {sections.length} section{sections.length !== 1 ? "s" : ""} planned
        </span>
        <span className={cn("text-xs", overBudget ? "text-danger font-medium" : "text-muted-foreground")}>
          {overBudget ? `${Math.abs(remaining)} over budget` : `${remaining} remaining`}
        </span>
      </div>
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
  sectionPlans: SectionPlan[];
  assignmentConvexId: string;
}

export function ArgumentBuilder({ arguments: args, workingThesis, sectionPlans, assignmentConvexId, assignment }: ArgumentBuilderProps) {
  const [showNewSection, setShowNewSection] = useState(false);
  const deletePlan = useMutation(api.assignments.removeSectionPlan);

  return (
    <div className="space-y-8">
      <BuildReadinessSummary args={args} />

      <ThesisBlock thesis={workingThesis ?? ""} assignmentConvexId={assignmentConvexId} />

      <WordBudgetBar sections={sectionPlans} wordLimit={assignment.wordLimit} />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <LayoutList className="h-3.5 w-3.5" />
            Section planner
          </h3>
          <button
            onClick={() => setShowNewSection(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted/60 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add section
          </button>
        </div>

        {sectionPlans.length === 0 && !showNewSection ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center">
            <LayoutList className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No sections planned yet. Add sections to allocate your word budget and evidence.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sectionPlans.map((plan) => (
              <SectionPlanCard
                key={plan.id}
                plan={plan}
                arguments={args}
                onDelete={() => deletePlan({ sectionPlanId: plan.id as Id<"sectionPlans"> })}
              />
            ))}
          </div>
        )}

        {showNewSection && (
          <NewSectionPlanForm
            assignmentConvexId={assignmentConvexId}
            onClose={() => setShowNewSection(false)}
            existingCount={sectionPlans.length}
          />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Argument claims
          </h3>
        </div>

        {args.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No arguments yet. Return to the Map stage to create claims and link evidence.
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
