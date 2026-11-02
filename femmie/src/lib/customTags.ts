import type { DailyLog } from '../types/logging';
import type { CustomTag, TagSuggestion } from '../types/customTags';

/**
 * Pure logic for the Personal Symptom Dictionary (F2-13): validation, duplicate
 * detection, merging, free-text suggestion mining, and the label map that lets the
 * correlation engine (F2-07) treat custom tags identically to built-in symptoms.
 *
 * Framework-free (no react-native/expo/sqlite). Persistence + encryption live in the
 * store; everything here is deterministic and unit-testable.
 */

export const MAX_TAG_NAME_LENGTH = 40;

/** Default: a phrase must appear at least this many times in notes to be suggested. */
export const DEFAULT_SUGGESTION_THRESHOLD = 5;

/** Collapse whitespace, trim, lowercase — the canonical form for comparisons. */
export function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function isValidTagName(name: string): boolean {
  const n = name.trim();
  return n.length > 0 && n.length <= MAX_TAG_NAME_LENGTH;
}

function tokenSet(name: string): Set<string> {
  return new Set(normalizeTagName(name).split(' ').filter(Boolean));
}

/**
 * Find an existing tag that likely means the same thing as `name`:
 *  - exact normalized match, or
 *  - one name's word-set is a subset of the other's ("energy" ⊂ "low energy").
 * Returns the first match (or null) so the UI can offer "looks like X — merge?".
 */
export function findDuplicate(tags: CustomTag[], name: string): CustomTag | null {
  const target = normalizeTagName(name);
  if (!target) return null;
  const targetTokens = tokenSet(name);

  for (const tag of tags) {
    const existing = normalizeTagName(tag.name);
    if (existing === target) return tag;

    const existingTokens = tokenSet(tag.name);
    if (isSubset(targetTokens, existingTokens) || isSubset(existingTokens, targetTokens)) {
      return tag;
    }
  }
  return null;
}

function isSubset(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/**
 * Merge two tags: drop `discardId`, keep `keepId`. Pure — returns the new tag list.
 * Re-pointing existing log entries is {@link remapTagInLogs}.
 */
export function mergeTags(tags: CustomTag[], keepId: string, discardId: string): CustomTag[] {
  if (keepId === discardId) return tags;
  return tags.filter((t) => t.id !== discardId);
}

/**
 * Re-point every log entry tagged `fromId` onto `toId` (used when merging tags, so no
 * logged history is lost). Pure: returns new log objects, leaves inputs untouched.
 */
export function remapTagInLogs(logs: DailyLog[], fromId: string, toId: string): DailyLog[] {
  return logs.map((log) => {
    if (!log.entries.some((e) => e.categoryId === fromId)) return log;
    return {
      ...log,
      entries: log.entries.map((e) =>
        e.categoryId === fromId ? { ...e, categoryId: toId } : e,
      ),
    };
  });
}

/** Map every custom tag id → its display name, for the correlation engine's `labels`. */
export function buildTagLabels(tags: CustomTag[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tag of tags) out[tag.id] = tag.name;
  return out;
}

// --- Free-text suggestion mining -------------------------------------------------

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'with',
  'is', 'was', 'were', 'be', 'been', 'am', 'are', 'i', 'my', 'me', 'it', 'this', 'that',
  'so', 'very', 'really', 'feel', 'feeling', 'felt', 'today', 'day', 'bit', 'had', 'have',
  'not', 'no', 'just', 'then', 'than', 'as', 'all', 'some', 'more', 'too', 'got',
]);

function words(note: string): string[] {
  return note
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Mine frequent phrases from free-text notes that aren't already tags, so the UI can
 * offer "you've written 'brain fog' N times — add as a tag?".
 *
 * Counts single words and adjacent two-word phrases (skipping stopwords), keeps those
 * at/above `threshold`, drops a single word when it's already covered by a kept phrase
 * (so "brain fog" wins over "brain"/"fog"), and excludes anything matching an existing
 * tag. Sorted by frequency, strongest first.
 */
export function suggestTagsFromNotes(
  notes: string[],
  existingTags: CustomTag[] = [],
  threshold: number = DEFAULT_SUGGESTION_THRESHOLD,
): TagSuggestion[] {
  const unigrams = new Map<string, number>();
  const bigrams = new Map<string, number>();

  for (const note of notes) {
    const ws = words(note);
    for (let i = 0; i < ws.length; i++) {
      if (!STOPWORDS.has(ws[i])) {
        unigrams.set(ws[i], (unigrams.get(ws[i]) ?? 0) + 1);
      }
      if (i + 1 < ws.length && !STOPWORDS.has(ws[i]) && !STOPWORDS.has(ws[i + 1])) {
        const phrase = `${ws[i]} ${ws[i + 1]}`;
        bigrams.set(phrase, (bigrams.get(phrase) ?? 0) + 1);
      }
    }
  }

  const existing = new Set(existingTags.map((t) => normalizeTagName(t.name)));

  const keptBigrams = [...bigrams.entries()]
    .filter(([phrase, count]) => {
      const [w1, w2] = phrase.split(' ');
      return count >= threshold && !existing.has(phrase) && w1 !== w2; // drop "cramps cramps"
    })
    .map(([phrase, count]) => ({ phrase, count }));

  // A single word is only suppressed by a bigram that is AT LEAST as frequent — i.e.
  // the word mostly appears as part of that phrase ("brain"/"fog" ⊂ "brain fog"). A
  // word that is independently more common than any phrase containing it still stands.
  const strongestCovering = new Map<string, number>();
  for (const b of keptBigrams) {
    for (const w of b.phrase.split(' ')) {
      strongestCovering.set(w, Math.max(strongestCovering.get(w) ?? 0, b.count));
    }
  }

  const keptUnigrams = [...unigrams.entries()]
    .filter(
      ([word, count]) =>
        count >= threshold &&
        !existing.has(word) &&
        (strongestCovering.get(word) ?? 0) < count,
    )
    .map(([phrase, count]) => ({ phrase, count }));

  return [...keptBigrams, ...keptUnigrams].sort(
    (a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase),
  );
}
