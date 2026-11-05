import { DRSP_ITEM_COUNT, DRSP_MIN, DRSP_MAX, type DrspEntry } from '../types/mood';
import { isValidDrspEntry } from './mood';
import { isIsoDate } from './cycle';

/**
 * DRSP form view-model (F2-10). Pure, framework-free.
 * The 10 items and the 1–6 scale labels are UI content for the daily record; the
 * scoring/safeguard logic lives in `lib/mood.ts` and is not duplicated here.
 */

export interface DrspItem {
  id: string;
  /** English prompt shown on the form. */
  label: string;
}

/**
 * HUMAN-VERIFY (clinical content): paraphrased 10 core mood items of the DRSP short
 * form. Wording and instrument licensing must be reviewed by a human before release.
 */
export const DRSP_ITEMS: ReadonlyArray<DrspItem> = [
  { id: 'depressed', label: 'Felt depressed, sad, or down' },
  { id: 'hopeless', label: 'Felt hopeless' },
  { id: 'worthless', label: 'Felt worthless or guilty' },
  { id: 'anxious', label: 'Felt anxious, tense, or on edge' },
  { id: 'mood_swings', label: 'Had mood swings or felt suddenly tearful' },
  { id: 'rejection_sensitive', label: 'Felt more sensitive to rejection or easily hurt' },
  { id: 'irritable', label: 'Felt angry or irritable' },
  { id: 'conflict', label: 'Had conflicts or problems with people' },
  { id: 'less_interest', label: 'Had less interest in usual activities' },
  { id: 'concentration', label: 'Had difficulty concentrating' },
];

/** 1..6 inclusive, derived from the type constants so the two can't drift. */
export const DRSP_SCALE_STEPS: ReadonlyArray<number> = Array.from(
  { length: DRSP_MAX - DRSP_MIN + 1 },
  (_, i) => DRSP_MIN + i,
);

/** HUMAN-VERIFY (clinical content): DRSP severity anchors. */
export const DRSP_SCALE_LABEL: Record<number, string> = {
  1: 'Not at all',
  2: 'Minimal',
  3: 'Mild',
  4: 'Moderate',
  5: 'Severe',
  6: 'Extreme',
};

/** Uncommitted form state: one slot per DRSP item, null until the user picks a value. */
export interface DrspDraft {
  date: string;
  scores: Array<number | null>;
}

/** Fresh draft for `date`; when `existing` is a valid entry for that date its scores are prefilled. */
export function emptyDraft(date: string, existing?: DrspEntry): DrspDraft {
  if (existing && existing.date === date && isValidDrspEntry(existing)) {
    return { date, scores: [...existing.scores] };
  }
  return { date, scores: Array<number | null>(DRSP_ITEM_COUNT).fill(null) };
}

/** Return a new draft with item `index` set to `score`. Out-of-range index/score → unchanged draft. */
export function setDraftScore(draft: DrspDraft, index: number, score: number): DrspDraft {
  if (!Number.isInteger(index) || index < 0 || index >= DRSP_ITEM_COUNT) return draft;
  if (!Number.isInteger(score) || score < DRSP_MIN || score > DRSP_MAX) return draft;
  const scores = [...draft.scores];
  scores[index] = score;
  return { ...draft, scores };
}

/** Number of items still unrated — drives the "N left" footer hint. */
export function remainingItems(draft: DrspDraft): number {
  return draft.scores.filter((s) => s === null).length;
}

/**
 * Convert a draft into a storable DrspEntry, or null when any item is unrated, the
 * date is not YYYY-MM-DD, or the result fails `isValidDrspEntry`.
 */
export function draftToEntry(draft: DrspDraft): DrspEntry | null {
  if (!isIsoDate(draft.date)) return null;
  if (draft.scores.length !== DRSP_ITEM_COUNT) return null;
  if (draft.scores.some((s) => s === null)) return null;
  const entry: DrspEntry = { date: draft.date, scores: draft.scores.map((s) => s as number) };
  return isValidDrspEntry(entry) ? entry : null;
}

export function canSaveDraft(draft: DrspDraft): boolean {
  return draftToEntry(draft) !== null;
}

/** Newest first; used by the "Recent records" list. Does not mutate the input. */
export function sortEntriesNewestFirst(entries: DrspEntry[]): DrspEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

/** One-decimal display string, e.g. 3.25 → "3.3". */
export function formatSeverity(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}
