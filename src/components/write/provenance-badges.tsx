"use client";

import {
  CheckCircle2,
  HelpCircle,
  XCircle,
  AlertTriangle,
  Quote,
  Sparkles,
  BookOpen,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ProvenanceLabel,
  ProvenanceWarning,
} from "@/lib/types";
import { PROVENANCE_LABEL_META } from "@/lib/integrity/draft-provenance";

const LABEL_ICON: Record<ProvenanceLabel, React.ComponentType<{ className?: string }>> = {
  quoted: Quote,
  paraphrased: BookOpen,
  source_supported: CheckCircle2,
  interpretation: HelpCircle,
  generated: Sparkles,
  unsupported: XCircle,
};

interface ProvenanceBadgeProps {
  label: ProvenanceLabel;
  size?: "sm" | "md";
  withIcon?: boolean;
  className?: string;
}

export function ProvenanceBadge({
  label,
  size = "sm",
  withIcon = true,
  className,
}: ProvenanceBadgeProps) {
  const meta = PROVENANCE_LABEL_META[label];
  const Icon = LABEL_ICON[label];
  const sizing =
    size === "sm"
      ? "px-1.5 py-0.5 text-[10px]"
      : "px-2.5 py-1 text-[11px]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium uppercase tracking-wider",
        meta.badgeClass,
        sizing,
        className,
      )}
      title={meta.description}
    >
      {withIcon && <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />}
      {meta.shortDisplay}
    </span>
  );
}

const WARNING_ICON = {
  info: HelpCircle,
  warning: AlertTriangle,
  critical: ShieldAlert,
} as const;

const WARNING_STYLE = {
  info: "border-accent/30 bg-accent/5 text-accent",
  warning: "border-warning/30 bg-warning/5 text-warning",
  critical: "border-danger/40 bg-danger/10 text-danger",
} as const;

interface ProvenanceWarningPillProps {
  warning: ProvenanceWarning;
  className?: string;
}

export function ProvenanceWarningPill({
  warning,
  className,
}: ProvenanceWarningPillProps) {
  const Icon = WARNING_ICON[warning.severity];
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-[11px] leading-relaxed",
        WARNING_STYLE[warning.severity],
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0 mt-0.5" />
      <span>{warning.message}</span>
    </div>
  );
}

interface ProvenanceWarningListProps {
  warnings: ProvenanceWarning[];
  className?: string;
  max?: number;
}

export function ProvenanceWarningList({
  warnings,
  className,
  max,
}: ProvenanceWarningListProps) {
  if (warnings.length === 0) return null;
  const items = max ? warnings.slice(0, max) : warnings;
  const remaining = max ? Math.max(0, warnings.length - max) : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      {items.map((w, i) => (
        <ProvenanceWarningPill key={`${w.code}-${i}`} warning={w} />
      ))}
      {remaining > 0 && (
        <p className="px-1 text-[10px] text-muted-foreground">
          +{remaining} more warning{remaining > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export function ProvenanceLabelDot({ label }: { label: ProvenanceLabel }) {
  const meta = PROVENANCE_LABEL_META[label];
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", meta.dotClass)}
      aria-hidden="true"
    />
  );
}

export { LABEL_ICON };
