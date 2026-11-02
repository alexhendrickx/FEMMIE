import type { Category, CategoryGroup } from '../types/logging';

/**
 * Pure, framework-free logic for the detailed daily-log bottom sheet.
 *
 * The sheet only renders; the two decisions that shape it — which categories match the
 * search field, and how the visible categories split into the ordered, titled sections
 * (Menstrual flow → Symptoms → Mood → Lifestyle) — live here so they have unit coverage
 * and survive the iOS/Android/backend split. No react-native / expo / SQLite imports.
 *
 * The period-window visibility rule stays in `data/categories.getVisibleCategories`; this
 * module operates on whatever list of (already period-filtered) categories it is handed.
 */

/** Section render order, top to bottom. */
export const GROUP_ORDER: CategoryGroup[] = ['flow', 'symptoms', 'mood', 'lifestyle'];

/** Human section titles shown on each card header. */
export const GROUP_TITLES: Record<CategoryGroup, string> = {
  flow: 'Menstrual flow',
  symptoms: 'Symptoms',
  mood: 'Mood',
  lifestyle: 'Lifestyle',
};

export interface CategorySection {
  group: CategoryGroup;
  title: string;
  categories: Category[];
}

/**
 * Categories whose label contains the query as a case-insensitive substring.
 * An empty or whitespace-only query matches everything (the normal grouped view).
 * Input order is preserved.
 */
export function filterCategories(categories: Category[], query: string): Category[] {
  const q = query.trim().toLowerCase();
  if (!q) return categories;
  return categories.filter((c) => c.label.toLowerCase().includes(q));
}

/**
 * Split categories into ordered, titled sections (flow → symptoms → mood → lifestyle).
 * Sections with no matching categories are dropped, and within-group order is preserved
 * so any upstream suggestion ordering still holds inside each section.
 */
export function groupCategories(categories: Category[]): CategorySection[] {
  return GROUP_ORDER.map((group) => ({
    group,
    title: GROUP_TITLES[group],
    categories: categories.filter((c) => c.group === group),
  })).filter((section) => section.categories.length > 0);
}
