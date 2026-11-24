import type { Category } from '../types/logging';

/**
 * The ritual's fixed category set: flow + core symptoms shown as chips, plus
 * mood / energy / sleep_quality which have dedicated steps in the daily flow.
 * Old logs may contain ids beyond this list; renderers fall back to the raw id
 * (see lib/history.summarizeDay).
 */
export const CATEGORIES: Category[] = [
  { id: 'menstrual_flow', label: 'Flow',          group: 'flow',      inputType: 'flow',    icon: '🩸' },
  { id: 'spotting',       label: 'Spotting',      group: 'flow',      inputType: 'boolean', icon: '💧' },
  { id: 'clots',          label: 'Clots',         group: 'flow',      inputType: 'boolean', icon: '🔴' },
  { id: 'cramps',         label: 'Cramps',        group: 'symptoms',  inputType: 'scale',   icon: '⚡' },
  { id: 'headache',       label: 'Headache',      group: 'symptoms',  inputType: 'boolean', icon: '🤕' },
  { id: 'bloating',       label: 'Bloating',      group: 'symptoms',  inputType: 'scale',   icon: '🫧' },
  { id: 'fatigue',        label: 'Fatigue',       group: 'symptoms',  inputType: 'scale',   icon: '😴' },
  { id: 'mood',           label: 'Mood',          group: 'mood',      inputType: 'mood',    icon: '😊' },
  { id: 'sleep_quality',  label: 'Sleep quality', group: 'lifestyle', inputType: 'scale',   icon: '🌙' },
  { id: 'energy',         label: 'Energy',        group: 'lifestyle', inputType: 'scale',   icon: '⚡' },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]));
