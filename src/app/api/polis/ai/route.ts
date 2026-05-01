import { auth } from "@/lib/auth";
import { convexServer, api } from "@/lib/convex-server";
import { chat, isAIConfiguredForUser } from "@/lib/ai/providers";
import { NextRequest, NextResponse } from "next/server";

function parseJSON(text: string): Record<string, unknown> | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  if (!(await isAIConfiguredForUser(userId))) {
    return NextResponse.json(
      { error: "AI provider not configured. Add an OpenAI API key in Settings or set OPENAI_API_KEY in .env" },
      { status: 400 },
    );
  }

  const body = await req.json() as Record<string, any>;
  const { action } = body;

  try {
    switch (action) {
      case "generateModuleProfile": {
        const { moduleId } = body;
        if (!moduleId) return NextResponse.json({ error: "moduleId required" }, { status: 400 });

        const sources = await convexServer.query(api.sources.getByModuleId, { userId, moduleId });
        if (sources.length === 0) {
          return NextResponse.json({ error: "No sources uploaded. Upload module material first." }, { status: 400 });
        }

        const prioritized = sources.sort((a: any, b: any) => {
          const priorityTypes = ["module_handbook", "essay_brief", "marking_rubric", "assessment", "lecture", "lecture_slides"];
          const aIdx = priorityTypes.indexOf(a.type) !== -1 ? priorityTypes.indexOf(a.type) : 99;
          const bIdx = priorityTypes.indexOf(b.type) !== -1 ? priorityTypes.indexOf(b.type) : 99;
          return aIdx - bIdx;
        });

        const sourceContext = prioritized.slice(0, 15).map((s: any) => {
          const text = (s.extractedText || s.summary || "").slice(0, 2000);
          return `--- SOURCE: "${s.title}" (type: ${s.type}, author: ${s.author || "Unknown"}) ---\n${text}`;
        }).join("\n\n");

        if (!sourceContext.trim()) {
          return NextResponse.json({ error: "Sources exist but no extractable text found. Try re-uploading or wait for processing." }, { status: 400 });
        }

        const response = await chat([
          {
            role: "system",
            content: `You are a Politics and International Relations academic assistant. Analyse module material and produce a structured module profile.

ACADEMIC INTEGRITY:
- Only use information present in the provided source material
- If something is unknown or not mentioned, use null
- Do not fabricate module details, reading lists, or assessment information
- Distinguish facts from sources from inferred patterns

Respond in this exact JSON format:
{
  "summary": "2-3 sentence module overview",
  "keyThemes": ["theme1", "theme2", "theme3"],
  "keyConcepts": ["concept1", "concept2", "concept3"],
  "keyTheories": ["theory1", "theory2"],
  "keyCases": ["case1", "case2"],
  "assessmentSummary": "Summary of assessment types and expectations",
  "importantReadings": ["reading1", "reading2"],
  "academicExpectations": "What kind of argumentation, analysis, and evidence this module seems to reward"
}`,
          },
          {
            role: "user",
            content: `Analyse these module sources and generate a module profile:\n\n${sourceContext}`,
          },
        ], { temperature: 0.2, maxTokens: 2048, userId });

        const profile = parseJSON(response.content);
        if (!profile) {
          return NextResponse.json({ error: "AI returned invalid structure. Try again." }, { status: 500 });
        }

        await convexServer.mutation(api.moduleProfiles.upsert, {
          userId,
          moduleId,
          summary: (profile.summary as string) || "",
          keyThemes: Array.isArray(profile.keyThemes) ? (profile.keyThemes as string[]) : [],
          keyConcepts: Array.isArray(profile.keyConcepts) ? (profile.keyConcepts as string[]) : [],
          keyTheories: Array.isArray(profile.keyTheories) ? (profile.keyTheories as string[]) : [],
          keyCases: Array.isArray(profile.keyCases) ? (profile.keyCases as string[]) : [],
          assessmentSummary: (profile.assessmentSummary as string) || "",
          importantReadings: Array.isArray(profile.importantReadings) ? (profile.importantReadings as string[]) : [],
          academicExpectations: (profile.academicExpectations as string) || "",
        });

        return NextResponse.json({ success: true, profile });
      }

      case "detectAssignments": {
        const { moduleId } = body;
        if (!moduleId) return NextResponse.json({ error: "moduleId required" }, { status: 400 });

        const sources = await convexServer.query(api.sources.getByModuleId, { userId, moduleId });
        if (sources.length === 0) {
          return NextResponse.json({ error: "No sources uploaded. Upload module material first." }, { status: 400 });
        }

        const assessmentSources = sources.filter((s: any) =>
          ["module_handbook", "essay_brief", "marking_rubric", "assessment"].includes(s.type) ||
          (s.type === "reading" && (s.extractedText || "").length > 500),
        );

        const contextSources = assessmentSources.length > 0 ? assessmentSources : sources;
        const sourceContext = contextSources.slice(0, 10).map((s: any) => {
          const text = (s.extractedText || s.summary || "").slice(0, 3000);
          return `--- SOURCE: "${s.title}" (type: ${s.type}) ---\n${text}`;
        }).join("\n\n");

        if (!sourceContext.trim()) {
          return NextResponse.json({ error: "Sources exist but no extractable text found." }, { status: 400 });
        }

        const existingAssignments = await convexServer.query(api.assignments.listByModule, { userId, moduleId });
        const existingTitles = existingAssignments.map((a: any) => a.title.toLowerCase().trim());

        const response = await chat([
          {
            role: "system",
            content: `You are an academic assistant that detects assignments from module material. Look for assessment briefs, essay questions, exam details, presentation requirements, etc.

ACADEMIC INTEGRITY:
- Only identify assignments clearly described in the source material
- Do not invent or infer assignments that are not explicitly mentioned
- If details are unclear, use null
- If no assignments are found, return an empty array

Respond in this exact JSON format:
{
  "assignments": [
    {
      "title": "Assignment title",
      "type": "essay|research_project|literature_review|briefing|exam|quiz|presentation|other",
      "questionOrBrief": "The full question or brief text",
      "weighting": "e.g. 50%",
      "dueDate": "ISO date string or null",
      "wordCount": 3000,
      "markingCriteriaSummary": "Summary of marking criteria or null",
      "confidence": "high|medium|low"
    }
  ]
}`,
          },
          {
            role: "user",
            content: `Detect all assignments from these module sources:\n\n${sourceContext}`,
          },
        ], { temperature: 0.2, maxTokens: 2048, userId });

        const result = parseJSON(response.content);
        if (!result || !Array.isArray(result.assignments)) {
          return NextResponse.json({ error: "AI returned invalid structure. Try again." }, { status: 500 });
        }

        const sourceIds = contextSources.slice(0, 10).map((s: any) => s.id);
        let created = 0;
        let skipped = 0;

        for (const assignment of result.assignments as any[]) {
          const normalizedTitle = (assignment.title || "").toLowerCase().trim();
          if (!normalizedTitle) continue;

          const isDuplicate = existingTitles.some(
            (existing: string) => existing === normalizedTitle || existing.includes(normalizedTitle) || normalizedTitle.includes(existing),
          );
          if (isDuplicate) {
            skipped++;
            continue;
          }

          await convexServer.mutation(api.assignments.create, {
            userId,
            moduleId,
            title: assignment.title,
            type: assignment.type || "other",
            questionOrBrief: assignment.questionOrBrief || "",
            weighting: assignment.weighting || "",
            dueDate: assignment.dueDate || "",
            wordCount: assignment.wordCount || 0,
            status: "detected",
            markingCriteriaSummary: assignment.markingCriteriaSummary || "",
            detectedFromSourceIds: sourceIds,
          });
          existingTitles.push(normalizedTitle);
          created++;
        }

        return NextResponse.json({ success: true, created, skipped });
      }

      case "generateSourceBrief": {
        const { sourceId } = body;
        if (!sourceId) return NextResponse.json({ error: "sourceId required" }, { status: 400 });

        const source = await convexServer.query(api.sources.getById, { userId, sourceId });
        if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });
        if (!source.extractedText) {
          return NextResponse.json({ error: "No extracted text available for this source" }, { status: 400 });
        }

        const mod = await convexServer.query(api.modules.getById, { userId, moduleId: source.moduleId });
        const moduleName = mod?.title || "";
        const assessmentQuestion = mod?.assessmentQuestion || "";

        const textToBrief = source.extractedText.slice(0, 15000);

        const response = await chat([
          {
            role: "system",
            content: `You are a Politics and International Relations academic assistant. Generate a structured source brief from the provided text.

ACADEMIC INTEGRITY:
- Only use information present in the source text
- Do not fabricate quotes — only include short passages that appear verbatim in the text
- If you cannot safely extract quotes, omit the quotes field
- Do not add information not present in the source
- This brief helps a student understand the source, not replace reading it

Respond in this exact JSON format:
{
  "summary": "2-3 sentence summary",
  "keyArgument": "The central argument in 1-2 sentences",
  "keyConcepts": ["concept1", "concept2"],
  "keyTheories": ["theory1"],
  "keyCases": ["case1"],
  "keyEvidence": "Key evidence or findings, 1-2 sentences",
  "usefulQuotes": ["Short verbatim passage from text (max 50 words each)"] or [],
  "relevanceToModule": "How this source might relate to a Politics/IR module assessment",
  "limitations": "Limitations, assumptions, or critiques of this source",
  "possibleUseInEssay": "How this source might be used in an essay — e.g. as evidence, counterpoint, theoretical framing"
}`,
          },
          {
            role: "user",
            content: `Generate a source brief for "${source.title}" by ${source.author || "Unknown"}${moduleName ? ` for module "${moduleName}"` : ""}${assessmentQuestion ? ` (assessment question: "${assessmentQuestion}")` : ""}:\n\n${textToBrief}`,
          },
        ], { temperature: 0.2, maxTokens: 2048, userId });

        const brief = parseJSON(response.content);
        if (!brief) {
          return NextResponse.json({ error: "AI returned invalid structure. Try again." }, { status: 500 });
        }

        const briefContent = [
          `# Source Brief: ${source.title}`,
          "",
          `## Summary`,
          (brief.summary as string) || "No summary generated.",
          "",
          `## Key Argument`,
          (brief.keyArgument as string) || "No key argument identified.",
          "",
          `## Key Concepts`,
          Array.isArray(brief.keyConcepts) ? (brief.keyConcepts as string[]).map((c) => `- ${c}`).join("\n") : "None identified.",
          "",
          `## Key Theories`,
          Array.isArray(brief.keyTheories) && (brief.keyTheories as string[]).length > 0
            ? (brief.keyTheories as string[]).map((t) => `- ${t}`).join("\n")
            : "None identified.",
          "",
          `## Key Cases`,
          Array.isArray(brief.keyCases) && (brief.keyCases as string[]).length > 0
            ? (brief.keyCases as string[]).map((c) => `- ${c}`).join("\n")
            : "None identified.",
          "",
          `## Key Evidence`,
          (brief.keyEvidence as string) || "None identified.",
          "",
          Array.isArray(brief.usefulQuotes) && (brief.usefulQuotes as string[]).length > 0
            ? `## Useful Passages\n${(brief.usefulQuotes as string[]).map((q) => `> ${q}`).join("\n\n")}`
            : "## Useful Passages\nNo verbatim passages extracted safely.",
          "",
          `## Relevance to Module`,
          (brief.relevanceToModule as string) || "Not assessed.",
          "",
          `## Limitations`,
          (brief.limitations as string) || "None noted.",
          "",
          `## Possible Use in Essay`,
          (brief.possibleUseInEssay as string) || "Not assessed.",
        ].join("\n");

        const existingPages = await convexServer.query(api.knowledgePages.listByModule, { userId, moduleId: source.moduleId });
        const existingBrief = existingPages.find((p: any) => p.type === "source_brief" && p.linkedSourceIds.includes(sourceId));

        if (existingBrief) {
          await convexServer.mutation(api.knowledgePages.update, {
            userId,
            pageId: existingBrief.id,
            content: briefContent,
            tags: Array.isArray(brief.keyConcepts) ? brief.keyConcepts : [],
          });
        } else {
          await convexServer.mutation(api.knowledgePages.create, {
            userId,
            moduleId: source.moduleId,
            title: `Source brief: ${source.title}`,
            type: "source_brief",
            content: briefContent,
            linkedSourceIds: [sourceId],
            linkedPageIds: [],
            tags: Array.isArray(brief.keyConcepts) ? brief.keyConcepts : [],
          });
        }

        return NextResponse.json({ success: true, brief });
      }

      case "suggestAssignmentSourceRelevance": {
        const { assignmentId, moduleId } = body;
        if (!assignmentId || !moduleId) return NextResponse.json({ error: "assignmentId and moduleId required" }, { status: 400 });

        const assignment = await convexServer.query(api.assignments.getById, { userId, assignmentId });
        if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

        const sources = await convexServer.query(api.sources.getByModuleId, { userId, moduleId });
        if (sources.length === 0) {
          return NextResponse.json({ error: "No sources in this module." }, { status: 400 });
        }

        const sourcesWithText = sources.filter((s: any) => s.extractedText || s.summary);
        if (sourcesWithText.length === 0) {
          return NextResponse.json({ error: "Sources exist but no extractable text." }, { status: 400 });
        }

        const sourceSummaries = sourcesWithText.slice(0, 20).map((s: any) => ({
          id: s.id,
          title: s.title,
          type: s.type,
          author: s.author || "Unknown",
          summary: (s.summary || (s.extractedText || "").slice(0, 300)).slice(0, 400),
        }));

        const response = await chat([
          {
            role: "system",
            content: `You are a Politics and International Relations academic assistant. Given an assignment and a list of module sources, suggest how each source relates to the assignment.

ACADEMIC INTEGRITY:
- Only assess relevance based on source summaries provided
- Do not fabricate evidence or quotes
- Be honest when a source is not clearly relevant
- Keep notes concise and practical

For each source, respond in this JSON format:
{
  "suggestions": [
    {
      "sourceId": "the source id",
      "relevanceType": "core|supporting|opposing|theoretical|empirical_case|methodological|background|not_relevant",
      "relevanceNote": "1-2 sentence note on how this source relates",
      "usefulEvidence": "What evidence from this source might help or null"
    }
  ]
}`,
          },
          {
            role: "user",
            content: [
              `ASSIGNMENT: "${assignment.title}" (${assignment.type})`,
              assignment.questionOrBrief ? `Question/Brief: ${assignment.questionOrBrief}` : "",
              assignment.markingCriteriaSummary ? `Marking criteria: ${assignment.markingCriteriaSummary}` : "",
              "",
              "SOURCES:",
              ...sourceSummaries.map((s) => `[${s.id}] "${s.title}" by ${s.author} (${s.type}): ${s.summary}`),
            ].filter(Boolean).join("\n"),
          },
        ], { temperature: 0.2, maxTokens: 2048, userId });

        const result = parseJSON(response.content);
        if (!result || !Array.isArray(result.suggestions)) {
          return NextResponse.json({ error: "AI returned invalid structure. Try again." }, { status: 500 });
        }

        let created = 0;
        for (const suggestion of result.suggestions as any[]) {
          if (!suggestion.sourceId) continue;
          await convexServer.mutation(api.assignmentSourceRelevance.upsert, {
            userId,
            assignmentId,
            moduleId,
            sourceId: suggestion.sourceId,
            relevanceType: suggestion.relevanceType || "background",
            relevanceNote: suggestion.relevanceNote || "",
            usefulEvidence: suggestion.usefulEvidence || "",
          });
          created++;
        }

        return NextResponse.json({ success: true, created });
      }

      case "recommendExternalSources": {
        const { moduleId, assignmentId, focus, maxResults } = body;
        if (!moduleId) return NextResponse.json({ error: "moduleId required" }, { status: 400 });

        const max = Math.min(maxResults || 8, 12);

        const profile = await convexServer.query(api.moduleProfiles.getByModule, { userId, moduleId });
        const sources = await convexServer.query(api.sources.getByModuleId, { userId, moduleId });
        const mod = await convexServer.query(api.modules.getById, { userId, moduleId });

        if (!profile && sources.length === 0) {
          return NextResponse.json({ error: "No module profile or sources available. Upload sources and generate a profile first." }, { status: 400 });
        }

        let assignment: any = null;
        let relevanceRecords: any[] = [];
        let contextPack: any = null;

        if (assignmentId) {
          assignment = await convexServer.query(api.assignments.getById, { userId, assignmentId });
          if (assignment) {
            relevanceRecords = await convexServer.query(api.assignmentSourceRelevance.listByAssignment, { userId, assignmentId });
          }
        }

        const contextPacks = await convexServer.query(api.contextPacks.listByModule, { userId, moduleId });
        if (assignmentId) {
          contextPack = contextPacks.find((cp: any) => cp.assignmentId === assignmentId) || null;
        }
        if (!contextPack && contextPacks.length > 0) {
          contextPack = contextPacks[0];
        }

        const contextParts: string[] = [];
        if (mod) {
          contextParts.push(`MODULE: "${mod.title}" (${mod.code})`);
          if (mod.description) contextParts.push(`Description: ${mod.description}`);
          if (mod.assessmentQuestion) contextParts.push(`Assessment question: ${mod.assessmentQuestion}`);
        }

        if (profile) {
          contextParts.push(`Module summary: ${profile.summary || "Not available"}`);
          if (profile.keyThemes?.length) contextParts.push(`Key themes: ${profile.keyThemes.join(", ")}`);
          if (profile.keyConcepts?.length) contextParts.push(`Key concepts: ${profile.keyConcepts.join(", ")}`);
          if (profile.keyTheories?.length) contextParts.push(`Key theories: ${profile.keyTheories.join(", ")}`);
          if (profile.academicExpectations) contextParts.push(`Academic expectations: ${profile.academicExpectations}`);
        }

        if (assignment) {
          contextParts.push(`\nASSIGNMENT: "${assignment.title}" (${assignment.type})`);
          if (assignment.questionOrBrief) contextParts.push(`Question: ${assignment.questionOrBrief}`);
          if (assignment.markingCriteriaSummary) contextParts.push(`Marking criteria: ${assignment.markingCriteriaSummary}`);
          if (assignment.wordCount > 0) contextParts.push(`Word count: ${assignment.wordCount}`);
        }

        const existingTitles = sources.slice(0, 30).map((s: any) => `"${s.title}" by ${s.author || "Unknown"}`);
        if (existingTitles.length > 0) {
          contextParts.push(`\nEXISTING SOURCES already in the workspace (${existingTitles.length}):`);
          contextParts.push(...existingTitles.slice(0, 20));
        }

        const relevantRecords = relevanceRecords.filter((r: any) => r.relevanceType !== "not_relevant");
        if (relevantRecords.length > 0) {
          const gapTypes = ["opposing", "empirical_case", "theoretical", "methodological"].filter(
            (type) => !relevantRecords.some((r: any) => r.relevanceType === type)
          );
          if (gapTypes.length > 0) {
            contextParts.push(`\nIDENTIFIED GAPS: No ${gapTypes.join(", ")} sources among existing material.`);
          }
        }

        if (contextPack) {
          contextParts.push(`\nCURRENT CONTEXT PACK: "${contextPack.title}"`);
          if (contextPack.missingEvidence?.length) {
            contextParts.push(`Missing evidence: ${contextPack.missingEvidence.join("; ")}`);
          }
        }

        if (focus) {
          contextParts.push(`\nUSER FOCUS: ${focus}`);
        }

        const response = await chat([
          {
            role: "system",
            content: `You are a Politics and International Relations academic research assistant. Your job is to recommend real external sources that would strengthen a student's essay or coursework.

ACADEMIC INTEGRITY RULES:
- Only recommend sources that genuinely exist or are very likely to exist in the academic literature
- If you are uncertain whether a source exists, set "uncertain" to true
- NEVER fabricate DOIs, ISBNs, or specific page numbers
- NEVER invent author names or publication details
- If recommending a journal article, prefer well-known Politics/IR journals
- If recommending a book, prefer established academic publishers
- Each recommendation must explain WHY it is useful for THIS specific module/assignment
- Distinguish clearly between what you know and what you are estimating

SOURCE PRIORITIES for Politics and IR:
- Peer-reviewed journal articles (especially from top journals)
- Academic books and book chapters
- Policy reports from reputable institutions
- Official government or international organisation publications
- Datasets where methodologically relevant

Respond in this exact JSON format:
{
  "recommendations": [
    {
      "title": "Full title of the source",
      "authors": "Author names if known",
      "year": 2023,
      "sourceType": "book|journal_article|report|dataset|lecture_resource|website|other",
      "recommendedUse": "core|supporting|opposing|theoretical|empirical_case|methodological|background",
      "whyUseful": "2-3 sentences explaining why this source is useful for this specific assignment/module",
      "howItStrengthens": "1-2 sentences on how this could strengthen the essay",
      "searchQuery": "A practical search query the student could use to find this source",
      "possibleCitation": "Best guess at a citation, may be approximate",
      "publisherOrJournal": "Publisher or journal name if known",
      "url": "URL if known, or null",
      "confidence": "high|medium|low",
      "uncertain": true/false
    }
  ],
  "warning": "Any important caveat about the recommendations, or null"
}

Provide ${max} recommendations. Prefer quality over quantity. Focus on sources most likely to be accessible through university libraries.`,
          },
          {
            role: "user",
            content: contextParts.join("\n"),
          },
        ], { temperature: 0.3, maxTokens: 4096, userId });

        const result = parseJSON(response.content);
        if (!result || !Array.isArray(result.recommendations)) {
          return NextResponse.json({ error: "AI returned invalid structure. Try again." }, { status: 500 });
        }

        const recommendations = (result.recommendations as any[])
          .filter((r) => r.title?.trim())
          .slice(0, max)
          .map((r) => ({
            userId,
            moduleId,
            assignmentId: assignmentId || undefined,
            title: r.title.trim(),
            authors: r.authors || "",
            year: r.year || null,
            sourceType: r.sourceType || "other",
            whyUseful: [r.whyUseful, r.howItStrengthens].filter(Boolean).join(" "),
            recommendedUse: r.recommendedUse || "background",
            searchQuery: r.searchQuery || "",
            possibleCitation: r.uncertain ? `[Approximate] ${r.possibleCitation || ""}` : (r.possibleCitation || ""),
            url: r.url || "",
            publisherOrJournal: r.publisherOrJournal || "",
            confidence: r.confidence || "medium",
          }));

        if (recommendations.length === 0) {
          return NextResponse.json({ error: "No useful recommendations found. Try adjusting your focus or adding more module context." }, { status: 400 });
        }

        const ids = await convexServer.mutation(api.externalSourceRecommendations.bulkCreate, {
          recommendations,
        });

        return NextResponse.json({
          success: true,
          created: ids.length,
          warning: result.warning || null,
        });
      }

      default:
        return NextResponse.json({ error: "Unknown AI action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
