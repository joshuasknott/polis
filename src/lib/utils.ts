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
    essay_brief: "Essay Brief",
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
    processed: "bg-green-100 text-green-800",
    processing: "bg-blue-100 text-blue-800",
    needs_review: "bg-amber-100 text-amber-800",
    failed: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-stone-100 text-stone-800";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    processed: "Processed",
    processing: "Processing",
    needs_review: "Needs Review",
    failed: "Failed",
  };
  return labels[status] || status;
}

export function getEssayStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    planning: "Planning",
    drafting: "Drafting",
    reviewing: "Reviewing",
    revising: "Revising",
    submitted: "Submitted",
  };
  return labels[status] || status;
}

export function getEssayStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planning: "bg-blue-100 text-blue-800",
    drafting: "bg-amber-100 text-amber-800",
    reviewing: "bg-purple-100 text-purple-800",
    revising: "bg-orange-100 text-orange-800",
    submitted: "bg-green-100 text-green-800",
  };
  return colors[status] || "bg-stone-100 text-stone-800";
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
