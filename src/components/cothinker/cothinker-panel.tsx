"use client";

import { useState, useMemo } from "react";
import {
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Target,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Swords,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ProductionStage,
  Assignment,
  Argument,
  Review,
  Judgement,

} from "@/lib/types";

type CardType =
  | "next_action"
  | "challenge"
  | "evidence_gap"
  | "rubric_risk"
  | "judgement_prompt"
  | "warning";

type LabelType =
  | "source_supported"
  | "interpretation"
  | "unsupported";

interface CoThinkerCard {
  id: string;
  type: CardType;
  title: string;
  body: string;
  label?: LabelType;
  action?: string;
  severity?: "info" | "warning" | "critical";
}

interface CoThinkerPanelProps {
  stage: ProductionStage;
  assignment: Assignment;
  arguments?: Argument[];
  review?: Review;
  judgements?: Judgement[];
  collapsed?: boolean;
  onToggle?: () => void;
}

const STAGE_CONTEXT: Record<
  ProductionStage,
  { heading: string; description: string; prompts: string[] }
> = {
  ingest: {
    heading: "Collect your material",
    description: "Upload and organise the readings assigned for this coursework.",
    prompts: [
      "Have you uploaded all assigned readings?",
      "Is the assignment brief included?",
      "Do you have the marking rubric?",
    ],
  },
  understand: {
    heading: "Comprehend each source",
    description: "Read and summarise sources before connecting them.",
    prompts: [
      "What is the main argument of each source?",
      "Which key concepts do you need to define?",
      "Where do authors disagree?",
    ],
  },
  map: {
    heading: "Connect ideas across sources",
    description: "Build a picture of how sources relate to each other and to the question.",
    prompts: [
      "Which sources support the same claim?",
      "Where do theoretical frameworks overlap?",
      "What themes emerge across your readings?",
    ],
  },
  judge: {
    heading: "Evaluate your argument",
    description: "Test your evidence base and identify weaknesses before writing.",
    prompts: [
      "Is each claim supported by at least one source?",
      "What are the strongest counterarguments?",
      "Where is your evidence thinnest?",
    ],
  },
  build: {
    heading: "Structure your submission",
    description: "Organise claims, allocate evidence, and plan your word budget.",
    prompts: [
      "Does each section have a clear claim?",
      "Is your word allocation realistic?",
      "Have you planned your introduction and conclusion?",
    ],
  },
  draft: {
    heading: "Write your submission",
    description: "Compose section by section using your argument map and evidence.",
    prompts: [
      "Does each paragraph start with a topic sentence?",
      "Are you citing sources accurately?",
      "Is your argument flowing logically between sections?",
    ],
  },
  refine: {
    heading: "Polish and validate",
    description: "Review your draft against the rubric and address revision priorities.",
    prompts: [
      "Have you addressed all revision priorities?",
      "Are unsupported claims resolved?",
      "Does your conclusion answer the question directly?",
    ],
  },
};

function LabelBadge({ label }: { label: LabelType }) {
  const config = {
    source_supported: {
      text: "Source-supported",
      className: "bg-source/10 text-source border-source/20",
      icon: CheckCircle2,
    },
    interpretation: {
      text: "Interpretation",
      className: "bg-interpretation/10 text-interpretation border-interpretation/20",
      icon: HelpCircle,
    },
    unsupported: {
      text: "Unsupported",
      className: "bg-danger/10 text-danger border-danger/20",
      icon: XCircle,
    },
  };

  const { text, className, icon: Icon } = config[label];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        className
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {text}
    </span>
  );
}

function DirectiveCard({ card }: { card: CoThinkerCard }) {
  const iconMap: Record<CardType, React.ComponentType<{ className?: string }>> = {
    next_action: ArrowRight,
    challenge: Swords,
    evidence_gap: BookOpen,
    rubric_risk: Target,
    judgement_prompt: Scale,
    warning: AlertTriangle,
  };

  const borderMap: Record<CardType, string> = {
    next_action: "border-accent/20 hover:border-accent/40",
    challenge: "border-warning/20 hover:border-warning/40",
    evidence_gap: "border-source/20 hover:border-source/40",
    rubric_risk: "border-danger/20 hover:border-danger/40",
    judgement_prompt: "border-interpretation/20 hover:border-interpretation/40",
    warning: "border-warning/20 hover:border-warning/40",
  };

  const iconColorMap: Record<CardType, string> = {
    next_action: "text-accent",
    challenge: "text-warning",
    evidence_gap: "text-source",
    rubric_risk: "text-danger",
    judgement_prompt: "text-interpretation",
    warning: "text-warning",
  };

  const Icon = iconMap[card.type];

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-all duration-200 cursor-default",
        borderMap[card.type]
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full shrink-0",
            card.type === "next_action" && "bg-accent/10",
            card.type === "challenge" && "bg-warning/10",
            card.type === "evidence_gap" && "bg-source/10",
            card.type === "rubric_risk" && "bg-danger/10",
            card.type === "judgement_prompt" && "bg-interpretation/10",
            card.type === "warning" && "bg-warning/10"
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", iconColorMap[card.type])} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-xs font-semibold text-foreground">
              {card.title}
            </h4>
            {card.label && <LabelBadge label={card.label} />}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {card.body}
          </p>
          {card.action && (
            <button className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors">
              {card.action}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function generateCards(
  stage: ProductionStage,
  assignment: Assignment,
  args: Argument[],
  review?: Review,
  judgements?: Judgement[]
): CoThinkerCard[] {
  const cards: CoThinkerCard[] = [];

  if (stage === "draft") {
    cards.push({
      id: "draft_next",
      type: "next_action",
      title: "Start with your strongest section",
      body: "Begin drafting the section where your evidence is strongest. This builds confidence and helps you find your argumentative voice.",
      action: "View argument map",
    });

    if (args.length > 0) {
      const weakArg = args.find(
        (a) => a.evidenceLinks.length < 2
      );
      if (weakArg) {
        cards.push({
          id: "draft_evidence_gap",
          type: "evidence_gap",
          title: "Thin evidence on a key claim",
          body: `Your claim "${weakArg.claim.slice(0, 60)}…" has only ${weakArg.evidenceLinks.length} evidence link${weakArg.evidenceLinks.length !== 1 ? "s" : ""}. Consider adding another source before writing this section.`,
          label: "unsupported",
          action: "Find supporting evidence",
        });
      }
    }

    cards.push({
      id: "draft_challenge",
      type: "challenge",
      title: "Are you answering the question?",
      body: "Re-read the assignment question before each section. Every paragraph should contribute to answering it directly.",
      label: "interpretation",
    });

    if (assignment.rubric.length > 0) {
      const evidenceRubric = assignment.rubric.find(
        (r) => r.name.toLowerCase().includes("evidence")
      );
      if (evidenceRubric) {
        cards.push({
          id: "draft_rubric_evidence",
          type: "rubric_risk",
          title: `Rubric: ${evidenceRubric.name} (${evidenceRubric.weight}%)`,
          body: `${evidenceRubric.description}. Make sure each paragraph integrates at least one cited source.`,
          action: "Check evidence coverage",
        });
      }
    }

    cards.push({
      id: "draft_warning",
      type: "warning",
      title: "Do not fabricate citations",
      body: "Only cite sources that are in your evidence bank. If you remember a claim but cannot find the source, mark it and return to your readings.",
      label: "source_supported",
    });
  }

  if (stage === "refine") {
    if (review) {
      if (review.unsupportedClaims.length > 0) {
        cards.push({
          id: "refine_unsupported",
          type: "evidence_gap",
          title: `${review.unsupportedClaims.length} unsupported claim${review.unsupportedClaims.length > 1 ? "s" : ""}`,
          body: `These claims need source support: "${review.unsupportedClaims[0]}". Either find a source, rephrase as interpretation, or remove.`,
          label: "unsupported",
          action: "View all unsupported claims",
        });
      }

      if (review.revisionPriorities.length > 0) {
        cards.push({
          id: "refine_next",
          type: "next_action",
          title: "Top revision priority",
          body: review.revisionPriorities[0],
          action: "View all priorities",
        });
      }

      if (review.missingEvidence.length > 0) {
        cards.push({
          id: "refine_missing",
          type: "evidence_gap",
          title: "Evidence gaps remain",
          body: review.missingEvidence[0],
          label: "unsupported",
          action: "View missing evidence",
        });
      }
    }

    cards.push({
      id: "refine_rubric",
      type: "rubric_risk",
      title: "Check rubric alignment",
      body: "Before finalising, compare each rubric criterion against your draft. Focus on the highest-weighted criteria first.",
      action: "View rubric alignment",
    });

    cards.push({
      id: "refine_challenge",
      type: "challenge",
      title: "Would your tutor find a gap?",
      body: "Read your introduction and conclusion together. Does the conclusion deliver what the introduction promises?",
      label: "interpretation",
    });

    cards.push({
      id: "refine_judgement",
      type: "judgement_prompt",
      title: "Your own judgement matters most",
      body: "This review assists your revision. The final submitted work must represent your own understanding and analysis.",
    });
  }

  if (stage === "build") {
    cards.push({
      id: "build_next",
      type: "next_action",
      title: "Allocate your word budget",
      body: "Divide your word limit across sections before writing. Introduction and conclusion typically take 10-15% each.",
      action: "Open section planner",
    });

    cards.push({
      id: "build_challenge",
      type: "challenge",
      title: "Is your thesis specific enough?",
      body: "A strong thesis does not just pick a side — it explains why, using the evidence you have. Test it against your counterarguments.",
      label: "interpretation",
    });
  }

  if (stage === "judge") {
    if (judgements && judgements.length > 0) {
      judgements.forEach((j) => {
        j.findings.forEach((finding, i) => {
          cards.push({
            id: `judge_${j.id}_${i}`,
            type: j.severity === "critical" ? "warning" : "judgement_prompt",
            title: j.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            body: finding,
            severity: j.severity,
            label:
              j.severity === "critical" ? "unsupported" : "interpretation",
          });
        });
      });
    }

    cards.push({
      id: "judge_counter",
      type: "challenge",
      title: "Name the strongest objection",
      body: "For each argument claim, write down the best counterargument you can think of. If you cannot rebut it, your claim needs revision.",
    });
  }

  if (stage === "map") {
    cards.push({
      id: "map_next",
      type: "next_action",
      title: "Link sources to claims",
      body: "For each emerging argument, identify which sources provide supporting evidence and which introduce tension.",
      action: "Open evidence bank",
    });

    cards.push({
      id: "map_challenge",
      type: "challenge",
      title: "Are you reading selectively?",
      body: "Check whether you are only using evidence that supports your preferred conclusion. Engage with sources that disagree.",
      label: "interpretation",
    });
  }

  if (stage === "understand") {
    cards.push({
      id: "understand_next",
      type: "next_action",
      title: "Summarise before connecting",
      body: "Make sure you understand each source individually before trying to compare them. What is the main argument? What evidence is used?",
      action: "Open reading summary",
    });
  }

  if (stage === "ingest") {
    cards.push({
      id: "ingest_next",
      type: "next_action",
      title: "Upload your assigned readings",
      body: "Start with the sources listed in your assignment brief. Include the rubric and any lecture material that is relevant.",
      action: "Upload sources",
    });
  }

  return cards;
}

export function CoThinkerPanel({
  stage,
  assignment,
  arguments: args = [],
  review,
  judgements = [],
  collapsed = false,
  onToggle,
}: CoThinkerPanelProps) {
  const [showPrompts, setShowPrompts] = useState(true);
  const context = STAGE_CONTEXT[stage];

  const cards = useMemo(
    () => generateCards(stage, assignment, args, review, judgements),
    [stage, assignment, args, review, judgements]
  );

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105"
        title="Open CoThinker"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">CoThinker</h2>
          </div>
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
            {stage}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {context.description}
        </p>
      </div>

      {/* Stage-aware prompts */}
      {showPrompts && (
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ask yourself
            </h3>
            <button
              onClick={() => setShowPrompts(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {context.prompts.map((prompt, i) => (
              <div key={i} className="flex items-start gap-2">
                <Lightbulb className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                <span className="text-xs text-foreground/80">{prompt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showPrompts && (
        <button
          onClick={() => setShowPrompts(true)}
          className="px-4 py-2 border-b border-border text-[10px] text-muted-foreground hover:text-foreground transition-colors text-left"
        >
          Show prompts
        </button>
      )}

      {/* Cards */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <DirectiveCard key={card.id} card={card} />
          ))}
        </div>
      </div>

      {/* Footer - academic integrity notice */}
      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <div className="flex items-start gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            CoThinker supports your thinking — it does not write for you. All
            claims are your responsibility. Check your university&apos;s AI use policy.
          </p>
        </div>
      </div>
    </div>
  );
}
