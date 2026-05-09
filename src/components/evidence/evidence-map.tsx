"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  Quote,
  Search,
  Layers,
  Plus,
  Trash2,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Argument, EvidenceLink, EvidenceStrength, SourceFile } from "@/lib/types";

type EvidenceRole = "supports" | "complicates" | "contradicts" | "defines" | "contextualises";

const ROLE_META: Record<
  EvidenceRole,
  { label: string; colour: string; bgColour: string; borderColour: string }
> = {
  supports: {
    label: "Supports",
    colour: "text-success",
    bgColour: "bg-success/10",
    borderColour: "border-success/30",
  },
  complicates: {
    label: "Complicates",
    colour: "text-warning",
    bgColour: "bg-warning/10",
    borderColour: "border-warning/30",
  },
  contradicts: {
    label: "Contradicts",
    colour: "text-danger",
    bgColour: "bg-danger/10",
    borderColour: "border-danger/30",
  },
  defines: {
    label: "Defines",
    colour: "text-source",
    bgColour: "bg-source/10",
    borderColour: "border-source/30",
  },
  contextualises: {
    label: "Contextualises",
    colour: "text-interpretation",
    bgColour: "bg-interpretation/10",
    borderColour: "border-interpretation/30",
  },
};

const STRENGTH_META: Record<EvidenceStrength, { label: string; icon: React.ElementType; colour: string }> = {
  strong: { label: "Strong", icon: ArrowUp, colour: "text-success" },
  moderate: { label: "Moderate", icon: Minus, colour: "text-warning" },
  weak: { label: "Weak", icon: ArrowDown, colour: "text-danger" },
};

const EVIDENCE_ROLES: EvidenceRole[] = ["supports", "complicates", "contradicts", "defines", "contextualises"];

function inferRole(link: EvidenceLink): EvidenceRole {
  const usage = link.usage.toLowerCase();
  if (usage.includes("contradict") || usage.includes("challenges")) return "contradicts";
  if (usage.includes("complicate") || usage.includes("qualification") || usage.includes("limitation")) return "complicates";
  if (usage.includes("defin") || usage.includes("concept")) return "defines";
  if (usage.includes("context") || usage.includes("background")) return "contextualises";
  return "supports";
}

interface EvidenceCardProps {
  link: EvidenceLink;
  role: EvidenceRole;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onStrengthChange: (strength: EvidenceStrength) => void;
  onRoleChange: (role: EvidenceRole) => void;
  onRationaleChange: (rationale: string) => void;
}

function EvidenceCard({ link, role, isExpanded, onToggle, onRemove, onStrengthChange, onRoleChange, onRationaleChange }: EvidenceCardProps) {
  const roleMeta = ROLE_META[role];
  const strengthMeta = STRENGTH_META[link.strength];
  const StrengthIcon = strengthMeta.icon;

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        isExpanded ? roleMeta.borderColour + " " + roleMeta.bgColour : "border-border bg-card"
      )}
    >
      <button
        id={`evidence-card-${link.id}`}
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <Quote className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{link.sourceTitle}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{link.pageRange}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                roleMeta.bgColour,
                roleMeta.borderColour,
                roleMeta.colour
              )}
            >
              {roleMeta.label}
            </span>
            <span className={cn("inline-flex items-center gap-1 text-xs font-medium", strengthMeta.colour)}>
              <StrengthIcon className="h-3 w-3" />
              {strengthMeta.label}
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3 mt-0">
          <blockquote className="italic text-sm leading-relaxed text-foreground/80 border-l-2 border-accent/40 pl-3">
            &ldquo;{link.quote}&rdquo;
          </blockquote>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Use: </span>
            {link.usage}
          </p>

          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Evidence role</p>
              <div className="flex flex-wrap gap-1.5">
                {EVIDENCE_ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRoleChange(r)}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium border transition-colors",
                      r === role
                        ? ROLE_META[r].bgColour + " " + ROLE_META[r].borderColour + " " + ROLE_META[r].colour
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {ROLE_META[r].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Strength</p>
              <div className="flex gap-1.5">
                {(["strong", "moderate", "weak"] as EvidenceStrength[]).map((s) => {
                  const m = STRENGTH_META[s];
                  return (
                    <button
                      key={s}
                      onClick={() => onStrengthChange(s)}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium border transition-colors",
                        link.strength === s ? m.colour + " " + "border-current" : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Strength rationale</p>
              <textarea
                value={link.usage}
                onChange={(e) => onRationaleChange(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Why this strength rating?"
              />
            </div>
          </div>

          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 text-xs text-danger hover:text-danger/80 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Remove evidence link
          </button>
        </div>
      )}
    </div>
  );
}

interface ClaimGroupProps {
  argument: Argument;
  onAddClaim: () => void;
  onDeleteClaim: () => void;
  onEditClaim: (claim: string) => void;
  onLinkEvidence: () => void;
  onRemoveEvidence: (evidenceLinkId: string) => void;
  onStrengthChange: (evidenceLinkId: string, strength: EvidenceStrength) => void;
  onUsageChange: (evidenceLinkId: string, usage: string) => void;
}

function ClaimGroup({ argument, onDeleteClaim, onEditClaim, onLinkEvidence, onRemoveEvidence, onStrengthChange, onUsageChange }: ClaimGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const [expandedLinks, setExpandedLinks] = useState<Set<string>>(new Set());
  const [editingClaim, setEditingClaim] = useState(false);
  const [claimDraft, setClaimDraft] = useState(argument.claim);

  const toggleLink = (id: string) =>
    setExpandedLinks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
      <button
        id={`claim-group-${argument.id}`}
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 mt-0.5">
          <span className="text-xs font-bold text-accent">{argument.sortOrder}</span>
        </div>
        <div className="flex-1 min-w-0">
          {editingClaim ? (
            <div onClick={(e) => e.stopPropagation()}>
              <textarea
                value={claimDraft}
                onChange={(e) => setClaimDraft(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="State your claim…"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onEditClaim(claimDraft); setEditingClaim(false); }}
                  className="text-xs font-medium px-3 py-1 rounded-lg bg-accent text-accent-foreground"
                >
                  Save
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingClaim(false); setClaimDraft(argument.claim); }}
                  className="text-xs font-medium px-3 py-1 rounded-lg border border-border text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground leading-snug">{argument.claim}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {argument.evidenceLinks.length} evidence item{argument.evidenceLinks.length !== 1 ? "s" : ""} linked
              </p>
            </>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-border">
          <div className="flex items-center gap-2 pt-3">
            {!editingClaim && (
              <button
                onClick={() => setEditingClaim(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Edit claim
              </button>
            )}
            <button
              onClick={onDeleteClaim}
              className="flex items-center gap-1 text-xs text-danger hover:text-danger/80 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>

          {argument.evidenceLinks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-8 text-center mt-3">
              <Quote className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No evidence linked to this claim yet.</p>
              <button
                onClick={onLinkEvidence}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted/60 transition-colors"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Link evidence
              </button>
            </div>
          ) : (
            <div className="pt-3 space-y-2">
              {argument.evidenceLinks.map((link) => (
                <EvidenceCard
                  key={link.id}
                  link={link}
                  role={inferRole(link)}
                  isExpanded={expandedLinks.has(link.id)}
                  onToggle={() => toggleLink(link.id)}
                  onRemove={() => onRemoveEvidence(link.id)}
                  onStrengthChange={(s) => onStrengthChange(link.id, s)}
                  onRoleChange={() => {}}
                  onRationaleChange={(r) => onUsageChange(link.id, r)}
                />
              ))}
              <button
                onClick={onLinkEvidence}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                <Plus className="h-3 w-3" />
                Link more evidence
              </button>
            </div>
          )}

          {argument.synthesis && (
            <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 mt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">Synthesis note</p>
              <p className="text-sm text-foreground leading-relaxed">{argument.synthesis}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface EvidenceGapBannerProps {
  gaps: string[];
}

function EvidenceGapBanner({ gaps }: EvidenceGapBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || gaps.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-2">Evidence gaps identified</p>
          <ul className="space-y-1.5">
            {gaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-warning flex-shrink-0" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

interface LinkEvidenceModalProps {
  argumentId: string;
  assignmentConvexId: string;
  sources: SourceFile[];
  onClose: () => void;
}

function LinkEvidenceModal({ argumentId, sources, onClose }: LinkEvidenceModalProps) {
  const createLink = useMutation(api.evidence.create);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [quote, setQuote] = useState("");
  const [pageRange, setPageRange] = useState("");
  const [usage, setUsage] = useState("");
  const [strength, setStrength] = useState<EvidenceStrength>("moderate");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedSourceId) return;
    setSubmitting(true);
    try {
      await createLink({
        argumentId: argumentId as Id<"arguments">,
        sourceId: selectedSourceId as Id<"sources">,
        quote: quote || undefined,
        pageRange: pageRange || undefined,
        usage: usage || undefined,
        strength,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Link evidence from source</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Source</label>
            <select
              value={selectedSourceId ?? ""}
              onChange={(e) => setSelectedSourceId(e.target.value || null)}
              className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">Select a source…</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.title} — {s.author}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Relevant quote</label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Paste or type the relevant passage…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Page range</label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="e.g. pp. 23-27"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Strength</label>
              <select
                value={strength}
                onChange={(e) => setStrength(e.target.value as EvidenceStrength)}
                className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="strong">Strong</option>
                <option value="moderate">Moderate</option>
                <option value="weak">Weak</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">How this evidence is used (determines role)</label>
            <textarea
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="e.g. Supports the claim by showing… / Contradicts… / Defines the concept of…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedSourceId || submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-accent-foreground disabled:opacity-50"
            >
              {submitting ? "Linking…" : "Link evidence"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NewClaimFormProps {
  assignmentConvexId: string;
  onClose: () => void;
}

function NewClaimForm({ assignmentConvexId, onClose }: NewClaimFormProps) {
  const createArg = useMutation(api.arguments.create);
  const [claim, setClaim] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!claim.trim()) return;
    setSubmitting(true);
    try {
      await createArg({
        assignmentId: assignmentConvexId as Id<"assignments">,
        claim,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <h4 className="text-sm font-semibold text-foreground">New claim</h4>
      <textarea
        id="new-claim-input"
        value={claim}
        onChange={(e) => setClaim(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
        placeholder="State the claim you want to argue…"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!claim.trim() || submitting}
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-accent text-accent-foreground disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Add claim"}
        </button>
      </div>
    </div>
  );
}

interface EvidenceMapProps {
  arguments: Argument[];
  evidenceGaps: string[];
  assignmentConvexId: string;
  assignmentSources: SourceFile[];
}

export function EvidenceMap({ arguments: args, evidenceGaps, assignmentConvexId, assignmentSources }: EvidenceMapProps) {
  const [filterText, setFilterText] = useState("");
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [linkingArgumentId, setLinkingArgumentId] = useState<string | null>(null);

  const deleteArg = useMutation(api.arguments.remove);
  const updateArg = useMutation(api.arguments.update);
  const removeEvidence = useMutation(api.evidence.remove);
  const updateEvidence = useMutation(api.evidence.update);

  const filtered = args.filter(
    (a) =>
      filterText === "" ||
      a.claim.toLowerCase().includes(filterText.toLowerCase()) ||
      a.evidenceLinks.some(
        (l) =>
          l.sourceTitle.toLowerCase().includes(filterText.toLowerCase()) ||
          l.usage.toLowerCase().includes(filterText.toLowerCase())
      )
  );

  const totalEvidence = args.reduce((sum, a) => sum + a.evidenceLinks.length, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{args.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Claims mapped</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{totalEvidence}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Evidence items</p>
        </div>
        <div
          className={cn(
            "rounded-xl border p-3 text-center",
            evidenceGaps.length > 0 ? "border-warning/30 bg-warning/5" : "border-border bg-card"
          )}
        >
          <p className={cn("text-2xl font-bold", evidenceGaps.length > 0 ? "text-warning" : "text-foreground")}>
            {evidenceGaps.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Gaps found</p>
        </div>
      </div>

      <EvidenceGapBanner gaps={evidenceGaps} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          id="evidence-map-filter"
          type="text"
          placeholder="Filter by claim, source, or usage…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role:</span>
        {(Object.keys(ROLE_META) as EvidenceRole[]).map((role) => {
          const meta = ROLE_META[role];
          return (
            <span
              key={role}
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                meta.bgColour,
                meta.borderColour,
                meta.colour
              )}
            >
              {meta.label}
            </span>
          );
        })}
      </div>

      {filtered.length === 0 && !showNewClaim ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            {args.length === 0
              ? "No claims yet. Map your first argument claim to begin organising evidence."
              : "No claims match your filter."}
          </p>
          {args.length === 0 && (
            <button
              onClick={() => setShowNewClaim(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted/60 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add first claim
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((arg) => (
            <ClaimGroup
              key={arg.id}
              argument={arg}
              onAddClaim={() => setShowNewClaim(true)}
              onDeleteClaim={() => deleteArg({ argumentId: arg.id as Id<"arguments"> })}
              onEditClaim={(claim) => updateArg({ argumentId: arg.id as Id<"arguments">, claim })}
              onLinkEvidence={() => setLinkingArgumentId(arg.id)}
              onRemoveEvidence={(linkId) => removeEvidence({ evidenceLinkId: linkId as Id<"evidenceLinks"> })}
              onStrengthChange={(linkId, strength) => updateEvidence({ evidenceLinkId: linkId as Id<"evidenceLinks">, strength })}
              onUsageChange={(linkId, usage) => updateEvidence({ evidenceLinkId: linkId as Id<"evidenceLinks">, usage })}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          id="add-argument"
          onClick={() => setShowNewClaim(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-muted/60 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add claim
        </button>
      </div>

      {showNewClaim && (
        <NewClaimForm
          assignmentConvexId={assignmentConvexId}
          onClose={() => setShowNewClaim(false)}
        />
      )}

      {linkingArgumentId && (
        <LinkEvidenceModal
          argumentId={linkingArgumentId}
          assignmentConvexId={assignmentConvexId}
          sources={assignmentSources}
          onClose={() => setLinkingArgumentId(null)}
        />
      )}
    </div>
  );
}
