export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "...";
}

export function getSourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    journal_article: "Journal Article",
    book_chapter: "Book Chapter",
    book: "Book",
    lecture_slides: "Lecture Slides",
    module_handbook: "Module Handbook",
    assignment_brief: "Assignment Brief",
    marking_rubric: "Marking Rubric",
    seminar_notes: "Seminar Notes",
    draft: "Draft",
    report: "Report",
    news_article: "News Article",
  };
  return labels[type] || type;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    processed: "bg-success/10 text-success",
    processing: "bg-accent/10 text-accent",
    needs_review: "bg-warning/10 text-warning",
    failed: "bg-danger/10 text-danger",
    uploading: "bg-muted text-muted-foreground",
    queued: "bg-accent/10 text-accent",
    extracting: "bg-accent/10 text-accent",
    chunking: "bg-accent/10 text-accent",
    placeholder: "bg-muted text-muted-foreground",
  };
  return colors[status] || "bg-muted text-muted-foreground";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    processed: "Processed",
    processing: "Processing",
    needs_review: "Needs Review",
    failed: "Failed",
    uploading: "Uploading",
    queued: "Queued",
    extracting: "Extracting",
    chunking: "Chunking",
    placeholder: "Placeholder",
  };
  return labels[status] || status;
}

export function getProductionStageLabel(status: string): string {
  const labels: Record<string, string> = {
    ingest: "Ingest",
    understand: "Understand",
    map: "Map",
    judge: "Judge",
    build: "Build",
    draft: "Draft",
    refine: "Refine",
  };
  return labels[status] || status;
}

export function getProductionStageColor(status: string): string {
  const colors: Record<string, string> = {
    ingest: "bg-muted text-muted-foreground",
    understand: "bg-accent/10 text-accent",
    map: "bg-source/10 text-source",
    judge: "bg-warning/10 text-warning",
    build: "bg-interpretation/10 text-interpretation",
    draft: "bg-warning/20 text-warning",
    refine: "bg-success/10 text-success",
  };
  return colors[status] || "bg-muted text-muted-foreground";
}

export function daysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / 86400000);
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

export type DeadlineUrgency = "overdue" | "imminent" | "soon" | "upcoming" | "none";

export function getDeadlineUrgency(dateString: string | null | undefined): DeadlineUrgency {
  if (!dateString) return "none";
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return "none";
  const diffDays = Math.ceil((target.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "imminent";
  if (diffDays <= 14) return "soon";
  return "upcoming";
}

export function getDeadlineUrgencyClasses(urgency: DeadlineUrgency): string {
  switch (urgency) {
    case "overdue":
      return "bg-danger/10 text-danger border-danger/30";
    case "imminent":
      return "bg-warning/15 text-warning border-warning/40";
    case "soon":
      return "bg-accent/10 text-accent border-accent/25";
    case "upcoming":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function getDeadlineLabel(urgency: DeadlineUrgency, dateString: string | null | undefined): string {
  if (!dateString) return "No due date";
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return "No due date";
  const diffDays = Math.ceil((target.getTime() - Date.now()) / 86400000);
  const formatted = formatDate(dateString);
  if (urgency === "overdue") {
    return `Overdue · ${formatted}`;
  }
  if (diffDays === 0) return `Due today · ${formatted}`;
  if (diffDays === 1) return `Due tomorrow · ${formatted}`;
  if (diffDays <= 14) return `Due in ${diffDays}d · ${formatted}`;
  return formatted;
}

export function getRubricWeightTotal(
  rubric: Array<{ weight: number }> | null | undefined,
): number {
  if (!rubric || rubric.length === 0) return 0;
  return rubric.reduce((sum, criterion) => sum + (criterion.weight || 0), 0);
}

export function getSourceCoverageLabel(selected: number, total: number): string {
  if (total === 0) return "No sources in workspace";
  if (selected === 0) return "No sources selected";
  const pct = Math.round((selected / total) * 100);
  return `${selected} of ${total} sources (${pct}%)`;
}

export function getSourceCoverageTone(selected: number, total: number): "low" | "medium" | "good" | "none" {
  if (total === 0 || selected === 0) return "none";
  const pct = selected / total;
  if (pct <= 0.1) return "low";
  if (pct <= 0.3) return "medium";
  return "good";
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function groupByDateKey(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toISOString().slice(0, 10);
}

export function formatBatchLabel(dateKey: string): string {
  if (dateKey === "unknown") return "Unsorted imports";
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
