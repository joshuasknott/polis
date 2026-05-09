"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Info,
  User,
  Lightbulb,
  ShieldAlert,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Argument, Assignment, Judgement, RubricCriterion } from "@/lib/types";

interface Position {
  id: string;
  label: string;
  thesis: string;
  evidenceStrength: "strong" | "moderate" | "weak";
  forPoints: string[];
  againstPoints: string[];
  rubricRisks: string[];
  isRecommended: boolean;
}

interface Tradeoff {
  point: string;
  polarity: "for" | "against";
}

function derivePositions(
  assignment: Assignment,
  args: Argument[],
  rubric: RubricCriterion[],
): Position[] {
  if (args.length === 0) {
    return [
      {
        id: "pos_placeholder",
        label: "Awaiting claims",
        thesis: assignment.question
          ? `Map your claims in the Map stage before judging positions for: "${assignment.question}"`
          : "Return to the Map stage to create argument claims before judging positions.",
        evidenceStrength: "weak",
        forPoints: [],
        againstPoints: [],
        rubricRisks: rubric.slice(0, 2).map((c) => `No evidence mapped yet — cannot assess ${c.name}`),
        isRecommended: false,
      },
    ];
  }

  const positions: Position[] = [];
  const strongEvidence = args.flatMap((a) =>
    a.evidenceLinks.filter((l) => l.strength === "strong")
  );
  const weakEvidence = args.flatMap((a) =>
    a.evidenceLinks.filter((l) => l.strength === "weak")
  );
  const allCounterargs = args.flatMap((a) => a.counterarguments);

  if (args.length >= 1) {
    const primaryClaim = args[0];
    const strongCount = primaryClaim.evidenceLinks.filter((l) => l.strength === "strong").length;
    const moderateCount = primaryClaim.evidenceLinks.filter((l) => l.strength === "moderate").length;

    const evidenceStrength: "strong" | "moderate" | "weak" =
      strongCount >= 2 ? "strong" : strongCount + moderateCount >= 2 ? "moderate" : "weak";

    positions.push({
      id: "pos_primary",
      label: "Primary position",
      thesis: primaryClaim.claim,
      evidenceStrength,
      forPoints: primaryClaim.evidenceLinks
        .filter((l) => l.strength === "strong" || l.strength === "moderate")
        .map((l) => `${l.sourceTitle} (${l.pageRange}): ${l.strength} evidence`)
        .slice(0, 5),
      againstPoints: allCounterargs.slice(0, 4),
      rubricRisks: deriveRubricRiskTexts(rubric, primaryClaim.evidenceLinks.length, allCounterargs.length),
      isRecommended: evidenceStrength !== "weak",
    });
  }

  if (args.length >= 2) {
    const alternativeClaim = args[1];
    const altStrongCount = alternativeClaim.evidenceLinks.filter((l) => l.strength === "strong").length;

    positions.push({
      id: "pos_alternative",
      label: "Alternative position",
      thesis: alternativeClaim.claim,
      evidenceStrength: altStrongCount >= 2 ? "strong" : altStrongCount >= 1 ? "moderate" : "weak",
      forPoints: alternativeClaim.evidenceLinks
        .filter((l) => l.strength === "strong" || l.strength === "moderate")
        .map((l) => `${l.sourceTitle} (${l.pageRange}): ${l.strength} evidence`)
        .slice(0, 5),
      againstPoints: allCounterargs.slice(0, 4),
      rubricRisks: deriveRubricRiskTexts(rubric, alternativeClaim.evidenceLinks.length, allCounterargs.length),
      isRecommended: false,
    });
  }

  if (strongEvidence.length > 0 && weakEvidence.length > 0) {
    positions.push({
      id: "pos_nuanced",
      label: "Nuanced position",
      thesis: `A qualified position drawing on both supporting and complicating evidence from your ${args.length} mapped claims.`,
      evidenceStrength: "moderate",
      forPoints: strongEvidence.slice(0, 3).map((l) => `${l.sourceTitle}: strong support`),
      againstPoints: weakEvidence.slice(0, 3).map((l) => `${l.sourceTitle}: weak/complicating`),
      rubricRisks: rubric.slice(0, 2).map((c) => `${c.name}: nuanced position requires careful signposting to meet this criterion.`),
      isRecommended: args.length >= 3 && strongEvidence.length >= 3,
    });
  }

  return positions.length > 0 ? positions : [
    {
      id: "pos_empty",
      label: "No positions derivable",
      thesis: "Create and map argument claims to generate judgement positions.",
      evidenceStrength: "weak" as const,
      forPoints: [],
      againstPoints: [],
      rubricRisks: [],
      isRecommended: false,
    },
  ];
}

function deriveRubricRiskTexts(
  rubric: RubricCriterion[],
  evidenceCount: number,
  counterargumentCount: number,
): string[] {
  const risks: string[] = [];
  for (const c of rubric.slice(0, 4)) {
    if (c.name.toLowerCase().includes("evidence") && evidenceCount < 3) {
      risks.push(`${c.name}: only ${evidenceCount} evidence item(s) linked — may not meet this criterion.`);
    } else if (c.name.toLowerCase().includes("critical") && counterargumentCount === 0) {
      risks.push(`${c.name}: no counterarguments identified — critical analysis may be insufficient.`);
    } else if (c.name.toLowerCase().includes("argument") && evidenceCount === 0) {
      risks.push(`${c.name}: no evidence linked to support arguments.`);
    } else {
      risks.push(`${c.name}: review this criterion before drafting.`);
    }
  }
  return risks;
}

function deriveTradeoffs(args: Argument[]): Tradeoff[] {
  if (args.length === 0) return [];

  const tradeoffs: Tradeoff[] = [];
  for (const arg of args) {
    const strongEvidence = arg.evidenceLinks.filter((l) => l.strength === "strong");
    if (strongEvidence.length > 0) {
      tradeoffs.push({
        point: `"${arg.claim.slice(0, 60)}${arg.claim.length > 60 ? "…" : ""}" — ${strongEvidence.length} strong evidence item(s)`,
        polarity: "for",
      });
    }
  }

  for (const arg of args) {
    for (const counter of arg.counterarguments.slice(0, 2)) {
      tradeoffs.push({
        point: counter,
        polarity: "against",
      });
    }
  }

  const totalWeak = args.flatMap((a) => a.evidenceLinks).filter((l) => l.strength === "weak").length;
  if (totalWeak > 0) {
    tradeoffs.push({
      point: `${totalWeak} evidence item(s) rated weak — consider whether these sufficiently support your argument.`,
      polarity: "against",
    });
  }

  return tradeoffs.length > 0 ? tradeoffs : [
    { point: "Map claims and link evidence to see tradeoffs.", polarity: "for" as const },
  ];
}

function deriveRubricRisks(rubric: RubricCriterion[], args: Argument[]): Array<{ criterion: string; risk: string; severity: "low" | "medium" | "high" }> {
  if (rubric.length === 0) return [];

  const totalEvidence = args.reduce((sum, a) => sum + a.evidenceLinks.length, 0);
  const totalCounterargs = args.reduce((sum, a) => sum + a.counterarguments.length, 0);

  return rubric.slice(0, 5).map((c) => {
    let risk: string;
    let severity: "low" | "medium" | "high";

    if (c.name.toLowerCase().includes("evidence")) {
      if (totalEvidence === 0) {
        risk = "No evidence linked to any argument — this criterion cannot be met.";
        severity = "high";
      } else if (totalEvidence < 3) {
        risk = `Only ${totalEvidence} evidence item(s) across all claims — may need more sources.`;
        severity = "medium";
      } else {
        risk = `${totalEvidence} evidence items linked — review for balanced coverage.`;
        severity = "low";
      }
    } else if (c.name.toLowerCase().includes("critical")) {
      if (totalCounterargs === 0) {
        risk = "No counterarguments identified — critical analysis will be lacking.";
        severity = "high";
      } else {
        risk = `${totalCounterargs} counterargument(s) identified — ensure rebuttals are planned.`;
        severity = "medium";
      }
    } else if (c.name.toLowerCase().includes("structure") || c.name.toLowerCase().includes("argument")) {
      if (args.length === 0) {
        risk = "No argument claims created yet.";
        severity = "high";
      } else if (args.length < 2) {
        risk = "Only one claim mapped — consider developing additional lines of argument.";
        severity = "medium";
      } else {
        risk = `${args.length} claims mapped — check logical ordering.`;
        severity = "low";
      }
    } else {
      risk = "Review this criterion against your mapped evidence before drafting.";
      severity = "medium";
    }

    return { criterion: c.name, risk, severity };
  });
}

function getDirectivePrompts(assignment: Assignment, args: Argument[]): string[] {
  const prompts: string[] = [];

  if (args.length > 0) {
    prompts.push(
      `What counterarguments does my current source base raise against my primary claim: "${args[0]?.claim.slice(0, 80)}"?`
    );
  }

  if (args.length > 1) {
    prompts.push(
      "Where is the evidence weakest across my mapped claims, and what type of source would strengthen it?"
    );
  }

  prompts.push(
    "Am I relying too heavily on any single source, or is my evidence base well-distributed?"
  );

  if (assignment.rubric.length > 0) {
    prompts.push(
      `What does the ${assignment.rubric[0].name} rubric criterion require that my current evidence might not address?`
    );
  }

  prompts.push("What assumptions am I making that are not yet supported by my sources?");

  return prompts.slice(0, 5);
}

const STRENGTH_META: Record<string, { label: string; colour: string }> = {
  strong: { label: "Strong evidence base", colour: "text-success" },
  moderate: { label: "Moderate evidence base", colour: "text-warning" },
  weak: { label: "Weak evidence base", colour: "text-danger" },
};

function PositionCard({
  position,
  isSelected,
  onSelect,
}: {
  position: Position;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const strengthMeta = STRENGTH_META[position.evidenceStrength];

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all",
        isSelected ? "border-accent bg-accent/5 shadow-sm" : "border-border bg-card hover:border-foreground/30"
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {position.label}
              </span>
              {position.isRecommended && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  <Lightbulb className="h-3 w-3" />
                  Recommended by evidence
                </span>
              )}
            </div>
            <p className="text-sm font-serif text-foreground leading-relaxed">{position.thesis}</p>
            {position.evidenceStrength !== "weak" && (
              <p className={cn("text-xs font-medium mt-2", strengthMeta.colour)}>
                <span className="text-xs text-muted-foreground mr-1">[Interpretation]</span>
                {strengthMeta.label}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            id={`judge-select-${position.id}`}
            onClick={() => onSelect(position.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isSelected
                ? "bg-accent text-accent-foreground"
                : "border border-border bg-card text-foreground hover:bg-muted/60"
            )}
          >
            {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
            {isSelected ? "Position selected" : "Select this position"}
          </button>

          <button
            id={`judge-expand-${position.id}`}
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {expanded ? "Less" : "Tradeoffs"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-success mb-2">Evidence for</p>
              {position.forPoints.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No strong evidence collected yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {position.forPoints.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-danger mb-2">Evidence against</p>
              {position.againstPoints.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No counterarguments identified yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {position.againstPoints.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {position.rubricRisks.length > 0 && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-warning mb-2 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                Rubric risks
              </p>
              <ul className="space-y-1">
                {position.rubricRisks.map((r, i) => (
                  <li key={i} className="text-xs text-muted-foreground">{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TradeoffList({ tradeoffs }: { tradeoffs: Tradeoff[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Overall tradeoffs
      </p>
      {tradeoffs.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Map claims and evidence to see tradeoffs.</p>
      ) : (
        <div className="space-y-2">
          {tradeoffs.map((t, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className={cn(
                  "flex-shrink-0 mt-1 h-2 w-2 rounded-full",
                  t.polarity === "for" ? "bg-success" : "bg-warning"
                )}
              />
              <p className="text-sm text-foreground">{t.point}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RubricRiskTable({
  risks,
}: {
  risks: Array<{ criterion: string; risk: string; severity: "low" | "medium" | "high" }>;
}) {
  const severityColour = { low: "text-success", medium: "text-warning", high: "text-danger" } as const;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <BookMarked className="h-3.5 w-3.5" />
          Rubric risk assessment
        </p>
      </div>
      {risks.length === 0 ? (
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground italic">No rubric criteria defined for this assignment.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {risks.map((r, i) => (
            <div key={i} className="px-5 py-3 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{r.criterion}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.risk}</p>
              </div>
              <span className={cn("text-xs font-semibold uppercase tracking-wider flex-shrink-0", severityColour[r.severity])}>
                {r.severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HumanDecisionBanner({ hasSelected }: { hasSelected: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-start gap-3 transition-colors",
        hasSelected ? "border-success/30 bg-success/5" : "border-border bg-muted/30"
      )}
    >
      <User className={cn("h-5 w-5 flex-shrink-0 mt-0.5", hasSelected ? "text-success" : "text-muted-foreground")} />
      <div>
        <p className="text-sm font-semibold text-foreground">
          {hasSelected ? "Position recorded — your judgement drives the build." : "Your judgement required"}
        </p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {hasSelected
            ? "You have selected a position. You can revise this at any point."
            : "Polis has mapped the evidence and identified tradeoffs. Only you can decide which position your argument will defend. Select a position above to unlock the Build stage."}
        </p>
      </div>
    </div>
  );
}

function CoThinkerPrompts({ prompts }: { prompts: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5" />
        Directive prompts — ask your CoThinker
      </p>
      <ul className="space-y-2">
        {prompts.map((prompt, i) => (
          <li key={i}>
            <button
              id={`judge-prompt-${i}`}
              className="w-full text-left flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-foreground hover:border-accent/40 hover:bg-accent/5 transition-colors group"
            >
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-accent transition-colors" />
              {prompt}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-3">
        These prompts open a CoThinker conversation scoped to your assignment source base.
      </p>
    </div>
  );
}

interface JudgeStageProps {
  assignment: Assignment;
  arguments: Argument[];
  judgements?: Judgement[];
  assignmentConvexId: string;
}

export function JudgeStage({ assignment, arguments: args, assignmentConvexId }: JudgeStageProps) {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const recordDecision = useMutation(api.judgements.recordDecision);

  const positions = derivePositions(assignment, args, assignment.rubric);
  const tradeoffs = deriveTradeoffs(args);
  const rubricRisks = deriveRubricRisks(assignment.rubric, args);
  const directivePrompts = getDirectivePrompts(assignment, args);

  const handleSelect = async (positionId: string) => {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;

    setSelectedPosition(positionId);

    await recordDecision({
      assignmentId: assignmentConvexId as Id<"assignments">,
      type: "position_selection",
      content: `Selected position: ${pos.label} — ${pos.thesis}`,
      severity: "info",
    });
  };

  return (
    <div className="space-y-8">
      <HumanDecisionBanner hasSelected={selectedPosition !== null} />

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Possible positions
        </h3>
        <div className="space-y-4">
          {positions.map((pos) => (
            <PositionCard
              key={pos.id}
              position={pos}
              isSelected={selectedPosition === pos.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      <TradeoffList tradeoffs={tradeoffs} />

      <RubricRiskTable risks={rubricRisks} />

      <CoThinkerPrompts prompts={directivePrompts} />
    </div>
  );
}
