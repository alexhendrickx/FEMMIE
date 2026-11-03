import type { Category } from '../types/logging';

export const CATEGORIES: Category[] = [
  // Flow — periodOnly
  { id: 'menstrual_flow',      label: 'Flow',             group: 'flow',      inputType: 'flow',    periodOnly: true,  icon: '🩸' },
  { id: 'spotting',            label: 'Spotting',         group: 'flow',      inputType: 'boolean', periodOnly: true,  icon: '💧' },
  { id: 'clots',               label: 'Clots',            group: 'flow',      inputType: 'boolean', periodOnly: true,  icon: '🔴' },

  // Symptoms
  { id: 'cramps',              label: 'Cramps',           group: 'symptoms',  inputType: 'scale',   periodOnly: false, icon: '⚡', explain: 'Period pain — a tightening or ache low in the belly, from the uterus contracting.' },
  { id: 'headache',            label: 'Headache',         group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🤕', explain: 'Head pain; often linked to the hormone dip just before a period.' },
  { id: 'bloating',            label: 'Bloating',         group: 'symptoms',  inputType: 'scale',   periodOnly: false, icon: '🫧', explain: 'A full, puffy or swollen belly from holding on to extra water.' },
  { id: 'breast_tenderness',   label: 'Breast tenderness',group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🌸', explain: 'Sore or sensitive breasts, common in the days before a period.' },
  { id: 'fatigue',             label: 'Fatigue',          group: 'symptoms',  inputType: 'scale',   periodOnly: false, icon: '😴', explain: 'Feeling unusually tired or low on energy, beyond normal sleepiness.' },
  { id: 'nausea',              label: 'Nausea',           group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🤢', explain: 'A queasy, sick-to-the-stomach feeling.' },
  { id: 'back_pain',           label: 'Back pain',        group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🔩', explain: 'Ache in the lower back; cramps often radiate there.' },
  { id: 'acne',                label: 'Acne',             group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '😶', explain: 'Breakouts or pimples that flare with hormonal shifts.' },

  // Mood
  { id: 'mood',                label: 'Mood',             group: 'mood',      inputType: 'mood',    periodOnly: false, icon: '😊' },
  { id: 'anxiety',             label: 'Anxiety',          group: 'mood',      inputType: 'scale',   periodOnly: false, icon: '😰', explain: 'Feeling worried, tense or on edge.' },
  { id: 'irritability',        label: 'Irritability',     group: 'mood',      inputType: 'scale',   periodOnly: false, icon: '😤', explain: 'Short-tempered, easily annoyed — a common pre-period mood shift.' },
  { id: 'brain_fog',           label: 'Brain fog',        group: 'mood',      inputType: 'boolean', periodOnly: false, icon: '🌫️', explain: 'Trouble focusing or thinking clearly, feeling mentally cloudy.' },

  // Lifestyle
  { id: 'sleep_quality',       label: 'Sleep quality',    group: 'lifestyle', inputType: 'scale',   periodOnly: false, icon: '🌙', explain: 'How well you slept — restful vs. restless or broken sleep.' },
  { id: 'sleep_hours',         label: 'Sleep hours',      group: 'lifestyle', inputType: 'hours',   periodOnly: false, icon: '⏱️' },
  { id: 'energy',              label: 'Energy',           group: 'lifestyle', inputType: 'scale',   periodOnly: false, icon: '⚡', explain: 'Your overall pep or drive for the day.' },
  { id: 'exercise',            label: 'Exercise',         group: 'lifestyle', inputType: 'boolean', periodOnly: false, icon: '🏃', explain: 'Whether you moved or worked out today.' },
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
