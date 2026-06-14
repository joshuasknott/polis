"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  PROVIDERS,
  type ProviderId,
  type ChatMessage,
} from "./ai_providers";
import { decrypt } from "./ai_crypto";
import { callZaiProvider } from "./ai_zai";
import { callGeminiProvider } from "./ai_gemini";

const GAP_ANALYSIS_SYSTEM_PROMPT = `You are Polis, an academic gap-analysis assistant for social science students. You compare an assessment specification against the student's uploaded source base and identify coverage gaps.

## Academic Integrity Rules (NON-NEGOTIABLE)
1. ONLY reference sources that are listed in the provided source base. Use [Source N] notation.
2. NEVER fabricate citations, authors, titles, page numbers, or DOIs.
3. NEVER recommend a specific external work by name in your findings — source discovery is handled separately. Describe the TYPE of source that is missing (e.g., "a recent empirical study on X"), not a fabricated title.
4. ALWAYS label each finding: source_supported (grounded in a listed source), interpretation (your reading), general_context (background knowledge), or unsupported (not enough evidence to judge).
5. ALWAYS assign an honest confidence score (0.0-1.0). Low evidence => low confidence.
6. If the source base is too thin to analyse, say so. Mark findings as unsupported with low confidence.
7. Do not write essay content. Only diagnose coverage gaps.

## Citation Format
- Use [Source N] to refer to the Nth source in the provided list.
- When noting that a source DOES cover something, cite it: "[Source 3] addresses ...".
- When noting a GAP, do not invent a source — describe the gap.`;

const VALID_CATEGORIES = new Set([
  "missing_theory",
  "missing_method",
  "missing_concept",
  "missing_evidence_type",
  "missing_counterargument",
  "rubric_gap",
  "required_reading_missing",
  "weak_source_coverage",
  "scope_gap",
]);

const VALID_SEVERITIES = new Set(["info", "warning", "critical"]);
const VALID_LABELS = new Set([
  "source_supported",
  "interpretation",
  "general_context",
  "unsupported",
]);

interface GapContextSource {
  source: {
    _id: Id<"sources">;
    title: string;
    authors?: string;
    year?: number;
    type: string;
  };
  summary: string | null;
  mainArgument: string | null;
  limitations: string | null;
  concepts: Array<{ concept: string; definition?: string }>;
  claims: Array<{ claim: string; strength?: string }>;
  sampleChunks: Array<{
    chunkId: Id<"sourceChunks">;
    text: string;
    pageStart?: number;
    pageEnd?: number;
  }>;
}

interface GapContext {
  module: {
    title: string;
    code: string;
    themes?: string[];
    concepts?: string[];
    learningOutcomes?: string[];
  };
  assignment: {
    title: string;
    question?: string;
    wordLimit?: number;
    rubric?: Array<{ name: string; description: string; weight: number }>;
  };
  assessmentSpecs: Array<{
    title: string;
    question?: string;
    wordLimit?: number;
    deadline?: string;
    weight?: number;
  }>;
  requiredReadings: Array<{
    title: string;
    authors?: string;
    year?: number;
    sourceId: Id<"sources"> | null;
  }>;
  sources: GapContextSource[];
  argumentCount: number;
  evidenceCount: number;
  sourceCount: number;
  chunkCount: number;
}

interface ParsedFinding {
  gapCategory: string;
  title: string;
  content: string;
  severity: string;
  confidence: number;
  rationale: string;
  label: string;
  citedChunkIds: Id<"sourceChunks">[];
  relatedRubricCriterion?: string;
  suggestedSearchTerms?: string[];
}

interface ParsedResult {
  summary: string;
  overallConfidence: number;
  warnings: string[];
  findings: ParsedFinding[];
}

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1) + "\u2026";
}

function buildSourceBlock(idx: number, s: GapContextSource): string {
  const meta = s.source;
  const authorYear = [meta.authors, meta.year ? `(${meta.year})` : ""]
    .filter(Boolean)
    .join(" ");
  const lines: string[] = [];
  lines.push(`[Source ${idx}] ${truncate(meta.title, 200)}${authorYear ? ` — ${authorYear}` : ""} (type: ${meta.type})`);
  if (s.summary) lines.push(`  Summary: ${truncate(s.summary, 320)}`);
  if (s.mainArgument) lines.push(`  Main argument: ${truncate(s.mainArgument, 280)}`);
  if (s.concepts.length > 0) {
    lines.push(`  Concepts: ${s.concepts.slice(0, 8).map((c) => c.concept).join("; ")}`);
  }
  if (s.claims.length > 0) {
    lines.push(`  Claims: ${s.claims.slice(0, 6).map((c) => c.claim).join("; ")}`);
  }
  if (s.sampleChunks.length > 0) {
    const chunk = s.sampleChunks[0];
    const pages =
      chunk.pageStart != null
        ? chunk.pageEnd != null && chunk.chunkId
          ? ` (pp. ${chunk.pageStart}-${chunk.pageEnd})`
          : ` (p. ${chunk.pageStart})`
        : "";
    lines.push(`  Excerpt${pages}: ${truncate(chunk.text, 280)}`);
  }
  return lines.join("\n");
}

function buildGapPrompt(ctx: GapContext): string {
  const { assignment, module: mod, assessmentSpecs, requiredReadings, sources } = ctx;

  const sections: string[] = [];

  sections.push(`# Module\n${mod.title} (${mod.code})`);
  if (mod.themes && mod.themes.length > 0) {
    sections.push(`Themes: ${mod.themes.join(", ")}`);
  }
  if (mod.learningOutcomes && mod.learningOutcomes.length > 0) {
    sections.push(`Learning outcomes: ${mod.learningOutcomes.slice(0, 6).join("; ")}`);
  }

  const briefLines: string[] = [`# Assessment: ${assignment.title}`];
  if (assignment.question) briefLines.push(`Question: ${assignment.question}`);
  if (assignment.wordLimit) briefLines.push(`Word limit: ${assignment.wordLimit}`);
  if (assignment.rubric && assignment.rubric.length > 0) {
    briefLines.push("Rubric:");
    for (const r of assignment.rubric) {
      briefLines.push(`  - ${r.name} (${r.weight}%): ${r.description}`);
    }
  }
  sections.push(briefLines.join("\n"));

  if (assessmentSpecs.length > 0) {
    const specLines = assessmentSpecs.slice(0, 3).map((s) => {
      const parts = [s.title];
      if (s.question) parts.push(`Q: ${truncate(s.question, 400)}`);
      if (s.wordLimit) parts.push(`Word limit: ${s.wordLimit}`);
      if (s.deadline) parts.push(`Deadline: ${s.deadline}`);
      return parts.join(" | ");
    });
    sections.push(`# Extracted assessment specs\n${specLines.join("\n")}`);
  }

  if (requiredReadings.length > 0) {
    const readingLines = requiredReadings.slice(0, 30).map((r, i) => {
      const status = r.sourceId ? "[UPLOADED]" : "[MISSING]";
      const authorYear = [r.authors, r.year ? `(${r.year})` : ""].filter(Boolean).join(" ");
      return `${i + 1}. ${status} ${truncate(r.title, 160)}${authorYear ? ` — ${authorYear}` : ""}`;
    });
    sections.push(`# Required readings (${requiredReadings.length})\nMark each MISSING reading as a required_reading_missing gap.\n${readingLines.join("\n")}`);
  }

  if (sources.length === 0) {
    sections.push("# Uploaded sources\nNONE. The student has not uploaded any sources for this assignment. Flag this as a critical scope_gap.");
  } else {
    const sourceBlocks = sources.map((s, i) => buildSourceBlock(i + 1, s));
    sections.push(`# Uploaded sources (${sources.length})\n${sourceBlocks.join("\n\n")}`);
  }

  sections.push(`# Argument map\n${ctx.argumentCount} argument(s) with ${ctx.evidenceCount} evidence link(s).`);

  const instructions = `# Your task
Compare the assessment spec against the uploaded sources. Identify coverage gaps.

For EACH gap, output a finding. Categories (use exactly one):
- missing_theory: a theoretical framework the question requires but no source covers
- missing_method: a methodological perspective absent from the source base
- missing_concept: a key concept implied by the question that no source addresses
- missing_evidence_type: a kind of evidence missing (empirical data, case studies, historical, comparative, etc.)
- missing_counterargument: no source represents an opposing or qualifying view the question demands
- rubric_gap: a specific rubric criterion the source base cannot substantively support
- required_reading_missing: a required reading listed above that is NOT marked [UPLOADED]
- weak_source_coverage: a topic is addressed but thinly (single source, shallow treatment, outdated)
- scope_gap: a dimension of the question entirely unaddressed

Rules:
- Cite [Source N] when a gap is identified by contrast (e.g., "[Source 3] covers X but no source covers Y").
- Assign severity: critical (cannot answer the question without this), warning (significant weakness), info (minor).
- Confidence 0.0-1.0: how sure you are this is a real gap, given the evidence you can see.
- For each finding, suggest 2-4 search terms the student could use to find a source (these will drive real catalog search).
- Be honest: if you cannot tell whether something is covered, label it "unsupported" with confidence < 0.4.
- Aim for the most important gaps first. Cap at 12 findings.

Output EXACTLY in this format:

---SUMMARY---
[2-3 sentence summary of how well the current source base covers the assessment]
---OVERALL_CONFIDENCE---
[a single number 0.0-1.0 representing overall coverage confidence]
---WARNINGS---
[one integrity warning per line, or "none"]
---FINDINGS---
CATEGORY: [category]
TITLE: [short title, max 80 chars]
SEVERITY: [info|warning|critical]
CONFIDENCE: [0.0-1.0]
LABEL: [source_supported|interpretation|general_context|unsupported]
CONTENT: [detailed description, cite [Source N] where relevant]
RATIONALE: [why this gap matters and why this confidence]
RUBRIC: [rubric criterion name if category is rubric_gap, otherwise leave blank]
SEARCH: [comma-separated search terms]
---
CATEGORY: ...`;

  sections.push(instructions);

  return sections.join("\n\n");
}

function clamp(n: number, min: number, max: number): number {
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function parseGapResponse(
  text: string,
  sourceList: GapContextSource[],
): ParsedResult | null {
  const summaryMatch = text.match(/---SUMMARY---\s*([\s\S]*?)\s*---OVERALL_CONFIDENCE---/);
  const confidenceMatch = text.match(/---OVERALL_CONFIDENCE---\s*([\s\S]*?)\s*---WARNINGS---/);
  const warningsMatch = text.match(/---WARNINGS---\s*([\s\S]*?)\s*---FINDINGS---/);
  const findingsMatch = text.match(/---FINDINGS---\s*([\s\S]*?)$/);

  if (!summaryMatch || !findingsMatch) return null;

  const summary = summaryMatch[1].trim();
  const overallConfidence = clamp(
    parseFloat((confidenceMatch?.[1] ?? "0.3").trim()),
    0,
    1,
  );

  const warningsRaw = warningsMatch?.[1]?.trim() ?? "";
  const warnings =
    warningsRaw.toLowerCase() === "none" || warningsRaw.length === 0
      ? []
      : warningsRaw
          .split("\n")
          .map((w) => w.trim().replace(/^[-*]\s*/, ""))
          .filter((w) => w.length > 0);

  const records = findingsMatch[1]
    .split(/\n---\s*/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0 && r.includes("CATEGORY:"));

  const findings: ParsedFinding[] = [];

  for (const record of records) {
    const getField = (name: string): string => {
      const m = record.match(new RegExp(`${name}:\\s*([^\\n]*(?:\\n(?!([A-Z]+:))[^\\n]*)*)`));
      return m ? m[1].trim() : "";
    };

    const category = getField("CATEGORY").toLowerCase();
    const title = getField("TITLE");
    const content = getField("CONTENT");
    const rationale = getField("RATIONALE");

    if (!title || !content) continue;

    const severity = VALID_SEVERITIES.has(getField("SEVERITY").toLowerCase())
      ? getField("SEVERITY").toLowerCase()
      : "info";
    const label = VALID_LABELS.has(getField("LABEL").toLowerCase())
      ? getField("LABEL").toLowerCase()
      : "unsupported";
    const confidence = clamp(parseFloat(getField("CONFIDENCE")), 0, 1);
    const rubric = getField("RUBRIC");
    const searchRaw = getField("SEARCH");

    const citedChunkIds = extractCitedChunks(content, sourceList);

    const finding: ParsedFinding = {
      gapCategory: VALID_CATEGORIES.has(category) ? category : "scope_gap",
      title,
      content,
      severity,
      confidence,
      rationale: rationale || "No rationale provided.",
      label,
      citedChunkIds,
    };

    if (rubric && rubric.length > 0) {
      finding.relatedRubricCriterion = rubric;
    }

    const searchTerms = searchRaw
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2 && t.length < 120)
      .slice(0, 6);
    if (searchTerms.length > 0) {
      finding.suggestedSearchTerms = searchTerms;
    }

    findings.push(finding);

    if (findings.length >= 12) break;
  }

  if (findings.length === 0) return null;

  return { summary, overallConfidence, warnings, findings };
}

function extractCitedChunks(
  content: string,
  sourceList: GapContextSource[],
): Id<"sourceChunks">[] {
  const cited: Id<"sourceChunks">[] = [];
  const seen = new Set<string>();
  const re = /\[Source\s+(\d+)\]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const idx = parseInt(m[1], 10) - 1;
    if (idx >= 0 && idx < sourceList.length) {
      const source = sourceList[idx];
      const chunkId = source.sampleChunks[0]?.chunkId;
      if (chunkId && !seen.has(chunkId)) {
        seen.add(chunkId);
        cited.push(chunkId);
      }
    }
  }
  return cited.slice(0, 5);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProviderKey(ctx: any, tokenIdentifier: string): Promise<{
  apiKey: string | null;
  model: string;
  provider: ProviderId;
}> {
  const configuredProvider = process.env.AI_PROVIDER;
  const provider: ProviderId = configuredProvider === "gemini" ? "gemini" : "zai";
  const defaultModel =
    process.env.AI_MODEL || PROVIDERS[provider]?.defaultModel || "glm-4-air";

  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (encryptionKey) {
    const encrypted = await ctx.runQuery(
      internal.ai_keys.internalGetEncryptedKey,
      { tokenIdentifier, provider },
    );
    if (encrypted?.encryptedKey) {
      try {
        const apiKey = await decrypt(encrypted.encryptedKey, encryptionKey);
        const model = encrypted.modelPreference || defaultModel;
        return { apiKey, model, provider };
      } catch {
        // fall through to app-level key
      }
    }
  }

  const envMap: Record<ProviderId, string> = {
    zai: "ZAI_API_KEY",
    gemini: "GEMINI_API_KEY",
  };
  const apiKey = process.env[envMap[provider]] || null;
  return { apiKey, model: defaultModel, provider };
}

async function callAI(
  apiKey: string,
  provider: ProviderId,
  model: string,
  userPrompt: string,
): Promise<string | null> {
  const messages: ChatMessage[] = [
    { role: "system", content: GAP_ANALYSIS_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  try {
    let response;
    if (provider === "zai") {
      response = await callZaiProvider(apiKey, messages, { model });
    } else {
      response = await callGeminiProvider(apiKey, messages, { model });
    }
    return response.content;
  } catch {
    return null;
  }
}

interface GapAnalysisActionResult {
  runId: Id<"gapAnalysisRuns">;
  success: boolean;
  reason: string | null;
  findingCount?: number;
}

export const runGapAnalysis = action({
  args: {
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args): Promise<GapAnalysisActionResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const context = (await ctx.runQuery(api.gapAnalysis.getGapAnalysisContext, {
      assignmentId: args.assignmentId,
    })) as GapContext | null;

    if (!context) throw new Error("Assignment not found or not accessible");

    const warnings: string[] = [];
    if (!context.assignment.question && context.assessmentSpecs.length === 0) {
      warnings.push("No assignment question or extracted spec found — gap analysis quality will be limited.");
    }
    if (context.sources.length === 0) {
      warnings.push("No sources selected for this assignment — most findings will be marked unsupported.");
    }

    const { apiKey, model, provider } = await resolveProviderKey(
      ctx,
      identity.tokenIdentifier,
    );

    if (!apiKey) {
      const runId: Id<"gapAnalysisRuns"> = await ctx.runMutation(api.gapAnalysis.createRunWithFindings, {
        assignmentId: args.assignmentId,
        status: "partial",
        summary:
          "Gap analysis could not run because no AI provider is configured. Add an API key in Settings.",
        warnings: ["no_ai_provider_configured"],
        sourceCount: context.sourceCount,
        chunkCount: context.chunkCount,
        findings: [
          {
            gapCategory: "scope_gap",
            title: "AI provider not configured",
            content:
              "Gap analysis requires an AI provider. Connect an API key in Settings, then re-run. [General context] Without analysis, manually compare your sources against the assessment question and rubric.",
            severity: "critical",
            confidence: 1,
            rationale: "Provider resolution returned no usable key.",
            label: "general_context",
            suggestedSearchTerms: [],
          },
        ],
      });
      return { runId, success: false, reason: "no_provider" as const };
    }

    const rateLimit = await ctx.runMutation(api.rateLimits.checkRateLimit, {
      provider,
      estimatedTokens: 4000,
    });
    if (!rateLimit.allowed) {
      await ctx.runMutation(api.observability.recordError, {
        source: "gapAnalysis",
        provider,
        model,
        errorType: "rate_limited",
        errorMessage: `Rate limit: ${rateLimit.reason}`,
      });
      const runId: Id<"gapAnalysisRuns"> = await ctx.runMutation(api.gapAnalysis.createFailedRun, {
        assignmentId: args.assignmentId,
        errorMessage: "Rate limit exceeded. Please wait and try again.",
        providerUsed: provider,
        modelUsed: model,
      });
      return { runId, success: false, reason: "rate_limited" as const };
    }

    const prompt = buildGapPrompt(context);
    const responseText = await callAI(apiKey, provider, model, prompt);

    if (!responseText) {
      await ctx.runMutation(api.observability.recordError, {
        source: "gapAnalysis",
        provider,
        model,
        errorType: "provider_error",
        errorMessage: "AI provider returned no content for gap analysis.",
      });
      const runId: Id<"gapAnalysisRuns"> = await ctx.runMutation(api.gapAnalysis.createFailedRun, {
        assignmentId: args.assignmentId,
        errorMessage: "AI provider returned no content.",
        providerUsed: provider,
        modelUsed: model,
      });
      return { runId, success: false, reason: "provider_error" as const };
    }

    const parsed = parseGapResponse(responseText, context.sources);

    await ctx.runMutation(internal.ai_keys.internalLogUsage, {
      tokenIdentifier: identity.tokenIdentifier,
      provider,
      model,
      type: "gap_analysis",
      tokensIn: Math.ceil(prompt.length / 4),
      tokensOut: Math.ceil(responseText.length / 4),
    });

    if (!parsed) {
      await ctx.runMutation(api.observability.recordError, {
        source: "gapAnalysis",
        provider,
        model,
        errorType: "parse_error",
        errorMessage: "Could not parse structured gap analysis output.",
      });
      const runId: Id<"gapAnalysisRuns"> = await ctx.runMutation(api.gapAnalysis.createRunWithFindings, {
        assignmentId: args.assignmentId,
        status: "partial",
        summary:
          "Gap analysis ran but the AI output could not be parsed into structured findings. Re-run to retry.",
        overallConfidence: 0.2,
        providerUsed: provider,
        modelUsed: model,
        warnings: ["parse_failed"],
        sourceCount: context.sourceCount,
        chunkCount: context.chunkCount,
        findings: [
          {
            gapCategory: "scope_gap",
            title: "Analysis output unparseable",
            content:
              "The AI produced a response but it did not match the expected structured format. This is a transient error — re-run the analysis.",
            severity: "warning",
            confidence: 0.5,
            rationale: "Parser returned null; raw output retained for debugging.",
            label: "general_context",
            suggestedSearchTerms: [],
          },
        ],
      });
      return { runId, success: false, reason: "parse_error" as const };
    }

    const runId: Id<"gapAnalysisRuns"> = await ctx.runMutation(api.gapAnalysis.createRunWithFindings, {
      assignmentId: args.assignmentId,
      status: "completed",
      summary: parsed.summary,
      overallConfidence: parsed.overallConfidence,
      providerUsed: provider,
      modelUsed: model,
      warnings: [...warnings, ...parsed.warnings],
      sourceCount: context.sourceCount,
      chunkCount: context.chunkCount,
      findings: parsed.findings.map((f) => ({
        gapCategory: f.gapCategory,
        title: f.title,
        content: f.content,
        severity: f.severity,
        confidence: f.confidence,
        rationale: f.rationale,
        label: f.label,
        citedChunkIds: f.citedChunkIds,
        relatedRubricCriterion: f.relatedRubricCriterion,
        suggestedSearchTerms: f.suggestedSearchTerms,
      })),
    });

    return {
      runId,
      success: true,
      reason: null as string | null,
      findingCount: parsed.findings.length,
    };
  },
});
