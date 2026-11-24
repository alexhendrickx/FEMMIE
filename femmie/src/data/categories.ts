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
  { id: 'cravings',            label: 'Cravings',         group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🍫', explain: 'A strong urge for specific foods, common before a period.' },
  { id: 'dizziness',           label: 'Dizziness',        group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '💫', explain: 'Feeling lightheaded, faint or like the room is spinning.' },
  { id: 'hot_flashes',         label: 'Hot flashes',      group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🥵', explain: 'A sudden wave of heat and flushing, often with sweating.' },
  { id: 'diarrhea',            label: 'Diarrhea',         group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🚽', explain: 'Loose or frequent stools; hormones can speed up the gut.' },
  { id: 'constipation',        label: 'Constipation',     group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🪨', explain: 'Hard or infrequent stools; hormones can slow the gut.' },
  { id: 'joint_pain',          label: 'Joint pain',       group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🦵', explain: 'Aching or stiff joints that can flare with hormonal shifts.' },
  { id: 'tender_skin',         label: 'Tender skin',      group: 'symptoms',  inputType: 'boolean', periodOnly: false, icon: '🩹', explain: 'Skin that feels sore or extra sensitive to touch.' },

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
  { id: 'water',               label: 'Water',            group: 'lifestyle', inputType: 'number',  periodOnly: false, icon: '💦', unit: 'glasses', explain: 'How many glasses of water you drank.' },
  { id: 'alcohol',             label: 'Alcohol',          group: 'lifestyle', inputType: 'boolean', periodOnly: false, icon: '🍷', explain: 'Whether you had any alcohol today.' },
  { id: 'caffeine',            label: 'Caffeine',         group: 'lifestyle', inputType: 'boolean', periodOnly: false, icon: '☕', explain: 'Whether you had coffee, tea or another caffeinated drink.' },
  { id: 'meds_taken',          label: 'Medication',       group: 'lifestyle', inputType: 'boolean', periodOnly: false, icon: '💊', explain: 'Took your regular medication/supplements.' },
  { id: 'weight',              label: 'Weight',           group: 'lifestyle', inputType: 'number',  periodOnly: false, icon: '⚖️', unit: 'kg', explain: 'Your body weight today; it can shift with water retention.' },
  { id: 'stress',             label: 'Stress',            group: 'lifestyle', inputType: 'scale',   periodOnly: false, icon: '🤯', explain: 'How stressed or under pressure you felt today.' },
  { id: 'libido',             label: 'Libido',            group: 'lifestyle', inputType: 'scale',   periodOnly: false, icon: '🔥', explain: 'Your level of sexual desire, which can rise around ovulation.' },

  // Fertility & sex
  { id: 'cervical_mucus',      label: 'Cervical fluid',   group: 'fertility', inputType: 'scale',   periodOnly: false, icon: '💧', explain: 'Cervical fluid changes across the cycle; wetter/egg-white means more fertile.' },
  { id: 'bbt',                 label: 'Basal temp',       group: 'fertility', inputType: 'number',  periodOnly: false, icon: '🌡️', unit: '°C', explain: 'Basal body temperature, taken at rest; it rises slightly after ovulation.' },
  { id: 'ovulation_test',      label: 'Ovulation test',   group: 'fertility', inputType: 'boolean', periodOnly: false, icon: '🧪', explain: 'Result of an at-home ovulation (LH) test.' },
  { id: 'sexual_activity',     label: 'Sex',              group: 'fertility', inputType: 'boolean', periodOnly: false, icon: '❤️', explain: 'Whether you had sex today.' },
  { id: 'protected_sex',       label: 'Protected sex',    group: 'fertility', inputType: 'boolean', periodOnly: false, icon: '🛡️', explain: 'Whether protection was used.' },
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
