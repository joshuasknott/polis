"use client";

import { useState } from "react";
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

type TradeoffPolarity = "for" | "against";

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
  polarity: TradeoffPolarity;
}

function derivePositions(assignment: Assignment, args: Argument[]): Position[] {
  const hasManyArgs = args.length >= 2;
  const firstClaim = args[0]?.claim ?? "Position not yet established";

  return [
    {
      id: "pos_a",
      label: hasManyArgs ? "Consensus advantage" : "Primary position",
      thesis:
        hasManyArgs
          ? "Consensus democracies better deliver effective government because multi-actor bargaining produces durable, inclusive policy."
          : firstClaim,
      evidenceStrength: "moderate",
      forPoints: args
        .slice(0, 2)
        .flatMap((a) => a.evidenceLinks)
        .filter((l) => l.strength === "strong")
        .map((l) => `${l.sourceTitle} (${l.pageRange}): strong evidence`)
        .slice(0, 3),
      againstPoints: args.flatMap((a) => a.counterarguments).slice(0, 2),
      rubricRisks: [
        "Evidence use: majoritarian side remains comparatively weak",
        "Critical analysis: counterargument on crisis response not yet addressed",
      ],
      isRecommended: true,
    },
    {
      id: "pos_b",
      label: hasManyArgs ? "Majoritarian challenge" : "Alternative position",
      thesis:
        "Majoritarian democracies are more effective because decisiveness and clear accountability drive responsive governance.",
      evidenceStrength: "weak",
      forPoints: ["Westminster decisiveness argument (lecture evidence)", "Electoral accountability mechanism"],
      againstPoints: [
        "Only lecture source supports this; no peer-reviewed backing",
        "Policy reversal risk is unaddressed",
      ],
      rubricRisks: [
        "Argument clarity: harder to sustain with current source base",
        "Use of evidence: significant gap in peer-reviewed sources",
      ],
      isRecommended: false,
    },
  ];
}

function deriveTradeoffs(args: Argument[]): Tradeoff[] {
  const counterarguments = args.flatMap((a) => a.counterarguments);
  return [
    { point: "Strong theoretical grounding via Lijphart + Tsebelis", polarity: "for" },
    { point: "Qvortrup's polarisation argument adds necessary nuance", polarity: "for" },
    {
      point: counterarguments[0] ?? "Consensus systems may respond slowly in crises",
      polarity: "against",
    },
    {
      point: counterarguments[1] ?? "Accountability diffusion is a genuine democratic concern",
      polarity: "against",
    },
    { point: "Majoritarian peer-reviewed support is missing from current source base", polarity: "against" },
  ];
}

function deriveRubricRisks(rubric: RubricCriterion[]): Array<{ criterion: string; risk: string; severity: "low" | "medium" | "high" }> {
  return rubric.slice(0, 5).map((c, i) => ({
    criterion: c.name,
    risk: [
      "Strong direction; maintain consistent argument through draft.",
      "Lijphart and Tsebelis covered well; ensure accurate application.",
      "Majoritarian side needs a peer-reviewed source to meet this criterion.",
      "Three-argument structure is logical; signpost transitions explicitly.",
      "Counterarguments are identified but rebuttals need development.",
    ][i] ?? "Review rubric criterion before drafting.",
    severity: (["low", "low", "high", "low", "medium"] as const)[i] ?? "medium",
  }));
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
            <p className={cn("text-xs font-medium mt-2", strengthMeta.colour)}>{strengthMeta.label}</p>
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
              <ul className="space-y-1.5">
                {position.againstPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-warning mb-2 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              Rubric risks
            </p>
            <ul className="space-y-1">
              {position.rubricRisks.map((r, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  {r}
                </li>
              ))}
            </ul>
          </div>
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
          Polis has mapped the evidence and identified tradeoffs. Only you can decide which position your argument
          will defend. Select a position above to unlock the Build stage. You can revise at any point.
        </p>
      </div>
    </div>
  );
}

interface CoThinkerPromptProps {
  prompts: string[];
}

function CoThinkerPrompts({ prompts }: CoThinkerPromptProps) {
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
}

export function JudgeStage({ assignment, arguments: args }: JudgeStageProps) {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  const positions = derivePositions(assignment, args);
  const tradeoffs = deriveTradeoffs(args);
  const rubricRisks = deriveRubricRisks(assignment.rubric);

  const directivePrompts = [
    "What counterarguments does the current source base raise against the consensus position?",
    "Is there enough evidence to defend the majoritarian decisiveness claim with academic sources?",
    "Where is the evidence for Policy Position A weakest, and what type of source would strengthen it?",
    "How does Qvortrup's polarisation argument change the strength of the consensus position?",
    "What would the rubric's critical analysis criterion require that isn't yet addressed?",
  ];

  return (
    <div className="space-y-8">
      {/* Human decision banner */}
      <HumanDecisionBanner hasSelected={selectedPosition !== null} />

      {/* Positions */}
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
              onSelect={setSelectedPosition}
            />
          ))}
        </div>
      </div>

      {/* Tradeoffs */}
      <TradeoffList tradeoffs={tradeoffs} />

      {/* Rubric risk table */}
      <RubricRiskTable risks={rubricRisks} />

      {/* CoThinker prompts */}
      <CoThinkerPrompts prompts={directivePrompts} />
    </div>
  );
}
