"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Argument, EvidenceLink, EvidenceStrength } from "@/lib/types";

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
}

function EvidenceCard({ link, role, isExpanded, onToggle }: EvidenceCardProps) {
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
        </div>
      )}
    </div>
  );
}

interface ClaimGroupProps {
  argument: Argument;
}

function ClaimGroup({ argument }: ClaimGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const [expandedLinks, setExpandedLinks] = useState<Set<string>>(new Set());

  const toggleLink = (id: string) =>
    setExpandedLinks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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
          <p className="text-sm font-semibold text-foreground leading-snug">{argument.claim}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {argument.evidenceLinks.length} evidence item{argument.evidenceLinks.length !== 1 ? "s" : ""} linked
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-border">
          {argument.evidenceLinks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-8 text-center mt-3">
              <Quote className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No evidence linked to this claim yet.</p>
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
                />
              ))}
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

interface EvidenceMapProps {
  arguments: Argument[];
  evidenceGaps: string[];
}

export function EvidenceMap({ arguments: args, evidenceGaps }: EvidenceMapProps) {
  const [filterText, setFilterText] = useState("");

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
      {/* Stats strip */}
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

      {/* Gap banner */}
      <EvidenceGapBanner gaps={evidenceGaps} />

      {/* Filter */}
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

      {/* Legend */}
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

      {/* Claims */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No claims match your filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((arg) => (
            <ClaimGroup key={arg.id} argument={arg} />
          ))}
        </div>
      )}
    </div>
  );
}
