import { auth } from "@/lib/auth";
import { convexServer, api } from "@/lib/convex-server";
import { NextRequest, NextResponse } from "next/server";

function omitKeys(source: Record<string, any>, keys: string[]) {
  const copy = { ...source };
  for (const key of keys) delete copy[key];
  return copy;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json() as Record<string, any>;
  const { action } = body;

    try {
    switch (action) {
      case "createWorkspace": {
        const { title, code, description, academicYear, semester, colour } = body;
        if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
        const moduleId = await convexServer.mutation(api.modules.createWithFolders, {
          userId,
          title: title.trim(),
          code: code?.trim() || title.trim().slice(0, 6).toUpperCase().replace(/\s+/g, ""),
          description: description || "",
          academicYear: academicYear || "",
          semester: semester || "",
          colour: colour || undefined,
        } as any);
        const mod = await convexServer.query(api.modules.getById, { userId, moduleId });
        return NextResponse.json(mod, { status: 201 });
      }
      case "updateModule": {
        const { moduleId } = body;
        const data = omitKeys(body, ["action", "moduleId"]);
        const result = await convexServer.mutation(api.modules.update, { userId, moduleId, ...data } as any);
        return NextResponse.json(result);
      }
      case "updateSource": {
        const { sourceId } = body;
        const data = omitKeys(body, ["action", "sourceId"]);
        const result = await convexServer.mutation(api.sources.update, { userId, sourceId, ...data } as any);
        return NextResponse.json(result);
      }
      case "createSourceBrief": {
        const result = await convexServer.mutation(api.knowledgePages.createSourceBrief, {
          userId,
          sourceId: body.sourceId,
        });
        return NextResponse.json(result, { status: 201 });
      }
      case "createKnowledgePage": {
        const data = omitKeys(body, ["action"]);
        const result = await convexServer.mutation(api.knowledgePages.create, { userId, ...data } as any);
        return NextResponse.json(result, { status: 201 });
      }
      case "updateKnowledgePage": {
        const { pageId } = body;
        const data = omitKeys(body, ["action", "pageId", "moduleId"]);
        const result = await convexServer.mutation(api.knowledgePages.update, { userId, pageId, ...data } as any);
        return NextResponse.json(result);
      }
      case "deleteKnowledgePage": {
        await convexServer.mutation(api.knowledgePages.remove, { userId, pageId: body.pageId });
        return NextResponse.json({ success: true });
      }
      case "createContextPack": {
        const data = omitKeys(body, ["action"]);
        const result = await convexServer.mutation(api.contextPacks.create, { userId, ...data } as any);
        return NextResponse.json(result, { status: 201 });
      }
      case "updateContextPack": {
        const { contextPackId } = body;
        const data = omitKeys(body, ["action", "contextPackId", "moduleId"]);
        const result = await convexServer.mutation(api.contextPacks.update, { userId, contextPackId, ...data } as any);
        return NextResponse.json(result);
      }
      case "createPlan": {
        const data = omitKeys(body, ["action"]);
        const result = await convexServer.mutation(api.plans.create, { userId, ...data } as any);
        return NextResponse.json(result, { status: 201 });
      }
      case "updatePlan": {
        const { planId } = body;
        const data = omitKeys(body, ["action", "planId", "moduleId", "contextPackId"]);
        const result = await convexServer.mutation(api.plans.update, { userId, planId, ...data } as any);
        return NextResponse.json(result);
      }
      case "createDraft": {
        const data = omitKeys(body, ["action"]);
        const result = await convexServer.mutation(api.drafts.create, { userId, ...data } as any);
        return NextResponse.json(result, { status: 201 });
      }
      case "updateDraft": {
        const { draftId } = body;
        const data = omitKeys(body, ["action", "draftId", "moduleId", "contextPackId", "planId"]);
        const result = await convexServer.mutation(api.drafts.update, { userId, draftId, ...data } as any);
        return NextResponse.json(result);
      }
      case "createFeedback": {
        const data = omitKeys(body, ["action"]);
        const result = await convexServer.mutation(api.feedback.create, { userId, ...data } as any);
        return NextResponse.json(result, { status: 201 });
      }
      case "updateFeedback": {
        const { feedbackId } = body;
        const data = omitKeys(body, ["action", "feedbackId", "moduleId", "draftId"]);
        const result = await convexServer.mutation(api.feedback.update, { userId, feedbackId, ...data } as any);
        return NextResponse.json(result);
      }
      case "createAssignment": {
        const data = omitKeys(body, ["action"]);
        const result = await convexServer.mutation(api.assignments.create, { userId, ...data } as any);
        return NextResponse.json(result, { status: 201 });
      }
      case "updateAssignment": {
        const { assignmentId } = body;
        const data = omitKeys(body, ["action", "assignmentId", "moduleId"]);
        const result = await convexServer.mutation(api.assignments.update, { userId, assignmentId, ...data } as any);
        return NextResponse.json(result);
      }
      case "approveAssignment": {
        const result = await convexServer.mutation(api.assignments.approve, { userId, assignmentId: body.assignmentId });
        return NextResponse.json(result);
      }
      case "dismissAssignment": {
        const result = await convexServer.mutation(api.assignments.dismiss, { userId, assignmentId: body.assignmentId });
        return NextResponse.json(result);
      }
      case "archiveAssignment": {
        const result = await convexServer.mutation(api.assignments.archive, { userId, assignmentId: body.assignmentId });
        return NextResponse.json(result);
      }
      case "upsertModuleProfile": {
        const data = omitKeys(body, ["action"]);
        const result = await convexServer.mutation(api.moduleProfiles.upsert, { userId, ...data } as any);
        return NextResponse.json(result);
      }
      case "upsertAssignmentSourceRelevance": {
        const data = omitKeys(body, ["action"]);
        const result = await convexServer.mutation(api.assignmentSourceRelevance.upsert, { userId, ...data } as any);
        return NextResponse.json(result);
      }
      case "removeAssignmentSourceRelevance": {
        await convexServer.mutation(api.assignmentSourceRelevance.remove, { userId, relevanceId: body.relevanceId });
        return NextResponse.json({ success: true });
      }
      case "listAssignmentSourceRelevance": {
        const result = await convexServer.query(api.assignmentSourceRelevance.listByAssignment, { userId, assignmentId: body.assignmentId });
        return NextResponse.json(result);
      }
      case "createContextPackFromAssignmentRelevance": {
        const { assignmentId, moduleId } = body;
        if (!assignmentId || !moduleId) return NextResponse.json({ error: "assignmentId and moduleId required" }, { status: 400 });

        const assignment = await convexServer.query(api.assignments.getById, { userId, assignmentId });
        if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

        const relevanceRecords = await convexServer.query(api.assignmentSourceRelevance.listByAssignment, { userId, assignmentId });
        const relevant = relevanceRecords.filter((r: any) => r.relevanceType !== "not_relevant");

        if (relevant.length === 0) {
          return NextResponse.json({ error: "No relevant sources found. Suggest relevance first." }, { status: 400 });
        }

        const coreSources = relevant.filter((r: any) => r.relevanceType === "core");
        const supportingSources = relevant.filter((r: any) => r.relevanceType === "supporting");
        const opposingSources = relevant.filter((r: any) => r.relevanceType === "opposing");
        const theoreticalSources = relevant.filter((r: any) => r.relevanceType === "theoretical");
        const empiricalSources = relevant.filter((r: any) => r.relevanceType === "empirical_case");
        const methodologicalSources = relevant.filter((r: any) => r.relevanceType === "methodological");
        const backgroundSources = relevant.filter((r: any) => r.relevanceType === "background");

        const selectedSourceIds = relevant.map((r: any) => r.sourceId);

        const sections: string[] = [];

        sections.push(`# Context Pack: ${assignment.title}`);
        sections.push("");

        if (assignment.questionOrBrief) {
          sections.push("## Assignment Brief");
          sections.push(assignment.questionOrBrief);
          sections.push("");
        }

        if (assignment.markingCriteriaSummary) {
          sections.push("## Marking Criteria");
          sections.push(assignment.markingCriteriaSummary);
          sections.push("");
        }

        if (assignment.wordCount > 0) {
          sections.push(`Word count: ${assignment.wordCount.toLocaleString()}`);
          sections.push("");
        }

        sections.push("## Relevant Source Map");
        sections.push(`${relevant.length} relevant sources identified (out of ${relevanceRecords.length} total).`);
        sections.push("");

        const formatSourceGroup = (label: string, sources: any[]) => {
          if (sources.length === 0) return;
          sections.push(`### ${label} (${sources.length})`);
          for (const s of sources) {
            sections.push(`- ${s.sourceId}: ${s.relevanceNote || "No note"}`);
            if (s.usefulEvidence) sections.push(`  Evidence: ${s.usefulEvidence}`);
            if (s.usefulQuotes) sections.push(`  Quote: ${s.usefulQuotes}`);
          }
          sections.push("");
        };

        sections.push("## Core Sources");
        formatSourceGroup("Core", coreSources);

        sections.push("## Supporting Sources");
        formatSourceGroup("Supporting", supportingSources);

        sections.push("## Opposing/Counterargument Sources");
        formatSourceGroup("Opposing", opposingSources);

        sections.push("## Theory, Concepts, Cases");
        formatSourceGroup("Theoretical", theoreticalSources);
        formatSourceGroup("Empirical/Case", empiricalSources);

        formatSourceGroup("Methodological", methodologicalSources);
        formatSourceGroup("Background", backgroundSources);

        sections.push("## Evidence and Useful Passages");
        const withEvidence = relevant.filter((r: any) => r.usefulEvidence || r.usefulQuotes);
        if (withEvidence.length > 0) {
          for (const r of withEvidence) {
            if (r.usefulEvidence) sections.push(`- [${r.relevanceType}] ${r.sourceId}: ${r.usefulEvidence}`);
            if (r.usefulQuotes) sections.push(`  Quote: "${r.usefulQuotes}"`);
          }
        } else {
          sections.push("No specific evidence or passages recorded yet. Source briefs may contain more detail.");
        }
        sections.push("");

        sections.push("## Gaps / Further Research Needed");
        const missingTypes = ["opposing", "empirical_case", "theoretical"].filter(
          (type) => !relevant.some((r: any) => r.relevanceType === type)
        );
        if (missingTypes.length > 0) {
          sections.push(`No ${missingTypes.join(", ")} sources identified. Consider finding sources to fill these gaps.`);
        } else {
          sections.push("All major relevance categories are covered. Review depth within each category.");
        }
        sections.push("");

        sections.push("## Planning Notes");
        sections.push("- Review source briefs in the Knowledge layer for detailed arguments and evidence.");
        sections.push("- Use this context to build a structured plan in the Plan layer.");
        sections.push("- Flag any claims that lack sufficient evidence rather than inventing support.");

        const keyClaims = relevant
          .filter((r: any) => r.relevanceType === "core" && r.relevanceNote)
          .map((r: any) => r.relevanceNote);

        const contextPack = await convexServer.mutation(api.contextPacks.create, {
          userId,
          moduleId,
          assignmentId,
          title: `Context: ${assignment.title}`,
          assessmentQuestion: assignment.questionOrBrief || "",
          selectedSourceIds,
          selectedKnowledgePageIds: [],
          markingCriteria: assignment.markingCriteriaSummary || "",
          workingThesis: "",
          keyClaims,
          keyQuotes: [],
          caseStudies: [],
          missingEvidence: missingTypes.map((t) => `No ${t} sources identified`),
          draftingInstructions: "Ground claims in the selected sources. Flag missing evidence rather than inventing support.",
        });

        return NextResponse.json(contextPack, { status: 201 });
      }

      case "listExternalSourceRecommendations": {
        const { moduleId, assignmentId } = body;
        if (!moduleId) return NextResponse.json({ error: "moduleId required" }, { status: 400 });
        const result = assignmentId
          ? await convexServer.query(api.externalSourceRecommendations.listByAssignment, { userId, assignmentId })
          : await convexServer.query(api.externalSourceRecommendations.listByModule, { userId, moduleId });
        return NextResponse.json(result);
      }

      case "listSavedExternalSourceRecommendations": {
        const { moduleId, assignmentId } = body;
        if (!moduleId) return NextResponse.json({ error: "moduleId required" }, { status: 400 });
        const result = assignmentId
          ? await convexServer.query(api.externalSourceRecommendations.listSavedByAssignment, { userId, assignmentId })
          : await convexServer.query(api.externalSourceRecommendations.listSavedByModule, { userId, moduleId });
        return NextResponse.json(result);
      }

      case "saveExternalSourceRecommendation": {
        const { recommendationId } = body;
        if (!recommendationId) return NextResponse.json({ error: "recommendationId required" }, { status: 400 });
        await convexServer.mutation(api.externalSourceRecommendations.updateStatus, { userId, recommendationId, status: "saved" });
        return NextResponse.json({ success: true });
      }

      case "dismissExternalSourceRecommendation": {
        const { recommendationId } = body;
        if (!recommendationId) return NextResponse.json({ error: "recommendationId required" }, { status: 400 });
        await convexServer.mutation(api.externalSourceRecommendations.updateStatus, { userId, recommendationId, status: "dismissed" });
        return NextResponse.json({ success: true });
      }

      case "markExternalSourceRecommendationImported": {
        const { recommendationId } = body;
        if (!recommendationId) return NextResponse.json({ error: "recommendationId required" }, { status: 400 });
        await convexServer.mutation(api.externalSourceRecommendations.updateStatus, { userId, recommendationId, status: "imported" });
        return NextResponse.json({ success: true });
      }

      case "updateExternalSourceRecommendation": {
        const { recommendationId } = body;
        if (!recommendationId) return NextResponse.json({ error: "recommendationId required" }, { status: 400 });
        const data = omitKeys(body, ["action", "recommendationId"]);
        if (data.status) {
          await convexServer.mutation(api.externalSourceRecommendations.updateStatus, { userId, recommendationId, status: data.status });
        }
        return NextResponse.json({ success: true });
      }

      case "deleteExternalSourceRecommendation": {
        const { recommendationId } = body;
        if (!recommendationId) return NextResponse.json({ error: "recommendationId required" }, { status: 400 });
        await convexServer.mutation(api.externalSourceRecommendations.remove, { userId, recommendationId });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown Polis action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Polis operation failed" },
      { status: 500 },
    );
  }
}
