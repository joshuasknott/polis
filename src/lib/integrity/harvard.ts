export interface HarvardCitationInput {
  authors?: string | null;
  year?: number | null;
  pageStart?: number | null;
  pageEnd?: number | null;
}

export interface HarvardCitationResult {
  citation: string;
  warnings: string[];
}

export function renderHarvardInText(input: HarvardCitationInput): HarvardCitationResult {
  const warnings: string[] = [];

  const authorStr = buildAuthorStr(input.authors, warnings);
  const yearStr = buildYearStr(input.year, warnings);
  const pageStr = buildPageStr(input.pageStart ?? null, input.pageEnd ?? null);

  if (pageStr) {
    return { citation: `${authorStr} (${yearStr}, ${pageStr})`, warnings };
  }

  return { citation: `${authorStr} (${yearStr})`, warnings };
}

function buildAuthorStr(authors: string | null | undefined, warnings: string[]): string {
  if (!authors || authors.trim() === "") {
    warnings.push("Author metadata is missing — citation may be incomplete.");
    return "Unknown Author";
  }

  const parts = authors
    .split(/[;&]+/)
    .map((a) => a.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    warnings.push("Author metadata could not be parsed.");
    return "Unknown Author";
  }

  if (parts.length === 1) return formatSingleAuthor(parts[0]);
  if (parts.length === 2)
    return `${formatSingleAuthor(parts[0])} and ${formatSingleAuthor(parts[1])}`;

  return `${formatSingleAuthor(parts[0])} et al.`;
}

function formatSingleAuthor(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Unknown Author";

  const commaIdx = trimmed.indexOf(",");
  if (commaIdx !== -1) {
    const surname = trimmed.slice(0, commaIdx).trim();
    return surname || trimmed;
  }

  const segments = trimmed.split(/\s+/);
  return segments[segments.length - 1] || trimmed;
}

function buildYearStr(year: number | null | undefined, warnings: string[]): string {
  if (!year || year < 1000 || year > 2100) {
    warnings.push("Publication year is missing or implausible — citation may be incomplete.");
    return "n.d.";
  }
  return String(year);
}

function buildPageStr(pageStart: number | null, pageEnd: number | null): string | null {
  if (!pageStart) return null;

  if (pageEnd && pageEnd > pageStart) {
    return `pp. ${pageStart}–${pageEnd}`;
  }

  return `p. ${pageStart}`;
}

export function renderHarvardReference(input: {
  authors?: string | null;
  year?: number | null;
  title?: string | null;
  publisher?: string | null;
  placeOfPublication?: string | null;
}): HarvardCitationResult {
  const warnings: string[] = [];

  const authorStr = buildAuthorStr(input.authors, warnings);
  const yearStr = buildYearStr(input.year, warnings);

  if (!input.title) {
    warnings.push("Title is missing from source metadata.");
  }

  const title = input.title || "Untitled";
  const publisher = input.publisher ? `: ${input.publisher}` : "";
  const place = input.placeOfPublication ? `${input.placeOfPublication}` : "";
  const pubInfo = [place, publisher].filter(Boolean).join("");

  const citation = pubInfo
    ? `${authorStr} (${yearStr}) ${title}. ${pubInfo}.`
    : `${authorStr} (${yearStr}) ${title}.`;

  return { citation, warnings };
}
