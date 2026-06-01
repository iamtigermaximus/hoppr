/**
 * Jaccard similarity between two sets of tokens.
 * Returns 0 (no overlap) to 1 (identical).
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

/**
 * Tokenize a string into a set of lowercase words, stripping punctuation.
 * Words shorter than 3 chars are filtered out as noise.
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 3)
  );
}

export interface DuplicateMatch {
  id: string;
  title: string;
  venueName: string;
  venueId: string;
  titleSimilarity: number;
  contentSimilarity: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matches: DuplicateMatch[];
}

const TITLE_THRESHOLD = 0.65; // Title-only Jaccard above this = strong match
const CONTENT_THRESHOLD = 0.55; // Title + description combined threshold
const TITLE_WEIGHT = 1.5; // Title similarity counts 1.5x vs content similarity

/**
 * Check if content is a likely duplicate among a set of candidates.
 * Weighs title similarity higher than full-content similarity.
 */
export function findDuplicates(
  title: string,
  description: string | null,
  candidates: Array<{
    id: string;
    title: string;
    description: string | null;
    venueId: string;
    venueName: string;
  }>,
  currentVenueId: string,
  minThreshold = CONTENT_THRESHOLD,
): DuplicateCheckResult {
  const titleTokens = tokenize(title);
  const contentTokens = tokenize(`${title} ${description ?? ""}`);

  const matches: DuplicateMatch[] = [];

  for (const c of candidates) {
    // Same venue is allowed (recurring events, follow-up promos)
    if (c.venueId === currentVenueId) continue;

    const cTitleTokens = tokenize(c.title);
    const cContentTokens = tokenize(`${c.title} ${c.description ?? ""}`);

    const titleSim = jaccardSimilarity(titleTokens, cTitleTokens);
    const contentSim = jaccardSimilarity(contentTokens, cContentTokens);

    // Weighted composite: title similarity counts more
    const weightedSim =
      (titleSim * TITLE_WEIGHT + contentSim) / (TITLE_WEIGHT + 1);

    if (titleSim >= TITLE_THRESHOLD || weightedSim >= minThreshold) {
      matches.push({
        id: c.id,
        title: c.title,
        venueName: c.venueName,
        venueId: c.venueId,
        titleSimilarity: Math.round(titleSim * 100),
        contentSimilarity: Math.round(weightedSim * 100),
      });
    }
  }

  // Sort by similarity descending
  matches.sort((a, b) => b.contentSimilarity - a.contentSimilarity);

  return {
    isDuplicate: matches.length > 0,
    matches,
  };
}
