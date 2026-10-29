import type { Category } from '../types/logging';

export const CATEGORIES: Category[] = [
  // Flow — periodOnly
  { id: 'menstrual_flow',      label: 'Flow',             group: 'flow',      inputType: 'flow',    periodOnly: true,  icon: '🩸' },
  { id: 'spotting',            label: 'Spotting',         group: 'flow',      inputType: 'boolean', periodOnly: true,  icon: '💧' },
  { id: 'clots',               label: 'Clots',            group: 'flow',      inputType: 'boolean', periodOnly: true,  icon: '🔴' },

  // Symptoms
  { id: 'cramps',              label: 'Cramps',           group: 'symptoms',  inputType: 'scale',   periodOnly: false, icon: '⚡' },
  { id: 'headache',            label: 'Headache',         group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🤕' },
  { id: 'bloating',            label: 'Bloating',         group: 'symptoms',  inputType: 'scale',   periodOnly: false, icon: '🫧' },
  { id: 'breast_tenderness',   label: 'Breast tenderness',group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🌸' },
  { id: 'fatigue',             label: 'Fatigue',          group: 'symptoms',  inputType: 'scale',   periodOnly: false, icon: '😴' },
  { id: 'nausea',              label: 'Nausea',           group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🤢' },
  { id: 'back_pain',           label: 'Back pain',        group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🔩' },
  { id: 'acne',                label: 'Acne',             group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '😶' },

  // Mood
  { id: 'mood',                label: 'Mood',             group: 'mood',      inputType: 'mood',    periodOnly: false, icon: '😊' },
  { id: 'anxiety',             label: 'Anxiety',          group: 'mood',      inputType: 'scale',   periodOnly: false, icon: '😰' },
  { id: 'irritability',        label: 'Irritability',     group: 'mood',      inputType: 'scale',   periodOnly: false, icon: '😤' },
  { id: 'brain_fog',           label: 'Brain fog',        group: 'mood',      inputType: 'boolean', periodOnly: false, icon: '🌫️' },

  // Lifestyle
  { id: 'sleep_quality',       label: 'Sleep quality',    group: 'lifestyle', inputType: 'scale',   periodOnly: false, icon: '🌙' },
  { id: 'sleep_hours',         label: 'Sleep hours',      group: 'lifestyle', inputType: 'hours',   periodOnly: false, icon: '⏱️' },
  { id: 'energy',              label: 'Energy',           group: 'lifestyle', inputType: 'scale',   periodOnly: false, icon: '⚡' },
  { id: 'exercise',            label: 'Exercise',         group: 'lifestyle', inputType: 'boolean', periodOnly: false, icon: '🏃' },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]));

export const PERIOD_WINDOW_DAYS = 7;

export function getVisibleCategories(
  cycleDay: number,
  orderedIds: string[],
  showAll: boolean,
): Category[] {
  const isInPeriodWindow = cycleDay <= PERIOD_WINDOW_DAYS;

  // Re-order by server suggestion, append any unmentioned categories at the end
  const suggested = orderedIds
    .map((id) => CATEGORY_MAP.get(id))
    .filter((c): c is Category => !!c);

  const mentionedIds = new Set(orderedIds);
  const remaining = CATEGORIES.filter((c) => !mentionedIds.has(c.id));

  const ordered = [...suggested, ...remaining];

  // Filter period-only outside window; if showAll, show everything except period-only
  return ordered.filter((c) => {
    if (c.periodOnly && !isInPeriodWindow) return false;
    return true;
  });
}
