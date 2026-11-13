import type { Category, CategoryGroup } from '../types/logging';
import { CATEGORIES, CATEGORY_MAP } from '../data/categories';

/**
 * Quick-symptom picker logic (UX decisions #2, #14, #17).
 *
 * Pure, framework-free: the picker's RULES — which symptoms are offerable, how they group
 * by category, and the 5–8 selection bounds — live here and are unit-tested. The screen
 * only renders what these functions return.
 *
 * Decision #17: the user pins a FLEXIBLE 5–8 symptoms (not a hard 5).
 * Decision #14: they are shown BY CATEGORY with a plain-language explanation each.
 */

export const MIN_QUICK_SYMPTOMS = 5;
export const MAX_QUICK_SYMPTOMS = 8;

/** A sensible default set, used until the user pins her own (decisions #2/#17). */
export const DEFAULT_QUICK_SYMPTOM_IDS = [
  'cramps',
  'headache',
  'bloating',
  'fatigue',
  'back_pain',
  'nausea',
  'acne',
  'breast_tenderness',
];

/**
 * The categories a user may pin as a quick symptom. Mood and flow have their own dedicated
 * steps in the daily flow, and "hours" inputs don't fit a one-tap "present today" toggle —
 * so we offer only boolean/scale symptoms (decision #1 keeps mood & flow separate).
 */
export const PICKABLE_CATEGORIES: Category[] = CATEGORIES.filter(
  (c) =>
    c.group !== 'flow' &&
    c.group !== 'fertility' &&
    c.id !== 'mood' &&
    (c.inputType === 'boolean' || c.inputType === 'scale'),
);

const PICKABLE_IDS = new Set(PICKABLE_CATEGORIES.map((c) => c.id));

/** Human-facing section headings, in display order (decision #14 — by category). */
const GROUP_ORDER: CategoryGroup[] = ['symptoms', 'mood', 'lifestyle', 'flow'];
const GROUP_LABELS: Record<CategoryGroup, string> = {
  symptoms: 'Body',
  mood: 'Mind & mood',
  lifestyle: 'Energy & sleep',
  flow: 'Flow',
  fertility: 'Fertility & sex',
};

export interface SymptomGroup {
  group: CategoryGroup;
  label: string;
  items: Category[];
}

/** The pickable symptoms grouped into display sections (empty groups are dropped). */
export function groupedPickableSymptoms(): SymptomGroup[] {
  return GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: PICKABLE_CATEGORIES.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0);
}

/** True when the current selection is a valid set to save (within the 5–8 bounds). */
export function isValidSelection(ids: string[]): boolean {
  return ids.length >= MIN_QUICK_SYMPTOMS && ids.length <= MAX_QUICK_SYMPTOMS;
}

/**
 * Toggle one symptom in the selection, respecting the bounds.
 * - Removing is always allowed (even below the minimum — the user can rebuild).
 * - Adding is refused once the maximum is reached (returns the selection unchanged).
 * Unknown / non-pickable ids are ignored.
 */
export function toggleSymptom(ids: string[], id: string): string[] {
  if (!PICKABLE_IDS.has(id)) return ids;
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  if (ids.length >= MAX_QUICK_SYMPTOMS) return ids;
  return [...ids, id];
}

/**
 * Keep only ids that still map to a pickable category, de-duplicated and capped at the
 * maximum. Use when loading a persisted/imported selection so a stale or malformed id
 * can't leak into the daily flow.
 */
export function sanitizeSelection(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (PICKABLE_IDS.has(id) && CATEGORY_MAP.has(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
      if (out.length >= MAX_QUICK_SYMPTOMS) break;
    }
  }
  return out;
}
