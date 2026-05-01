"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn, wordCount } from "@/lib/utils";
import { getPolisNextAction } from "@/lib/polis/next-action";
import {
  draftStatusLabel,
  knowledgePageTypes,
  knowledgeTypeLabel,
  normalizeSourceStatus,
  polisSourceTypes,
  relevanceClass,
  relevanceLabel,
  sourceStatusClass,
  sourceStatusLabel,
  sourceTypeLabel,
  stageLabel,
} from "@/lib/polis/status";
import type {
  Assignment,
  AssignmentStatus,
  AssignmentType,
  ContextPack,
  Draft,
  DraftStatus,
  Feedback,
  KnowledgePage,
  KnowledgePageType,
  ModuleProfile,
  Plan,
  PlanSection,
  PolisSection,
  RevisionTask,
  SourceFile,
  SourceRelevance,
  SourceType,
  WorkspaceStage,
} from "@/lib/types";

interface PolisModule {
  id: string;
  title: string;
  code: string;
  description: string;
  colour: string;
  assessmentTitle: string;
  assessmentQuestion: string;
  deadline: string;
  targetGrade: string;
  referencingStyle: string;
  currentStage: WorkspaceStage;
}

interface PolisSource extends SourceFile {
  linkedKnowledgeCount: number;
  rawStatus?: string;
  processingStatus?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  wordCount?: number;
  errorMessage?: string;
}

interface ModuleShellProps {
  module: PolisModule;
  activeSection: PolisSection;
  sources: PolisSource[];
  knowledgePages: KnowledgePage[];
  contextPacks: ContextPack[];
  activeContextPack: ContextPack | null;
  currentPlan: Plan | null;
  currentDraft: Draft | null;
  feedback: Feedback[];
  assignments: Assignment[];
  moduleProfile: ModuleProfile | null;
  activeAssignmentId: string | null;
}

const sections: Array<{ id: PolisSection; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "sources", label: "Sources" },
  { id: "knowledge", label: "Knowledge" },
  { id: "context", label: "Context" },
  { id: "plan", label: "Plan" },
  { id: "draft", label: "Draft" },
  { id: "final", label: "Final" },
];

async function postPolis(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/polis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function postAI(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/polis/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "AI request failed");
  return data;
}

function linesToArray(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function arrayToLines(value: string[]) {
  return value.join("\n");
}

function safeDate(date: string) {
  if (!date) return "No deadline set";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ModuleShell({
  module,
  activeSection,
  sources,
  knowledgePages,
  contextPacks,
  activeContextPack,
  currentPlan,
  currentDraft,
  feedback,
  assignments,
  moduleProfile,
  activeAssignmentId,
}: ModuleShellProps) {
  const nextAction = getPolisNextAction({ sources, knowledgePages, contextPack: activeContextPack, plan: currentPlan, draft: currentDraft });
  const activeAssignment = activeAssignmentId ? assignments.find((a) => a.id === activeAssignmentId) || null : null;

  return (
    <div className="-m-4 sm:-m-6">
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-border bg-card lg:w-60 lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: module.colour }}>
                {module.code.slice(0, 3)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">{module.title}</p>
                <p className="text-xs text-muted-foreground">{module.code}</p>
              </div>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1">
            {sections.map((section) => (
              <Link
                key={section.id}
                href={`/modules/${module.id}?section=${section.id}${activeAssignmentId ? `&assignmentId=${activeAssignmentId}` : ""}`}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:flex lg:items-center lg:justify-between",
                  activeSection === section.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {section.label}
                {activeSection === section.id && <ChevronRight className="hidden h-3.5 w-3.5 lg:block" />}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-border bg-card px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-medium text-accent">
                    {stageLabel(module.currentStage)}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    {module.referencingStyle || "Harvard"}
                  </span>
                  {module.deadline && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {safeDate(module.deadline)}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight">{module.title}</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {module.assessmentQuestion || module.assessmentTitle || "Set the assessment question so the workspace can focus sources, knowledge, and context for planning and drafting."}
                </p>
              </div>
              <Link
                href={`/modules/${module.id}?section=${nextAction.section}${activeAssignmentId ? `&assignmentId=${activeAssignmentId}` : ""}`}
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
              >
                {nextAction.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </header>

          {activeAssignment && (
            <div className="border-b border-blue-200 bg-blue-50 px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ClipboardList className="h-4 w-4 shrink-0 text-blue-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-blue-900 truncate">{activeAssignment.title}</p>
                    <div className="flex flex-wrap gap-2 mt-0.5">
                      <span className="text-xs text-blue-700">{assignmentTypeLabel(activeAssignment.type)}</span>
                      {activeAssignment.weighting && <span className="text-xs text-blue-700">({activeAssignment.weighting})</span>}
                      {activeAssignment.wordCount > 0 && <span className="text-xs text-blue-700">{activeAssignment.wordCount.toLocaleString()} words</span>}
                      {activeAssignment.dueDate && <span className="text-xs text-blue-700">Due {safeDate(activeAssignment.dueDate)}</span>}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/modules/${module.id}?section=overview`}
                  className="shrink-0 text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline"
                >
                  Clear
                </Link>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6">
            {activeSection === "overview" && (
              <ModuleOverview
                module={module}
                sources={sources}
                knowledgePages={knowledgePages}
                contextPack={activeContextPack}
                contextPacks={contextPacks}
                plan={currentPlan}
                draft={currentDraft}
                assignments={assignments}
                moduleProfile={moduleProfile}
              />
            )}
            {activeSection === "sources" && (
              <ModuleSources module={module} initialSources={sources} knowledgePages={knowledgePages} activeContextPack={activeContextPack} />
            )}
            {activeSection === "knowledge" && (
              <ModuleKnowledge module={module} sources={sources} initialPages={knowledgePages} />
            )}
            {activeSection === "context" && (
              <ModuleContext
                module={module}
                sources={sources}
                contextPacks={contextPacks}
                activeContextPack={activeContextPack}
                activeAssignment={activeAssignment}
                assignments={assignments}
              />
            )}
            {activeSection === "plan" && (
              <ModulePlan
                module={module}
                sources={sources}
                knowledgePages={knowledgePages}
                contextPacks={contextPacks}
                activeContextPack={activeContextPack}
                currentPlan={currentPlan}
                activeAssignment={activeAssignment}
              />
            )}
            {activeSection === "draft" && (
              <ModuleDraft module={module} contextPack={activeContextPack} plan={currentPlan} initialDraft={currentDraft} activeAssignment={activeAssignment} />
            )}
            {activeSection === "final" && (
              <ModuleFinal module={module} sources={sources} contextPack={activeContextPack} draft={currentDraft} initialFeedback={feedback} activeAssignment={activeAssignment} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ModuleOverview({
  module,
  sources,
  knowledgePages,
  contextPack,
  contextPacks,
  plan,
  draft,
  assignments,
  moduleProfile,
}: {
  module: PolisModule;
  sources: PolisSource[];
  knowledgePages: KnowledgePage[];
  contextPack: ContextPack | null;
  contextPacks: ContextPack[];
  plan: Plan | null;
  draft: Draft | null;
  assignments: Assignment[];
  moduleProfile: ModuleProfile | null;
}) {
  const [assessmentTitle, setAssessmentTitle] = useState(module.assessmentTitle);
  const [assessmentQuestion, setAssessmentQuestion] = useState(module.assessmentQuestion);
  const [deadline, setDeadline] = useState(module.deadline);
  const [targetGrade, setTargetGrade] = useState(module.targetGrade);
  const [referencingStyle, setReferencingStyle] = useState(module.referencingStyle);
  const [currentStage, setCurrentStage] = useState<WorkspaceStage>(module.currentStage);
  const [workspaceTitle, setWorkspaceTitle] = useState(module.title);
  const [workspaceDescription, setWorkspaceDescription] = useState(module.description);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    summary: moduleProfile?.summary || "",
    keyThemes: (moduleProfile?.keyThemes || []).join("\n"),
    keyConcepts: (moduleProfile?.keyConcepts || []).join("\n"),
    keyTheories: (moduleProfile?.keyTheories || []).join("\n"),
    keyCases: (moduleProfile?.keyCases || []).join("\n"),
    assessmentSummary: moduleProfile?.assessmentSummary || "",
    importantReadings: (moduleProfile?.importantReadings || []).join("\n"),
    academicExpectations: moduleProfile?.academicExpectations || "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileGenerating, setProfileGenerating] = useState(false);
  const [detectingAssignments, setDetectingAssignments] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const processedSourceCount = sources.filter((source) => normalizeSourceStatus(source.status) === "processed").length;
  const sourceBriefCount = knowledgePages.filter((page) => page.type === "source_brief").length;
  const nextAction = getPolisNextAction({ sources, knowledgePages, contextPack, plan, draft });

  const detectedAssignments = assignments.filter((a) => a.status === "detected");
  const activeAssignments = assignments.filter((a) => a.status === "approved" || a.status === "active");

  async function saveAssessment() {
    setSaving(true);
    setMessage("");
    try {
      await postPolis("updateModule", {
        moduleId: module.id,
        title: workspaceTitle,
        description: workspaceDescription,
        assessmentTitle,
        assessmentQuestion,
        deadline,
        targetGrade,
        referencingStyle,
        currentStage,
      });
      setMessage("Overview saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    setProfileSaving(true);
    try {
      await postPolis("upsertModuleProfile", {
        moduleId: module.id,
        summary: profileForm.summary,
        keyThemes: linesToArray(profileForm.keyThemes),
        keyConcepts: linesToArray(profileForm.keyConcepts),
        keyTheories: linesToArray(profileForm.keyTheories),
        keyCases: linesToArray(profileForm.keyCases),
        assessmentSummary: profileForm.assessmentSummary,
        importantReadings: linesToArray(profileForm.importantReadings),
        academicExpectations: profileForm.academicExpectations,
      });
      setProfileEditing(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Save failed");
    } finally {
      setProfileSaving(false);
    }
  }

  async function generateProfile() {
    setProfileGenerating(true);
    setAiMessage("");
    try {
      await postAI("generateModuleProfile", { moduleId: module.id });
      setAiMessage("Module profile generated.");
      window.location.reload();
    } catch (error) {
      setAiMessage(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setProfileGenerating(false);
    }
  }

  async function detectAssignments() {
    setDetectingAssignments(true);
    setAiMessage("");
    try {
      const result = await postAI("detectAssignments", { moduleId: module.id });
      setAiMessage(`Detected ${result.created} new assignment(s)${result.skipped > 0 ? `, ${result.skipped} duplicate(s) skipped` : ""}.`);
      if (result.created > 0) window.location.reload();
    } catch (error) {
      setAiMessage(error instanceof Error ? error.message : "Detection failed");
    } finally {
      setDetectingAssignments(false);
    }
  }

  async function approveAssignment(assignmentId: string) {
    try {
      await postPolis("approveAssignment", { assignmentId });
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to approve");
    }
  }

  async function dismissAssignment(assignmentId: string) {
    try {
      await postPolis("dismissAssignment", { assignmentId });
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to dismiss");
    }
  }

  if (selectedAssignment) {
    return <AssignmentDetail assignment={selectedAssignment} module={module} sources={sources} contextPacks={contextPacks} onBack={() => setSelectedAssignment(null)} />;
  }

  return (
    <div className="grid max-w-6xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Workspace details</h2>
            <button onClick={() => setProfileEditing(!profileEditing)} className="text-xs text-accent hover:underline">
              {profileEditing ? "Cancel" : "Edit"}
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-medium text-accent">{module.code}</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{stageLabel(module.currentStage)}</span>
            </div>
            <p className="text-sm text-muted-foreground">{module.description || "Add a description to help identify this workspace."}</p>
          </div>
        </div>

        {sources.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-6">
            <h2 className="text-sm font-semibold text-accent">Get started with this workspace</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Follow these steps to build coursework context from your module material:
            </p>
            <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">1</span>
                <span><strong className="text-foreground">Add sources</strong> — upload readings, lecture slides, module handbooks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">2</span>
                <span><strong className="text-foreground">Build knowledge</strong> — generate source briefs and concept pages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">3</span>
                <span><strong className="text-foreground">Create assignments</strong> — detect or manually add assignments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">4</span>
                <span><strong className="text-foreground">Build context</strong> — create context packs for each assignment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">5</span>
                <span>Plan, draft, and refine your coursework</span>
              </li>
            </ol>
            <Link
              href={`/modules/${module.id}?section=sources`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              <Upload className="h-4 w-4" />
              Add your first source
            </Link>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Module profile</h2>
            <div className="flex items-center gap-2">
              <button onClick={generateProfile} disabled={profileGenerating} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline disabled:opacity-50">
                {profileGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {moduleProfile?.summary ? "Refresh" : "Generate"}
              </button>
              <button onClick={() => setProfileEditing(!profileEditing)} className="text-xs text-accent hover:underline">
                {profileEditing ? "Cancel" : "Edit"}
              </button>
            </div>
          </div>
          {profileEditing ? (
            <div className="mt-4 space-y-3">
              <textarea value={profileForm.summary} onChange={(e) => setProfileForm({ ...profileForm, summary: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Module summary" />
              <textarea value={profileForm.keyThemes} onChange={(e) => setProfileForm({ ...profileForm, keyThemes: e.target.value })} className="min-h-16 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Key themes, one per line" />
              <textarea value={profileForm.keyConcepts} onChange={(e) => setProfileForm({ ...profileForm, keyConcepts: e.target.value })} className="min-h-16 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Key concepts, one per line" />
              <textarea value={profileForm.keyTheories} onChange={(e) => setProfileForm({ ...profileForm, keyTheories: e.target.value })} className="min-h-16 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Key theories, one per line" />
              <textarea value={profileForm.keyCases} onChange={(e) => setProfileForm({ ...profileForm, keyCases: e.target.value })} className="min-h-16 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Key cases, one per line" />
              <textarea value={profileForm.assessmentSummary} onChange={(e) => setProfileForm({ ...profileForm, assessmentSummary: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Assessment summary" />
              <textarea value={profileForm.importantReadings} onChange={(e) => setProfileForm({ ...profileForm, importantReadings: e.target.value })} className="min-h-16 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Important readings, one per line" />
              <textarea value={profileForm.academicExpectations} onChange={(e) => setProfileForm({ ...profileForm, academicExpectations: e.target.value })} className="min-h-16 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Academic expectations" />
              <button onClick={saveProfile} disabled={profileSaving} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
                {profileSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          ) : (
            <div className="mt-3">
              {moduleProfile ? (
                <div className="space-y-3">
                  {moduleProfile.summary && <p className="text-sm text-muted-foreground">{moduleProfile.summary}</p>}
                  {moduleProfile.keyThemes.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Key themes</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {moduleProfile.keyThemes.map((theme) => <span key={theme} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-800">{theme}</span>)}
                      </div>
                    </div>
                  )}
                  {moduleProfile.keyConcepts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Key concepts</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {moduleProfile.keyConcepts.map((concept) => <span key={concept} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-800">{concept}</span>)}
                      </div>
                    </div>
                  )}
                  {moduleProfile.keyTheories.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Key theories</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {moduleProfile.keyTheories.map((theory) => <span key={theory} className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-800">{theory}</span>)}
                      </div>
                    </div>
                  )}
                  {moduleProfile.keyCases.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Key cases</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {moduleProfile.keyCases.map((c) => <span key={c} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">{c}</span>)}
                      </div>
                    </div>
                  )}
                  {moduleProfile.assessmentSummary && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Assessment</p>
                      <p className="mt-1 text-sm text-muted-foreground">{moduleProfile.assessmentSummary}</p>
                    </div>
                  )}
                  {!moduleProfile.summary && moduleProfile.keyThemes.length === 0 && (
                    <p className="text-sm text-muted-foreground">No profile yet. Click Edit to add key themes, concepts, and assessment details.</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No profile yet. Click Edit to add key themes, concepts, and assessment details.</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Workspace settings</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted-foreground">
              Title
              <input value={workspaceTitle} onChange={(e) => setWorkspaceTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Workspace title" />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Assessment title
              <input value={assessmentTitle} onChange={(e) => setAssessmentTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="e.g. Comparative government essay" />
            </label>
            <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
              Description
              <textarea value={workspaceDescription} onChange={(e) => setWorkspaceDescription(e.target.value)} className="mt-1 min-h-16 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Describe this workspace" />
            </label>
            <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
              Assessment question
              <textarea value={assessmentQuestion} onChange={(e) => setAssessmentQuestion(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Paste the essay or coursework question here." />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Deadline
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Target grade
              <input value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="e.g. First / 70+" />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Referencing style
              <input value={referencingStyle} onChange={(e) => setReferencingStyle(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Harvard" />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Current stage
              <select value={currentStage} onChange={(e) => setCurrentStage(e.target.value as WorkspaceStage)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                {(["setup", "sources", "knowledge", "context", "plan", "draft", "final"] as WorkspaceStage[]).map((stage) => (
                  <option key={stage} value={stage}>{stageLabel(stage)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={saveAssessment} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Save overview
            </button>
            {message && <span className="text-xs text-muted-foreground">{message}</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Next action</h2>
          <p className="mt-3 text-lg font-medium">{nextAction.label}</p>
          <Link href={`/modules/${module.id}?section=${nextAction.section}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
            Go to {sections.find((section) => section.id === nextAction.section)?.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Assignments</h2>
            <div className="flex items-center gap-2">
              <button onClick={detectAssignments} disabled={detectingAssignments} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline disabled:opacity-50">
                {detectingAssignments ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Detect
              </button>
              <button onClick={() => { setEditingAssignment(null); setShowAssignmentForm(true); }} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
          </div>

          {detectedAssignments.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-amber-700">Detected assignments awaiting review</p>
              {detectedAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{assignment.title}</p>
                    <p className="text-xs text-muted-foreground">{assignmentTypeLabel(assignment.type)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => approveAssignment(assignment.id)} className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-200">Approve</button>
                    <button onClick={() => dismissAssignment(assignment.id)} className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200">Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeAssignments.length > 0 && (
            <div className="mt-3 space-y-2">
              {activeAssignments.map((assignment) => (
                <button
                  key={assignment.id}
                  onClick={() => setSelectedAssignment(assignment)}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{assignment.title}</p>
                    <div className="mt-1 flex gap-1.5">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-800">{assignmentTypeLabel(assignment.type)}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs", assignmentStatusLabelClass(assignment.status))}>{assignment.status}</span>
                      {assignment.dueDate && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">{safeDate(assignment.dueDate)}</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {aiMessage && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{aiMessage}</div>
          )}

          {assignments.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">No assignments yet. Click Add to create one, or upload a module handbook for auto-detection later.</p>
          )}
        </div>

        {showAssignmentForm && (
          <AssignmentForm
            module={module}
            assignment={editingAssignment}
            onSave={async (data) => {
              if (editingAssignment) {
                await postPolis("updateAssignment", { assignmentId: editingAssignment.id, ...data });
              } else {
                await postPolis("createAssignment", data);
              }
              setShowAssignmentForm(false);
              setEditingAssignment(null);
              window.location.reload();
            }}
            onCancel={() => { setShowAssignmentForm(false); setEditingAssignment(null); }}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Sources" value={sources.length} detail={`${processedSourceCount} processed`} />
          <StatCard label="Knowledge" value={knowledgePages.length} detail={`${sourceBriefCount} source briefs`} />
          <StatCard label="Context Pack" value={contextPack ? "Ready" : "Missing"} detail={contextPack?.title || "Create in Context"} />
          <StatCard label="Draft" value={draft ? draftStatusLabel(draft.status) : "Not started"} detail={plan ? "Plan available" : "Plan needed"} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Workflow status</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: "Sources", section: "sources" as PolisSection, done: sources.length > 0 },
              { label: "Knowledge", section: "knowledge" as PolisSection, done: knowledgePages.length > 0 },
              { label: "Context Pack", section: "context" as PolisSection, done: !!contextPack },
              { label: "Plan", section: "plan" as PolisSection, done: !!plan },
              { label: "Draft", section: "draft" as PolisSection, done: !!draft },
              { label: "Final", section: "final" as PolisSection, done: draft?.status === "final" },
            ].map((step) => (
              <Link
                key={step.label}
                href={`/modules/${module.id}?section=${step.section}`}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted"
              >
                <span className="text-sm">{step.label}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs", step.done ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-700")}>{step.done ? "Ready" : "Open"}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{detail}</p>
    </div>
  );
}

function assignmentTypeLabel(type: AssignmentType): string {
  const labels: Record<AssignmentType, string> = {
    essay: "Essay",
    research_project: "Research Project",
    literature_review: "Literature Review",
    briefing: "Briefing",
    exam: "Exam",
    quiz: "Quiz",
    presentation: "Presentation",
    other: "Other",
  };
  return labels[type];
}

function assignmentStatusLabelClass(status: AssignmentStatus): string {
  const classes: Record<AssignmentStatus, string> = {
    detected: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    active: "bg-blue-100 text-blue-800",
    archived: "bg-stone-100 text-stone-700",
    dismissed: "bg-stone-100 text-stone-500",
  };
  return classes[status];
}

const assignmentTypes: AssignmentType[] = [
  "essay",
  "research_project",
  "literature_review",
  "briefing",
  "exam",
  "quiz",
  "presentation",
  "other",
];

function AssignmentForm({
  module,
  assignment,
  onSave,
  onCancel,
}: {
  module: PolisModule;
  assignment: Assignment | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(assignment?.title || "");
  const [type, setType] = useState<AssignmentType>(assignment?.type || "essay");
  const [questionOrBrief, setQuestionOrBrief] = useState(assignment?.questionOrBrief || "");
  const [weighting, setWeighting] = useState(assignment?.weighting || "");
  const [dueDate, setDueDate] = useState(assignment?.dueDate || "");
  const [wordCount, setWordCount] = useState(assignment?.wordCount || 0);
  const [markingCriteriaSummary, setMarkingCriteriaSummary] = useState(assignment?.markingCriteriaSummary || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        moduleId: module.id,
        title,
        type,
        questionOrBrief,
        weighting,
        dueDate,
        wordCount: wordCount || undefined,
        markingCriteriaSummary,
        status: assignment?.status || "approved",
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{assignment ? "Edit assignment" : "New assignment"}</h2>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Assignment title" />
        <select value={type} onChange={(e) => setType(e.target.value as AssignmentType)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          {assignmentTypes.map((t) => <option key={t} value={t}>{assignmentTypeLabel(t)}</option>)}
        </select>
        <textarea value={questionOrBrief} onChange={(e) => setQuestionOrBrief(e.target.value)} className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder="Question or brief" />
        <input value={weighting} onChange={(e) => setWeighting(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Weighting (e.g. 50%)" />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <input type="number" value={wordCount || ""} onChange={(e) => setWordCount(Number(e.target.value))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Word count" />
        <div />
        <textarea value={markingCriteriaSummary} onChange={(e) => setMarkingCriteriaSummary(e.target.value)} className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder="Marking criteria summary" />
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={handleSave} disabled={saving || !title.trim()} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
        <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
      </div>
    </div>
  );
}

function AssignmentDetail({
  assignment,
  module,
  sources,
  contextPacks,
  onBack,
}: {
  assignment: Assignment;
  module: PolisModule;
  sources: PolisSource[];
  contextPacks: ContextPack[];
  onBack: () => void;
}) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [relevanceRecords, setRelevanceRecords] = useState<Array<any>>([]);
  const [relevanceLoading, setRelevanceLoading] = useState(true);
  const [suggestingRelevance, setSuggestingRelevance] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [editingRelevanceId, setEditingRelevanceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ relevanceType: string; relevanceNote: string }>({ relevanceType: "", relevanceNote: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [recommendations, setRecommendations] = useState<Array<any>>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recGenerating, setRecGenerating] = useState(false);
  const [recFocus, setRecFocus] = useState("");
  const [recMessage, setRecMessage] = useState("");

  const assignmentContextPacks = contextPacks.filter((cp) => cp.assignmentId === assignment.id);
  const hasContextPack = assignmentContextPacks.length > 0;

  useState(() => {
    setRelevanceLoading(true);
    postPolis("listAssignmentSourceRelevance", { assignmentId: assignment.id })
      .then((data) => setRelevanceRecords(Array.isArray(data) ? data : []))
      .catch(() => setRelevanceRecords([]))
      .finally(() => setRelevanceLoading(false));
    loadRecommendations();
  });

  async function handleSave(data: Record<string, unknown>) {
    await postPolis("updateAssignment", { assignmentId: assignment.id, ...data });
    window.location.reload();
  }

  async function suggestRelevance() {
    setSuggestingRelevance(true);
    setAiMessage("");
    try {
      const result = await postAI("suggestAssignmentSourceRelevance", {
        assignmentId: assignment.id,
        moduleId: module.id,
      });
      setAiMessage(`Created ${result.created} relevance record(s).`);
      const updated = await postPolis("listAssignmentSourceRelevance", { assignmentId: assignment.id });
      setRelevanceRecords(Array.isArray(updated) ? updated : []);
    } catch (error) {
      setAiMessage(error instanceof Error ? error.message : "Suggestion failed");
    } finally {
      setSuggestingRelevance(false);
    }
  }

  async function removeRelevance(relevanceId: string) {
    try {
      await postPolis("removeAssignmentSourceRelevance", { relevanceId });
      setRelevanceRecords((prev) => prev.filter((r) => r.id !== relevanceId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Remove failed");
    }
  }

  async function saveRelevanceEdit(relevanceId: string) {
    setEditSaving(true);
    try {
      await postPolis("upsertAssignmentSourceRelevance", {
        assignmentId: assignment.id,
        moduleId: module.id,
        sourceId: relevanceRecords.find((r) => r.id === relevanceId)?.sourceId,
        relevanceType: editForm.relevanceType,
        relevanceNote: editForm.relevanceNote,
      });
      setRelevanceRecords((prev) =>
        prev.map((r) => r.id === relevanceId ? { ...r, relevanceType: editForm.relevanceType, relevanceNote: editForm.relevanceNote } : r)
      );
      setEditingRelevanceId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  }

  async function createContextPackFromRelevance() {
    setAiMessage("");
    try {
      await postPolis("createContextPackFromAssignmentRelevance", {
        assignmentId: assignment.id,
        moduleId: module.id,
      });
      setAiMessage("Context pack created from relevant sources.");
      window.location.reload();
    } catch (error) {
      setAiMessage(error instanceof Error ? error.message : "Failed to create context pack");
    }
  }

  async function loadRecommendations() {
    setRecLoading(true);
    try {
      const data = await postPolis("listExternalSourceRecommendations", {
        moduleId: module.id,
        assignmentId: assignment.id,
      });
      setRecommendations(Array.isArray(data) ? data.filter((r: any) => r.status !== "dismissed") : []);
    } catch {
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  }

  async function generateRecommendations() {
    setRecGenerating(true);
    setRecMessage("");
    try {
      const result = await postAI("recommendExternalSources", {
        moduleId: module.id,
        assignmentId: assignment.id,
        focus: recFocus || undefined,
      });
      setRecMessage(`Generated ${result.created} recommendation(s).${result.warning ? ` ${result.warning}` : ""}`);
      await loadRecommendations();
    } catch (error) {
      setRecMessage(error instanceof Error ? error.message : "Recommendation generation failed");
    } finally {
      setRecGenerating(false);
    }
  }

  async function saveRecommendation(recId: string) {
    try {
      await postPolis("saveExternalSourceRecommendation", { recommendationId: recId });
      setRecommendations((prev) => prev.map((r) => r.id === recId ? { ...r, status: "saved" } : r));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Save failed");
    }
  }

  async function dismissRecommendation(recId: string) {
    try {
      await postPolis("dismissExternalSourceRecommendation", { recommendationId: recId });
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Dismiss failed");
    }
  }

  async function markRecommendationImported(recId: string) {
    try {
      await postPolis("markExternalSourceRecommendationImported", { recommendationId: recId });
      setRecommendations((prev) => prev.map((r) => r.id === recId ? { ...r, status: "imported" } : r));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Update failed");
    }
  }

  if (showEditForm) {
    return (
      <AssignmentForm
        module={module}
        assignment={assignment}
        onSave={handleSave}
        onCancel={() => setShowEditForm(false)}
      />
    );
  }

  const relevanceByType = relevanceRecords.reduce((acc: Record<string, any[]>, r: any) => {
    const type = r.relevanceType || "background";
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {});

  const relevantCount = relevanceRecords.filter((r) => r.relevanceType !== "not_relevant").length;

  const relevanceTypeOptions = [
    { value: "core", label: "Core" },
    { value: "supporting", label: "Supporting" },
    { value: "opposing", label: "Opposing" },
    { value: "theoretical", label: "Theoretical" },
    { value: "empirical_case", label: "Empirical/Case" },
    { value: "methodological", label: "Methodological" },
    { value: "background", label: "Background" },
    { value: "not_relevant", label: "Not relevant" },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button onClick={onBack} className="mb-2 text-xs text-accent hover:underline">Back to overview</button>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">{assignmentTypeLabel(assignment.type)}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", assignmentStatusLabelClass(assignment.status))}>{assignment.status}</span>
              {assignment.weighting && <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700">{assignment.weighting}</span>}
              {assignment.dueDate && <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700"><Calendar className="h-3 w-3" />{safeDate(assignment.dueDate)}</span>}
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight">{assignment.title}</h2>
          </div>
          <button onClick={() => setShowEditForm(true)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Edit</button>
        </div>

        {assignment.questionOrBrief && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Question / Brief</p>
            <p className="mt-1 text-sm whitespace-pre-line">{assignment.questionOrBrief}</p>
          </div>
        )}

        {assignment.markingCriteriaSummary && (
          <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Marking criteria</p>
            <p className="mt-1 text-sm whitespace-pre-line">{assignment.markingCriteriaSummary}</p>
          </div>
        )}

        {assignment.wordCount > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">{assignment.wordCount.toLocaleString()} words</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Source relevance ({relevantCount} relevant)</h3>
          <button onClick={suggestRelevance} disabled={suggestingRelevance} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline disabled:opacity-50">
            {suggestingRelevance ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Suggest relevance
          </button>
        </div>
        {aiMessage && <p className="mt-2 text-xs text-muted-foreground">{aiMessage}</p>}
        {relevanceLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading relevance records...
          </div>
        ) : relevanceRecords.length > 0 ? (
          <div className="mt-4 space-y-4">
            {Object.entries(relevanceByType).map(([type, records]) => (
              <div key={type}>
                <p className="text-xs font-medium text-muted-foreground capitalize">{type.replace(/_/g, " ")} ({records.length})</p>
                <div className="mt-2 space-y-2">
                  {records.map((record: any) => {
                    const source = sources.find((s) => s.id === record.sourceId);
                    const isEditing = editingRelevanceId === record.id;
                    return (
                      <div key={record.id} className="flex items-start justify-between rounded-lg border border-border px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{source?.title || "Unknown source"}</p>
                          {isEditing ? (
                            <div className="mt-2 space-y-2">
                              <select
                                value={editForm.relevanceType}
                                onChange={(e) => setEditForm({ ...editForm, relevanceType: e.target.value })}
                                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
                              >
                                {relevanceTypeOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              <textarea
                                value={editForm.relevanceNote}
                                onChange={(e) => setEditForm({ ...editForm, relevanceNote: e.target.value })}
                                className="min-h-12 w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
                                placeholder="Relevance note"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveRelevanceEdit(record.id)}
                                  disabled={editSaving}
                                  className="rounded bg-accent px-2 py-1 text-xs text-accent-foreground disabled:opacity-50"
                                >
                                  {editSaving ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={() => setEditingRelevanceId(null)}
                                  className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {record.relevanceNote && <p className="mt-1 text-xs text-muted-foreground">{record.relevanceNote}</p>}
                              {record.usefulEvidence && <p className="mt-1 text-xs text-blue-700">Evidence: {record.usefulEvidence}</p>}
                            </>
                          )}
                        </div>
                        {!isEditing && (
                          <div className="flex shrink-0 gap-1">
                            <button
                              onClick={() => {
                                setEditingRelevanceId(record.id);
                                setEditForm({ relevanceType: record.relevanceType, relevanceNote: record.relevanceNote || "" });
                              }}
                              className="text-muted-foreground hover:text-accent"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => removeRelevance(record.id)} className="text-muted-foreground hover:text-red-600">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No source relevance records yet. Click &ldquo;Suggest relevance&rdquo; to let AI analyse which sources matter for this assignment.</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Status</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Sources</p>
            <p className="mt-1 text-lg font-semibold">{sources.length}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Relevance</p>
            <p className="mt-1 text-lg font-semibold">{relevantCount}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Context Pack</p>
            <p className={cn("mt-1 text-lg font-semibold", hasContextPack ? "text-green-700" : "text-muted-foreground")}>{hasContextPack ? "Ready" : "None"}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="mt-1 text-lg font-semibold text-muted-foreground">In Plan tab</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href={`/modules/${module.id}?section=context&assignmentId=${assignment.id}`} className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted">
            <Layers3 className="h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Context</p>
            <p className="mt-1 text-xs text-muted-foreground">{hasContextPack ? "View context pack" : "Build assignment context"}</p>
          </Link>
          {!hasContextPack && relevantCount > 0 && (
            <button
              onClick={createContextPackFromRelevance}
              className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
            >
              <Sparkles className="h-5 w-5 text-accent" />
              <p className="mt-2 text-sm font-medium">Auto-create context</p>
              <p className="mt-1 text-xs text-muted-foreground">Build context pack from relevant sources</p>
            </button>
          )}
          <Link href={`/modules/${module.id}?section=plan&assignmentId=${assignment.id}`} className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Plan</p>
            <p className="mt-1 text-xs text-muted-foreground">Build assignment plan</p>
          </Link>
          <Link href={`/modules/${module.id}?section=draft&assignmentId=${assignment.id}`} className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted">
            <Pencil className="h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Draft</p>
            <p className="mt-1 text-xs text-muted-foreground">Write and revise</p>
          </Link>
          <Link href={`/modules/${module.id}?section=final&assignmentId=${assignment.id}`} className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Final</p>
            <p className="mt-1 text-xs text-muted-foreground">Review and export</p>
          </Link>
          <button
            onClick={suggestRelevance}
            disabled={suggestingRelevance}
            className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Suggest relevance</p>
            <p className="mt-1 text-xs text-muted-foreground">AI-analyse source relevance</p>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Recommended external sources</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              AI-suggested readings outside your uploaded sources. These are leads to search for, not imported sources.
            </p>
          </div>
          <button
            onClick={generateRecommendations}
            disabled={recGenerating}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {recGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Recommend sources
          </button>
        </div>

        <div className="mt-3">
          <input
            value={recFocus}
            onChange={(e) => setRecFocus(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="e.g. opposing arguments, UK case studies, postcolonial theory, quantitative methods"
          />
        </div>

        {recMessage && <p className="mt-3 text-xs text-muted-foreground">{recMessage}</p>}

        {recLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading recommendations...
          </div>
        ) : recommendations.length > 0 ? (
          <div className="mt-4 space-y-3">
            {recommendations.map((rec: any) => (
              <div key={rec.id} className="rounded-lg border border-border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-800 capitalize">{rec.sourceType?.replace(/_/g, " ")}</span>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700 capitalize">{rec.recommendedUse?.replace(/_/g, " ")}</span>
                      {rec.confidence && (
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          rec.confidence === "high" ? "bg-green-100 text-green-800" : rec.confidence === "low" ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-700"
                        )}>{rec.confidence} confidence</span>
                      )}
                      {rec.status === "saved" && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Saved</span>}
                      {rec.status === "imported" && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Imported</span>}
                    </div>
                    {rec.authors && <p className="mt-1 text-xs text-muted-foreground">{rec.authors}{rec.year ? ` (${rec.year})` : ""}</p>}
                    {rec.publisherOrJournal && <p className="text-xs text-muted-foreground">{rec.publisherOrJournal}</p>}
                    {rec.whyUseful && <p className="mt-2 text-sm text-muted-foreground">{rec.whyUseful}</p>}
                    {rec.possibleCitation && (
                      <p className="mt-2 rounded bg-muted/40 p-2 text-xs text-muted-foreground font-mono break-all">
                        {rec.possibleCitation}
                      </p>
                    )}
                    {rec.searchQuery && (
                      <p className="mt-2 text-xs text-blue-700">
                        Search: <span className="font-medium">{rec.searchQuery}</span>
                      </p>
                    )}
                    {rec.url && (
                      <a href={rec.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-accent hover:underline truncate max-w-full">
                        {rec.url}
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {rec.status === "suggested" && (
                      <button onClick={() => saveRecommendation(rec.id)} className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200">Save</button>
                    )}
                    {rec.status === "saved" && (
                      <button onClick={() => markRecommendationImported(rec.id)} className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-200">Mark imported</button>
                    )}
                    <button onClick={() => dismissRecommendation(rec.id)} className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200">Dismiss</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !recGenerating && (
          <p className="mt-3 text-sm text-muted-foreground">No external source recommendations yet. Click &ldquo;Recommend sources&rdquo; to generate suggestions based on your module and assignment context.</p>
        )}
      </div>

      <div>
        <Link
          href={`/modules/${module.id}?section=overview`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          Clear assignment / back to workspace
        </Link>
      </div>
    </div>
  );
}

function ModuleSources({
  module,
  initialSources,
  knowledgePages,
  activeContextPack,
}: {
  module: PolisModule;
  initialSources: PolisSource[];
  knowledgePages: KnowledgePage[];
  activeContextPack: ContextPack | null;
}) {
  const router = useRouter();
  const [sources, setSources] = useState(initialSources);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("reading");
  const [editingSource, setEditingSource] = useState<PolisSource | null>(null);
  const [savingSource, setSavingSource] = useState(false);
  const [briefLoading, setBriefLoading] = useState<string | null>(null);
  const [contextMessage, setContextMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters = [
    { id: "all", label: "All" },
    { id: "reading", label: "Readings" },
    { id: "lecture", label: "Lectures" },
    { id: "assessment", label: "Assessments" },
    { id: "feedback", label: "Feedback" },
    { id: "note", label: "Notes" },
    { id: "link", label: "Links" },
    { id: "unprocessed", label: "Unprocessed" },
    { id: "processed", label: "Processed" },
    { id: "high", label: "High relevance" },
    { id: "missing_citation", label: "Missing citation" },
  ];

  const filtered = sources.filter((source) => {
    const haystack = [source.title, source.author, source.summary, source.citation, source.tags.join(" ")].join(" ").toLowerCase();
    const matchesSearch = !search || haystack.includes(search.toLowerCase());
    const status = normalizeSourceStatus(source.status);
    const matchesFilter =
      filter === "all" ||
      source.type === filter ||
      (filter === "processed" && status === "processed") ||
      (filter === "unprocessed" && status !== "processed") ||
      (filter === "high" && source.relevance === "high") ||
      (filter === "missing_citation" && !source.citation);
    return matchesSearch && matchesFilter;
  });

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("moduleId", module.id);
      formData.append("sourceType", sourceType);
      const res = await fetch("/api/sources/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function saveMetadata() {
    if (!editingSource) return;
    setSavingSource(true);
    try {
      const updated = await postPolis("updateSource", {
        sourceId: editingSource.id,
        title: editingSource.title,
        author: editingSource.author,
        year: editingSource.year ? Number(editingSource.year) : undefined,
        type: editingSource.type,
        relevance: editingSource.relevance || "unknown",
        citation: editingSource.citation,
        tags: editingSource.tags,
      });
      setSources((current) => current.map((source) => source.id === updated.id ? { ...source, ...updated } : source));
      setEditingSource(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSavingSource(false);
    }
  }

  async function createSourceBrief(sourceId: string) {
    setBriefLoading(sourceId);
    try {
      try {
        await postAI("generateSourceBrief", { sourceId });
      } catch {
        await postPolis("createSourceBrief", { sourceId });
      }
      router.push(`/modules/${module.id}?section=knowledge`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not create source brief");
    } finally {
      setBriefLoading(null);
    }
  }

  async function addToContextPack(sourceId: string) {
    if (!activeContextPack) return;
    const selectedSourceIds = Array.from(new Set([...activeContextPack.selectedSourceIds, sourceId]));
    try {
      await postPolis("updateContextPack", { contextPackId: activeContextPack.id, selectedSourceIds });
      setContextMessage("Source added to the active context pack. Refresh or reopen Plan to see it selected.");
    } catch (error) {
      setContextMessage(error instanceof Error ? error.message : "Could not update context pack");
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      <section className="rounded-2xl border-2 border-dashed border-border bg-card p-6">
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.md" onChange={handleUpload} disabled={uploading} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Add sources</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Add readings, lecture slides, assessment briefs, or rough notes. Polis uses these as the raw material for your module knowledge base.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {polisSourceTypes.map((type) => <option key={type} value={type}>{sourceTypeLabel(type)}</option>)}
            </select>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Browse files
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm" placeholder="Search sources by title, author, citation, or tag" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button key={item.id} onClick={() => setFilter(item.id)} className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium", filter === item.id ? "bg-accent text-accent-foreground" : "border border-border bg-card text-muted-foreground hover:bg-muted")}>{item.label}</button>
            ))}
          </div>
        </div>

        {contextMessage && <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{contextMessage}</div>}

        <div className="space-y-3">
          {filtered.map((source) => {
            const brief = knowledgePages.find((page) => page.type === "source_brief" && page.linkedSourceIds.includes(source.id));
            const status = normalizeSourceStatus(source.status);
            return (
              <article key={source.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">{sourceTypeLabel(source.type)}</span>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", sourceStatusClass(status))}>{sourceStatusLabel(status)}</span>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", relevanceClass(source.relevance))}>{relevanceLabel(source.relevance)}</span>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs", source.citation ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800")}>{source.citation ? "Citation present" : "Missing citation"}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold leading-tight">{source.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{source.author} {source.year ? `(${source.year})` : ""}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{source.summary || source.mainArgument || "No summary yet. Create a source brief to compile this reading into the knowledge base."}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {source.tags.slice(0, 5).map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>)}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{source.linkedKnowledgeCount} linked knowledge page{source.linkedKnowledgeCount === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                    <Link href={`/sources/${source.id}`} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">View</Link>
                    <button onClick={() => setEditingSource(source)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Edit metadata</button>
                    {brief ? (
                      <Link href={`/modules/${module.id}?section=knowledge`} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Open brief</Link>
                    ) : (
                      <button onClick={() => createSourceBrief(source.id)} disabled={briefLoading === source.id} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50">
                        {briefLoading === source.id && <Loader2 className="h-3 w-3 animate-spin" />}
                        Create brief
                      </button>
                    )}
                    {activeContextPack && !activeContextPack.selectedSourceIds.includes(source.id) && (
                      <button onClick={() => addToContextPack(source.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Add to context pack</button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 text-sm font-semibold">No sources found</h2>
            <p className="mt-1 text-sm text-muted-foreground">Adjust filters or add readings, lectures, assessments, feedback, notes, and links.</p>
          </div>
        )}
      </section>

      {editingSource && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Edit source metadata</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input value={editingSource.title} onChange={(e) => setEditingSource({ ...editingSource, title: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Title" />
            <input value={editingSource.author} onChange={(e) => setEditingSource({ ...editingSource, author: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Author" />
            <input type="number" value={editingSource.year || ""} onChange={(e) => setEditingSource({ ...editingSource, year: Number(e.target.value) })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Year" />
            <select value={editingSource.type} onChange={(e) => setEditingSource({ ...editingSource, type: e.target.value as SourceType })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {polisSourceTypes.map((type) => <option key={type} value={type}>{sourceTypeLabel(type)}</option>)}
            </select>
            <select value={editingSource.relevance || "unknown"} onChange={(e) => setEditingSource({ ...editingSource, relevance: e.target.value as SourceRelevance })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {(["unknown", "low", "medium", "high"] as SourceRelevance[]).map((relevance) => <option key={relevance} value={relevance}>{relevanceLabel(relevance)}</option>)}
            </select>
            <input value={editingSource.tags.join(", ")} onChange={(e) => setEditingSource({ ...editingSource, tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Tags, comma-separated" />
            <textarea value={editingSource.citation} onChange={(e) => setEditingSource({ ...editingSource, citation: e.target.value })} className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder="Citation" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={saveMetadata} disabled={savingSource} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">{savingSource ? "Saving..." : "Save metadata"}</button>
            <button onClick={() => setEditingSource(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          </div>
        </section>
      )}
    </div>
  );
}

function ModuleKnowledge({ module, sources, initialPages }: { module: PolisModule; sources: PolisSource[]; initialPages: KnowledgePage[] }) {
  const [pages, setPages] = useState(initialPages);
  const [editing, setEditing] = useState<KnowledgePage | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<KnowledgePageType, KnowledgePage[]>();
    for (const type of knowledgePageTypes) map.set(type, []);
    for (const page of pages) map.get(page.type)?.push(page);
    return map;
  }, [pages]);

  function newPage(type: KnowledgePageType = "concept") {
    setEditing({
      id: "",
      moduleId: module.id,
      title: "",
      type,
      content: "",
      linkedSourceIds: [],
      linkedPageIds: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async function savePage() {
    if (!editing?.title.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        moduleId: module.id,
        title: editing.title,
        type: editing.type,
        content: editing.content,
        linkedSourceIds: editing.linkedSourceIds,
        linkedPageIds: editing.linkedPageIds.filter((id) => id !== editing.id),
        tags: editing.tags,
      };
      const saved = editing.id
        ? await postPolis("updateKnowledgePage", { pageId: editing.id, ...payload })
        : await postPolis("createKnowledgePage", payload);
      setPages((current) => editing.id ? current.map((page) => page.id === saved.id ? saved : page) : [saved, ...current]);
      setEditing(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deletePage(pageId: string) {
    if (!confirm("Delete this knowledge page?")) return;
    try {
      await postPolis("deleteKnowledgePage", { pageId });
      setPages((current) => current.filter((page) => page.id !== pageId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <div className="grid max-w-7xl gap-6 xl:grid-cols-[1fr_24rem]">
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Knowledge base</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create source briefs and concept pages from your sources. This is where Polis starts to understand the module.</p>
          </div>
          <button onClick={() => newPage()} className="inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
            <Plus className="h-4 w-4" />
            Create page
          </button>
        </div>

        {knowledgePageTypes.map((type) => {
          const typePages = grouped.get(type) || [];
          if (typePages.length === 0) return null;
          return (
            <div key={type}>
              <h3 className="mb-3 text-sm font-semibold">{knowledgeTypeLabel(type)}s</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {typePages.map((page) => (
                  <article key={page.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent">{knowledgeTypeLabel(page.type)}</span>
                        <h4 className="mt-3 text-sm font-semibold leading-tight">{page.title}</h4>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(page)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deletePage(page.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground whitespace-pre-line">{page.content || "No content yet."}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{page.linkedSourceIds.length} sources</span>
                      <span>{page.linkedPageIds.length} linked pages</span>
                      <span>Updated {safeDate(page.updatedAt)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {page.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>)}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}

        {pages.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Layers3 className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-semibold">No knowledge pages yet</h3>
            {sources.length === 0 ? (
              <>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Upload sources first, then create source briefs and concept pages from your readings.</p>
                <Link href={`/modules/${module.id}?section=overview`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Add sources <ArrowRight className="h-3.5 w-3.5" /></Link>
              </>
            ) : (
              <>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Create source briefs from your {sources.length} uploaded source{sources.length !== 1 ? "s" : ""}, or add manual pages for concepts, theories, cases, and debates.</p>
                <button onClick={() => newPage("source_brief")} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Create first page</button>
              </>
            )}
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-border bg-card p-5 xl:sticky xl:top-20 xl:h-fit">
        <h3 className="text-sm font-semibold">{editing ? (editing.id ? "Edit knowledge page" : "New knowledge page") : "Knowledge editor"}</h3>
        {message && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-800">{message}</p>}
        {editing ? (
          <div className="mt-4 space-y-3">
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Page title" />
            <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as KnowledgePageType })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {knowledgePageTypes.map((type) => <option key={type} value={type}>{knowledgeTypeLabel(type)}</option>)}
            </select>
            <textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} className="min-h-72 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Write plain text or Markdown." />
            <input value={editing.tags.join(", ")} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Tags, comma-separated" />
            <LinkedCheckboxes title="Linked sources" items={sources.map((source) => ({ id: source.id, label: source.title }))} selectedIds={editing.linkedSourceIds} onChange={(ids) => setEditing({ ...editing, linkedSourceIds: ids })} />
            <LinkedCheckboxes title="Linked pages" items={pages.filter((page) => page.id !== editing.id).map((page) => ({ id: page.id, label: page.title }))} selectedIds={editing.linkedPageIds} onChange={(ids) => setEditing({ ...editing, linkedPageIds: ids })} />
            <div className="flex gap-2">
              <button onClick={savePage} disabled={saving || !editing.title.trim()} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Select a page to edit, or create a new source brief, concept, theory, case, debate, comparison, contradiction, synthesis, or essay pack.</p>
        )}
      </aside>
    </div>
  );
}

function LinkedCheckboxes({ title, items, selectedIds, onChange }: { title: string; items: Array<{ id: string; label: string }>; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
        {items.map((item) => (
          <label key={item.id} className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={(e) => onChange(e.target.checked ? [...selectedIds, item.id] : selectedIds.filter((id) => id !== item.id))} className="mt-0.5" />
            <span className="line-clamp-2">{item.label}</span>
          </label>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground">Nothing to link yet.</p>}
      </div>
    </div>
  );
}

function ModuleContext({
  module,
  sources,
  contextPacks,
  activeContextPack,
  activeAssignment,
  assignments,
}: {
  module: PolisModule;
  sources: PolisSource[];
  contextPacks: ContextPack[];
  activeContextPack: ContextPack | null;
  activeAssignment: Assignment | null;
  assignments: Assignment[];
}) {
  const [packForm, setPackForm] = useState(() => ({
    title: activeAssignment
      ? `Context: ${activeAssignment.title}`
      : `${module.code} assessment context`,
    assessmentQuestion: activeAssignment?.questionOrBrief || module.assessmentQuestion || "",
    selectedSourceIds: activeContextPack?.selectedSourceIds || [],
    selectedKnowledgePageIds: activeContextPack?.selectedKnowledgePageIds || [],
    markingCriteria: activeAssignment?.markingCriteriaSummary || activeContextPack?.markingCriteria || "",
    workingThesis: activeContextPack?.workingThesis || "",
    keyClaims: arrayToLines(activeContextPack?.keyClaims || []),
    keyQuotes: arrayToLines(activeContextPack?.keyQuotes || []),
    caseStudies: arrayToLines(activeContextPack?.caseStudies || []),
    missingEvidence: arrayToLines(activeContextPack?.missingEvidence || []),
    draftingInstructions: activeContextPack?.draftingInstructions || "Ground claims in the selected sources. Flag missing evidence rather than inventing support.",
  }));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [savedRecommendations, setSavedRecommendations] = useState<Array<any>>([]);
  const [recGenerating, setRecGenerating] = useState(false);
  const [recFocus, setRecFocus] = useState("");
  const [recMessage, setRecMessage] = useState("");

  const assignmentPacks = activeAssignment
    ? contextPacks.filter((cp) => cp.assignmentId === activeAssignment.id)
    : contextPacks.filter((cp) => !cp.assignmentId);

  async function saveContextPack() {
    setSaving(true);
    setMessage("");
    try {
      const payload: Record<string, unknown> = {
        moduleId: module.id,
        title: packForm.title || "Assessment context pack",
        assessmentQuestion: packForm.assessmentQuestion,
        selectedSourceIds: packForm.selectedSourceIds,
        selectedKnowledgePageIds: packForm.selectedKnowledgePageIds,
        markingCriteria: packForm.markingCriteria,
        workingThesis: packForm.workingThesis,
        keyClaims: linesToArray(packForm.keyClaims),
        keyQuotes: linesToArray(packForm.keyQuotes),
        caseStudies: linesToArray(packForm.caseStudies),
        missingEvidence: linesToArray(packForm.missingEvidence),
        draftingInstructions: packForm.draftingInstructions,
      };
      if (activeAssignment) payload.assignmentId = activeAssignment.id;
      if (activeContextPack) {
        await postPolis("updateContextPack", { contextPackId: activeContextPack.id, ...payload });
      } else {
        await postPolis("createContextPack", payload);
      }
      setMessage("Context pack saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save context pack");
    } finally {
      setSaving(false);
    }
  }

  async function createFromRelevance() {
    if (!activeAssignment) return;
    setGenerating(true);
    setMessage("");
    try {
      await postPolis("createContextPackFromAssignmentRelevance", {
        assignmentId: activeAssignment.id,
        moduleId: module.id,
      });
      setMessage("Context pack created from relevant sources. Reload to see it.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create context pack");
    } finally {
      setGenerating(false);
    }
  }

  async function loadSavedRecommendations() {
    try {
      const data = await postPolis("listSavedExternalSourceRecommendations", {
        moduleId: module.id,
        assignmentId: activeAssignment?.id || undefined,
      });
      setSavedRecommendations(Array.isArray(data) ? data : []);
    } catch {
      setSavedRecommendations([]);
    }
  }

  async function generateRecommendations() {
    setRecGenerating(true);
    setRecMessage("");
    try {
      const result = await postAI("recommendExternalSources", {
        moduleId: module.id,
        assignmentId: activeAssignment?.id || undefined,
        focus: recFocus || undefined,
      });
      setRecMessage(`Generated ${result.created} recommendation(s).${result.warning ? ` ${result.warning}` : ""}`);
      await loadSavedRecommendations();
    } catch (error) {
      setRecMessage(error instanceof Error ? error.message : "Recommendation generation failed");
    } finally {
      setRecGenerating(false);
    }
  }

  async function dismissRecommendation(recId: string) {
    try {
      await postPolis("dismissExternalSourceRecommendation", { recommendationId: recId });
      setSavedRecommendations((prev) => prev.filter((r) => r.id !== recId));
    } catch {}
  }

  useState(() => { loadSavedRecommendations(); });

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {activeAssignment ? `Context: ${activeAssignment.title}` : "Context Packs"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeAssignment
              ? "Build a focused context pack for this assignment using relevant sources and knowledge."
              : "Select an assignment to build focused context, or manage module-level context packs here."}
          </p>
        </div>
        {activeAssignment && (
          <button
            onClick={createFromRelevance}
            disabled={generating}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Create from relevant sources
          </button>
        )}
      </div>

      {activeAssignment && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">{activeAssignment.title}</p>
          </div>
          {activeAssignment.questionOrBrief && (
            <p className="mt-1 text-xs text-blue-800 line-clamp-2">{activeAssignment.questionOrBrief}</p>
          )}
        </div>
      )}

      {!activeAssignment && assignments.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            Select an assignment from the Overview to build assignment-specific context packs. Module-level packs are shown below.
          </p>
        </div>
      )}

      {message && <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{message}</div>}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">
          {activeContextPack ? "Edit context pack" : "Create context pack"}
        </h3>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <input value={packForm.title} onChange={(e) => setPackForm({ ...packForm, title: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Context pack title" />
            <textarea value={packForm.assessmentQuestion} onChange={(e) => setPackForm({ ...packForm, assessmentQuestion: e.target.value })} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Assessment question" />
            <textarea value={packForm.markingCriteria} onChange={(e) => setPackForm({ ...packForm, markingCriteria: e.target.value })} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Marking criteria" />
            <textarea value={packForm.workingThesis} onChange={(e) => setPackForm({ ...packForm, workingThesis: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Working thesis" />
            <textarea value={packForm.draftingInstructions} onChange={(e) => setPackForm({ ...packForm, draftingInstructions: e.target.value })} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Drafting instructions" />
          </div>
          <div className="space-y-3">
            <LinkedCheckboxes title="Selected sources" items={sources.map((source) => ({ id: source.id, label: source.title }))} selectedIds={packForm.selectedSourceIds} onChange={(ids) => setPackForm({ ...packForm, selectedSourceIds: ids })} />
            <textarea value={packForm.keyClaims} onChange={(e) => setPackForm({ ...packForm, keyClaims: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Key claims, one per line" />
            <textarea value={packForm.keyQuotes} onChange={(e) => setPackForm({ ...packForm, keyQuotes: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Key quotes, one per line" />
            <textarea value={packForm.caseStudies} onChange={(e) => setPackForm({ ...packForm, caseStudies: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Case studies, one per line" />
            <textarea value={packForm.missingEvidence} onChange={(e) => setPackForm({ ...packForm, missingEvidence: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Missing evidence, one per line" />
          </div>
        </div>
        <button onClick={saveContextPack} disabled={saving} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
          {saving ? "Saving..." : activeContextPack ? "Save context pack" : "Create context pack"}
        </button>
      </section>

      {assignmentPacks.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            {activeAssignment ? "Assignment context packs" : "Module context packs"} ({assignmentPacks.length})
          </h3>
          {assignmentPacks.map((pack) => (
            <div key={pack.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{pack.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pack.selectedSourceIds.length} sources, {pack.selectedKnowledgePageIds.length} knowledge pages
                  </p>
                  {pack.assessmentQuestion && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{pack.assessmentQuestion}</p>
                  )}
                </div>
                <span className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs",
                  pack.id === activeContextPack?.id ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
                )}>
                  {pack.id === activeContextPack?.id ? "Active" : "Saved"}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Recommended external sources</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeAssignment ? "Recommendations for this assignment." : "Recommendations for this workspace."} These are leads to search for, not uploaded sources.
            </p>
          </div>
          <button
            onClick={generateRecommendations}
            disabled={recGenerating}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {recGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Recommend sources
          </button>
        </div>
        <div className="mt-3">
          <input
            value={recFocus}
            onChange={(e) => setRecFocus(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="e.g. opposing arguments, UK case studies, theory, methods"
          />
        </div>
        {recMessage && <p className="mt-3 text-xs text-muted-foreground">{recMessage}</p>}

        {savedRecommendations.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Saved recommendations ({savedRecommendations.length})</p>
            {savedRecommendations.map((rec: any) => (
              <div key={rec.id} className="flex items-start justify-between gap-3 rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{rec.title}</p>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800 capitalize">{rec.sourceType?.replace(/_/g, " ")}</span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700 capitalize">{rec.recommendedUse?.replace(/_/g, " ")}</span>
                  </div>
                  {rec.authors && <p className="mt-1 text-xs text-muted-foreground">{rec.authors}{rec.year ? ` (${rec.year})` : ""}</p>}
                  {rec.whyUseful && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{rec.whyUseful}</p>}
                  {rec.searchQuery && <p className="mt-1 text-xs text-blue-700">Search: {rec.searchQuery}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  {rec.status !== "imported" && (
                    <button onClick={() => dismissRecommendation(rec.id)} className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200">Dismiss</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : !recGenerating && (
          <p className="mt-3 text-sm text-muted-foreground">No saved recommendations yet. Generate suggestions to find useful external readings.</p>
        )}
      </section>

      {!activeAssignment && (
        <section className="rounded-2xl border border-border bg-card p-8 text-center">
          <Layers3 className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold">No assignment selected</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {sources.length === 0
              ? "Upload sources and set up an assignment in Overview first, then build a focused context pack."
              : "Go to Overview and select an assignment to build a focused context pack. Or create a module-level pack above."}
          </p>
          <Link
            href={`/modules/${module.id}?section=overview`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Go to Overview
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}
    </div>
  );
}

function ModulePlan({
  module,
  sources,
  knowledgePages,
  contextPacks,
  activeContextPack,
  currentPlan,
  activeAssignment,
}: {
  module: PolisModule;
  sources: PolisSource[];
  knowledgePages: KnowledgePage[];
  contextPacks: ContextPack[];
  activeContextPack: ContextPack | null;
  currentPlan: Plan | null;
  activeAssignment: Assignment | null;
}) {
  const [contextPack, setContextPack] = useState<ContextPack | null>(activeContextPack || contextPacks[0] || null);
  const [plan, setPlan] = useState<Plan | null>(currentPlan);
  const [packForm, setPackForm] = useState(() => contextPackForm(contextPack, module));
  const [planForm, setPlanForm] = useState(() => planFormFromPlan(currentPlan, contextPack, module));
  const [savingPack, setSavingPack] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [message, setMessage] = useState("");

  async function saveContextPack() {
    setSavingPack(true);
    setMessage("");
    try {
      const payload: Record<string, unknown> = {
        moduleId: module.id,
        title: packForm.title || "Assessment context pack",
        assessmentQuestion: packForm.assessmentQuestion,
        selectedSourceIds: packForm.selectedSourceIds,
        selectedKnowledgePageIds: packForm.selectedKnowledgePageIds,
        markingCriteria: packForm.markingCriteria,
        workingThesis: packForm.workingThesis,
        keyClaims: linesToArray(packForm.keyClaims),
        keyQuotes: linesToArray(packForm.keyQuotes),
        caseStudies: linesToArray(packForm.caseStudies),
        missingEvidence: linesToArray(packForm.missingEvidence),
        draftingInstructions: packForm.draftingInstructions,
      };
      if (activeAssignment) payload.assignmentId = activeAssignment.id;
      const saved = contextPack
        ? await postPolis("updateContextPack", { contextPackId: contextPack.id, ...payload })
        : await postPolis("createContextPack", payload);
      setContextPack(saved);
      if (!plan) setPlanForm(planFormFromPlan(null, saved, module));
      setMessage("Context pack saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save context pack");
    } finally {
      setSavingPack(false);
    }
  }

  async function savePlan() {
    if (!contextPack) return;
    setSavingPlan(true);
    setMessage("");
    try {
      const payload: Record<string, unknown> = {
        moduleId: module.id,
        contextPackId: contextPack.id,
        title: planForm.title || "Assessment plan",
        thesis: planForm.thesis,
        sections: planForm.sections,
      };
      if (activeAssignment) payload.assignmentId = activeAssignment.id;
      const saved = plan ? await postPolis("updatePlan", { planId: plan.id, ...payload }) : await postPolis("createPlan", payload);
      setPlan(saved);
      setMessage("Plan saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save plan");
    } finally {
      setSavingPlan(false);
    }
  }

  function addSection() {
    setPlanForm({
      ...planForm,
      sections: [
        ...planForm.sections,
        {
          id: crypto.randomUUID(),
          title: `Section ${planForm.sections.length + 1}`,
          purpose: "",
          claim: "",
          evidenceSourceIds: [],
          knowledgePageIds: [],
          counterargument: "",
          evaluation: "",
          wordCount: 0,
          notes: "",
        },
      ],
    });
  }

  function updateSection(sectionId: string, patch: Partial<PlanSection>) {
    setPlanForm({ ...planForm, sections: planForm.sections.map((section) => section.id === sectionId ? { ...section, ...patch } : section) });
  }

  return (
    <div className="max-w-7xl space-y-6">
      {activeAssignment && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">Planning for: {activeAssignment.title}</p>
          </div>
          {activeAssignment.questionOrBrief && (
            <p className="mt-1 text-xs text-blue-800 line-clamp-2">{activeAssignment.questionOrBrief}</p>
          )}
        </div>
      )}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Active Context Pack</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Create a context pack before planning. A context pack selects the sources and knowledge pages that matter for this assessment.</p>
          </div>
          {contextPack && <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">{contextPack.selectedSourceIds.length} sources, {contextPack.selectedKnowledgePageIds.length} pages</span>}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <input value={packForm.title} onChange={(e) => setPackForm({ ...packForm, title: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Context pack title" />
            <textarea value={packForm.assessmentQuestion} onChange={(e) => setPackForm({ ...packForm, assessmentQuestion: e.target.value })} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Assessment question" />
            <textarea value={packForm.markingCriteria} onChange={(e) => setPackForm({ ...packForm, markingCriteria: e.target.value })} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Marking criteria" />
            <textarea value={packForm.workingThesis} onChange={(e) => setPackForm({ ...packForm, workingThesis: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Working thesis" />
            <textarea value={packForm.draftingInstructions} onChange={(e) => setPackForm({ ...packForm, draftingInstructions: e.target.value })} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Drafting instructions" />
          </div>
          <div className="space-y-3">
            <LinkedCheckboxes title="Selected sources" items={sources.map((source) => ({ id: source.id, label: source.title }))} selectedIds={packForm.selectedSourceIds} onChange={(ids) => setPackForm({ ...packForm, selectedSourceIds: ids })} />
            <LinkedCheckboxes title="Selected knowledge pages" items={knowledgePages.map((page) => ({ id: page.id, label: page.title }))} selectedIds={packForm.selectedKnowledgePageIds} onChange={(ids) => setPackForm({ ...packForm, selectedKnowledgePageIds: ids })} />
            <textarea value={packForm.keyClaims} onChange={(e) => setPackForm({ ...packForm, keyClaims: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Key claims, one per line" />
            <textarea value={packForm.keyQuotes} onChange={(e) => setPackForm({ ...packForm, keyQuotes: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Key quotes, one per line" />
            <textarea value={packForm.caseStudies} onChange={(e) => setPackForm({ ...packForm, caseStudies: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Case studies, one per line" />
            <textarea value={packForm.missingEvidence} onChange={(e) => setPackForm({ ...packForm, missingEvidence: e.target.value })} className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Missing evidence, one per line" />
          </div>
        </div>
        <button onClick={saveContextPack} disabled={savingPack} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">{savingPack ? "Saving..." : contextPack ? "Save context pack" : "Create context pack"}</button>
      </section>

      {contextPack ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Plan</h2>
              <p className="mt-1 text-sm text-muted-foreground">Build a structured plan from the active context pack. Sections can link evidence sources and knowledge pages.</p>
            </div>
            <button onClick={addSection} className="inline-flex w-fit items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"><Plus className="h-4 w-4" />Add section</button>
          </div>
          <div className="mt-5 space-y-4">
            <input value={planForm.title} onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Plan title" />
            <textarea value={planForm.thesis} onChange={(e) => setPlanForm({ ...planForm, thesis: e.target.value })} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Thesis" />
            {planForm.sections.map((section, index) => (
              <article key={section.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Section {index + 1}</h3>
                  <button onClick={() => setPlanForm({ ...planForm, sections: planForm.sections.filter((item) => item.id !== section.id) })} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <input value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Section title" />
                  <input type="number" value={section.wordCount || ""} onChange={(e) => updateSection(section.id, { wordCount: Number(e.target.value) })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Word count" />
                  <textarea value={section.purpose} onChange={(e) => updateSection(section.id, { purpose: e.target.value })} className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Purpose" />
                  <textarea value={section.claim} onChange={(e) => updateSection(section.id, { claim: e.target.value })} className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Claim" />
                  <textarea value={section.counterargument} onChange={(e) => updateSection(section.id, { counterargument: e.target.value })} className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Counterargument" />
                  <textarea value={section.evaluation} onChange={(e) => updateSection(section.id, { evaluation: e.target.value })} className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Evaluation" />
                  <textarea value={section.notes} onChange={(e) => updateSection(section.id, { notes: e.target.value })} className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm lg:col-span-2" placeholder="Notes" />
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <LinkedCheckboxes title="Evidence sources" items={sources.filter((source) => contextPack.selectedSourceIds.includes(source.id)).map((source) => ({ id: source.id, label: source.title }))} selectedIds={section.evidenceSourceIds} onChange={(ids) => updateSection(section.id, { evidenceSourceIds: ids })} />
                  <LinkedCheckboxes title="Knowledge pages" items={knowledgePages.filter((page) => contextPack.selectedKnowledgePageIds.includes(page.id)).map((page) => ({ id: page.id, label: page.title }))} selectedIds={section.knowledgePageIds} onChange={(ids) => updateSection(section.id, { knowledgePageIds: ids })} />
                </div>
              </article>
            ))}
            {planForm.sections.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Add sections for introduction, argument blocks, counterarguments, and conclusion.</div>}
            <button onClick={savePlan} disabled={savingPlan} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">{savingPlan ? "Saving..." : plan ? "Save plan" : "Create plan"}</button>
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 text-sm font-semibold">Create a context pack first</h2>
          <p className="mt-1 text-sm text-muted-foreground">The plan is powered by a selected bundle of sources and knowledge pages.</p>
        </div>
      )}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

function contextPackForm(contextPack: ContextPack | null, module: PolisModule) {
  return {
    title: contextPack?.title || `${module.code} assessment context`,
    assessmentQuestion: contextPack?.assessmentQuestion || module.assessmentQuestion,
    selectedSourceIds: contextPack?.selectedSourceIds || [],
    selectedKnowledgePageIds: contextPack?.selectedKnowledgePageIds || [],
    markingCriteria: contextPack?.markingCriteria || "",
    workingThesis: contextPack?.workingThesis || "",
    keyClaims: arrayToLines(contextPack?.keyClaims || []),
    keyQuotes: arrayToLines(contextPack?.keyQuotes || []),
    caseStudies: arrayToLines(contextPack?.caseStudies || []),
    missingEvidence: arrayToLines(contextPack?.missingEvidence || []),
    draftingInstructions: contextPack?.draftingInstructions || "Ground claims in the selected sources. Flag missing evidence rather than inventing support.",
  };
}

function planFormFromPlan(plan: Plan | null, contextPack: ContextPack | null, module: PolisModule) {
  return {
    title: plan?.title || `${module.code} assessment plan`,
    thesis: plan?.thesis || contextPack?.workingThesis || "",
    sections: plan?.sections || [],
  };
}

function ModuleDraft({ module, contextPack, plan, initialDraft, activeAssignment }: { module: PolisModule; contextPack: ContextPack | null; plan: Plan | null; initialDraft: Draft | null; activeAssignment: Assignment | null }) {
  const [draft, setDraft] = useState<Draft | null>(initialDraft);
  const [title, setTitle] = useState(initialDraft?.title || (activeAssignment ? `${activeAssignment.title} draft` : `${module.code} draft`));
  const [content, setContent] = useState(initialDraft?.content || "");
  const [status, setStatus] = useState<DraftStatus>(initialDraft?.status || "rough");
  const [saving, setSaving] = useState(false);
  const [toolLoading, setToolLoading] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState("");
  const ready = !!contextPack && !!plan;

  async function saveDraft() {
    if (!contextPack || !plan) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { moduleId: module.id, contextPackId: contextPack.id, planId: plan.id, title, content, status };
      if (activeAssignment) payload.assignmentId = activeAssignment.id;
      const saved = draft ? await postPolis("updateDraft", { draftId: draft.id, ...payload }) : await postPolis("createDraft", payload);
      setDraft(saved);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save draft");
    } finally {
      setSaving(false);
    }
  }

  async function runTool(kind: "citation" | "review") {
    if (!content.trim()) return;
    setToolLoading(kind);
    setToolResult("");
    try {
      const res = await fetch(kind === "citation" ? "/api/tools/citation-check" : "/api/tools/draft-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: content,
          moduleId: module.id,
          question: contextPack?.assessmentQuestion || module.assessmentQuestion,
          rubric: contextPack?.markingCriteria,
        }),
      });
      const data = await res.json();
      setToolResult(data.result ? JSON.stringify(data.result, null, 2) : data.error || JSON.stringify(data, null, 2));
    } catch {
      setToolResult("Tool request failed. Check that an AI provider is configured.");
    } finally {
      setToolLoading(null);
    }
  }

  if (!ready) {
    return (
      <div className="max-w-4xl rounded-2xl border border-border bg-card p-12 text-center">
        <Pencil className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 text-sm font-semibold">Build a plan before drafting</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Build a plan first, then draft sections from the plan with your sources visible.</p>
        <Link href={`/modules/${module.id}?section=plan`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Go to Plan <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeAssignment && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">Drafting for: {activeAssignment.title}</p>
          </div>
          {activeAssignment.questionOrBrief && (
            <p className="mt-1 text-xs text-blue-800 line-clamp-2">{activeAssignment.questionOrBrief}</p>
          )}
        </div>
      )}
    <div className="grid max-w-7xl gap-6 xl:grid-cols-[1fr_22rem]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Draft title" />
            <select value={status} onChange={(e) => setStatus(e.target.value as DraftStatus)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {(["rough", "revised", "final"] as DraftStatus[]).map((item) => <option key={item} value={item}>{draftStatusLabel(item)}</option>)}
            </select>
          </div>
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
            <p className="font-medium">Question</p>
            <p className="mt-1">{contextPack.assessmentQuestion || module.assessmentQuestion || "No assessment question set."}</p>
            {contextPack.workingThesis && <p className="mt-2"><span className="font-medium">Working thesis:</span> {contextPack.workingThesis}</p>}
          </div>
          <div className="mt-4 rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
              <span>{wordCount(content)} words</span>
              <span>{saving ? "Saving..." : draft ? `Saved ${safeDate(draft.updatedAt)}` : "Unsaved draft"}</span>
            </div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[520px] w-full resize-y bg-transparent p-4 text-sm leading-relaxed focus:outline-none" placeholder="Write your draft here. Use the plan and context pack alongside it." />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={saveDraft} disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">{saving ? "Saving..." : "Save draft"}</button>
            <button onClick={() => runTool("citation")} disabled={!!toolLoading || !content.trim()} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"><ShieldCheck className="h-4 w-4" />Check citations</button>
            <button onClick={() => runTool("review")} disabled={!!toolLoading || !content.trim()} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"><Sparkles className="h-4 w-4" />Review draft</button>
          </div>
          {toolLoading && <p className="mt-3 text-sm text-muted-foreground">Running {toolLoading === "citation" ? "citation check" : "draft review"}...</p>}
          {toolResult && <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 text-xs whitespace-pre-wrap">{toolResult}</pre>}
        </div>
      </section>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Context Pack</h3>
          <p className="mt-2 text-sm text-muted-foreground">{contextPack.title}</p>
          <p className="mt-2 text-xs text-muted-foreground">{contextPack.selectedSourceIds.length} sources and {contextPack.selectedKnowledgePageIds.length} knowledge pages selected.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Plan sections</h3>
          <div className="mt-3 space-y-2">
            {plan.sections.map((section, index) => (
              <div key={section.id} className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">{index + 1}. {section.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{section.claim || section.purpose || "No claim yet."}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
    </div>
  );
}

function ModuleFinal({ module, sources, contextPack, draft, initialFeedback, activeAssignment }: { module: PolisModule; sources: PolisSource[]; contextPack: ContextPack | null; draft: Draft | null; initialFeedback: Feedback[]; activeAssignment: Assignment | null }) {
  const [feedback, setFeedback] = useState<Feedback | null>(initialFeedback[0] || null);
  const [content, setContent] = useState(initialFeedback[0]?.content || "");
  const [tasks, setTasks] = useState<RevisionTask[]>(initialFeedback[0]?.revisionTasks || []);
  const [taskText, setTaskText] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedSources = contextPack ? sources.filter((source) => contextPack.selectedSourceIds.includes(source.id)) : [];

  async function saveFeedback() {
    if (!draft) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { moduleId: module.id, draftId: draft.id, content, revisionTasks: tasks };
      if (activeAssignment) payload.assignmentId = activeAssignment.id;
      const saved = feedback ? await postPolis("updateFeedback", { feedbackId: feedback.id, ...payload }) : await postPolis("createFeedback", payload);
      setFeedback(saved);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save feedback");
    } finally {
      setSaving(false);
    }
  }

  function addTask() {
    if (!taskText.trim()) return;
    setTasks([...tasks, { id: crypto.randomUUID(), text: taskText.trim(), completed: false }]);
    setTaskText("");
  }

  function exportMarkdown() {
    if (!draft) return;
    const references = selectedSources.map((source) => `- ${source.citation || `${source.author}${source.year ? ` (${source.year})` : ""}. ${source.title}`}`).join("\n");
    const markdown = `# ${draft.title}\n\nStatus: ${draftStatusLabel(draft.status)}\n\n## Draft\n\n${draft.content}\n\n## Reference Basis\n\n${references || "No selected sources."}\n`;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "polis-draft"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!draft) {
    return (
      <div className="max-w-4xl rounded-2xl border border-border bg-card p-12 text-center">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 text-sm font-semibold">No draft to finalise yet</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Use this area for final revision, references, feedback, and export once your draft is ready.</p>
        <Link href={`/modules/${module.id}?section=draft`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Go to Draft <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeAssignment && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">Reviewing: {activeAssignment.title}</p>
          </div>
          {activeAssignment.questionOrBrief && (
            <p className="mt-1 text-xs text-blue-800 line-clamp-2">{activeAssignment.questionOrBrief}</p>
          )}
        </div>
      )}
    <div className="grid max-w-7xl gap-6 xl:grid-cols-[1fr_24rem]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Final revision</h2>
              <p className="mt-1 text-sm text-muted-foreground">Current draft status: {draftStatusLabel(draft.status)}</p>
            </div>
            <button onClick={exportMarkdown} className="inline-flex w-fit items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"><Download className="h-4 w-4" />Export Markdown</button>
          </div>
          <div className="mt-4 max-h-[520px] overflow-y-auto rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap scrollbar-thin">{draft.content || "Draft is empty."}</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Feedback and revision tasks</h3>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-3 min-h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Paste tutor feedback or write your own revision notes." />
          <div className="mt-3 flex gap-2">
            <input value={taskText} onChange={(e) => setTaskText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTask(); }} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Add a revision task" />
            <button onClick={addTask} className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Add</button>
          </div>
          <div className="mt-3 space-y-2">
            {tasks.map((task) => (
              <label key={task.id} className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
                <input type="checkbox" checked={task.completed} onChange={(e) => setTasks(tasks.map((item) => item.id === task.id ? { ...item, completed: e.target.checked } : item))} className="mt-1" />
                <span className={cn(task.completed && "line-through text-muted-foreground")}>{task.text}</span>
              </label>
            ))}
          </div>
          <button onClick={saveFeedback} disabled={saving} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">{saving ? "Saving..." : "Save feedback"}</button>
        </div>
      </section>
      <aside className="rounded-2xl border border-border bg-card p-5 xl:sticky xl:top-20 xl:h-fit">
        <h3 className="text-sm font-semibold">Reference list basis</h3>
        <p className="mt-1 text-xs text-muted-foreground">Selected sources from the active context pack.</p>
        <div className="mt-4 space-y-3">
          {selectedSources.map((source) => (
            <div key={source.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium leading-tight">{source.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{source.citation || `${source.author}${source.year ? ` (${source.year})` : ""}`}</p>
            </div>
          ))}
          {selectedSources.length === 0 && <p className="text-sm text-muted-foreground">No selected sources yet. Build a context pack first.</p>}
        </div>
      </aside>
    </div>
    </div>
  );
}
