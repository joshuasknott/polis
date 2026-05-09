export const CLAIM_LABELS = [
  "source_supported",
  "interpretation",
  "user_idea",
  "general_context",
  "unsupported",
] as const;

export type ClaimLabel = (typeof CLAIM_LABELS)[number];

export interface LabelMeta {
  label: ClaimLabel;
  display: string;
  description: string;
  requiresCitation: boolean;
  severity: "info" | "warning" | "error";
}

export const LABEL_META: Record<ClaimLabel, LabelMeta> = {
  source_supported: {
    label: "source_supported",
    display: "Source-Supported",
    description: "Directly backed by text in an uploaded source with citation.",
    requiresCitation: true,
    severity: "info",
  },
  interpretation: {
    label: "interpretation",
    display: "Interpretation",
    description:
      "A reasonable reading of a source — plausible but not explicitly stated. Should still reference the source.",
    requiresCitation: true,
    severity: "info",
  },
  user_idea: {
    label: "user_idea",
    display: "Your Idea",
    description: "The student's own claim or argument, not drawn from a source.",
    requiresCitation: false,
    severity: "info",
  },
  general_context: {
    label: "general_context",
    display: "General Context",
    description:
      "Background knowledge not traceable to a specific uploaded source.",
    requiresCitation: false,
    severity: "info",
  },
  unsupported: {
    label: "unsupported",
    display: "Unsupported",
    description:
      "No evidence found in the current source base. Additional sources may be needed.",
    requiresCitation: false,
    severity: "warning",
  },
};

export function isValidClaimLabel(value: string): value is ClaimLabel {
  return (CLAIM_LABELS as readonly string[]).includes(value);
}

export function labelRequiresCitation(label: ClaimLabel): boolean {
  return LABEL_META[label].requiresCitation;
}
