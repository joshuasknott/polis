import type { ClaimLabel } from "./labels";

export interface UnsupportedClaimPolicy {
  cannotFindMessage: string;
  interpretationReminder: string;
  evidenceSuggestionNote: string;
  prohibitedBehaviours: string[];
}

export const UNSUPPORTED_CLAIM_POLICY: UnsupportedClaimPolicy = {
  cannotFindMessage:
    "I could not find this in your uploaded sources. You may need to upload additional material to support this claim.",
  interpretationReminder:
    "This is an interpretation — a reasonable reading of the available evidence — but it is not directly stated in any of your sources. Label it clearly as your own reading.",
  evidenceSuggestionNote:
    "You might look for sources that address [topic]. I cannot fabricate specific quotes or page numbers.",
  prohibitedBehaviours: [
    "Fabricating citations that do not exist in the uploaded source base",
    "Inventing author names, publication dates, or page numbers",
    "Presenting model-generated text as if it were a direct source quote",
    "Writing content intended to be submitted as the student's own work without disclosure",
  ],
};

export function classifyUnsupportedClaim(label: ClaimLabel): {
  isUnsupported: boolean;
  warningMessage: string | null;
} {
  if (label === "unsupported") {
    return {
      isUnsupported: true,
      warningMessage: UNSUPPORTED_CLAIM_POLICY.cannotFindMessage,
    };
  }
  if (label === "interpretation") {
    return {
      isUnsupported: false,
      warningMessage: UNSUPPORTED_CLAIM_POLICY.interpretationReminder,
    };
  }
  return { isUnsupported: false, warningMessage: null };
}

export function buildUnsupportedClaimWarnings(labels: ClaimLabel[]): string[] {
  const warnings: string[] = [];

  const hasUnsupported = labels.includes("unsupported");
  const allInterpretation =
    !hasUnsupported && labels.every((l) => l === "interpretation" || l === "user_idea");

  if (hasUnsupported) {
    warnings.push(UNSUPPORTED_CLAIM_POLICY.cannotFindMessage);
  }

  if (allInterpretation && labels.length > 0) {
    warnings.push(UNSUPPORTED_CLAIM_POLICY.interpretationReminder);
  }

  return warnings;
}
