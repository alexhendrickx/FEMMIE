import type { DailyLog, LogEntry, MoodValue, FlowValue, ScaleValue } from '../types/logging';
import { CATEGORY_MAP } from '../data/categories';
import { todayOutlook } from './outlook';
import { surfaceCorrelations } from './correlation';

/**
 * Daily-flow logic (the Duolingo-style ritual — UX decisions #1, #2, #10, #12).
 *
 * Pure, framework-free: step ORDER, ENTRY assembly, and the INSIGHT-of-the-day are all
 * decided here and unit-tested; the DailyFlow component only renders them. Keeping this
 * split means the heart of the app has test coverage even though its screen doesn't.
 */

export type FlowStepId = 'flow' | 'mood' | 'energy' | 'sleep' | 'symptoms' | 'insight';

export interface FlowAnswers {
  mood?: MoodValue;
  /** 'none' = explicitly no flow that day; undefined = not asked. */
  flow?: FlowValue | 'none';
  /** Energy level today (1–5). */
  energy?: ScaleValue;
  /** Sleep quality last night (1–5). */
  sleep?: ScaleValue;
  /** categoryId → selected. */
  symptoms: Record<string, boolean>;
}

export const emptyAnswers = (): FlowAnswers => ({ symptoms: {} });

/**
 * The ordered steps for today. Smart order (decision #2.1): on a likely period day the
 * flow step comes first; off-period there is no flow step at all (decision #1). The
 * insight is always last (decision #12).
 */
export function buildFlowSteps(opts: { isLikelyPeriod: boolean }): FlowStepId[] {
  // A short daily ritual: mood, energy and sleep every day; flow only leads on a
  // likely period day; the insight always closes (decision #12).
  const core: FlowStepId[] = ['mood', 'energy', 'sleep', 'symptoms', 'insight'];
  return opts.isLikelyPeriod ? ['flow', ...core] : core;
}

/** Re-exported for existing callers; the quick-symptom set lives in ./quickSymptoms. */
export { DEFAULT_QUICK_SYMPTOM_IDS } from './quickSymptoms';

/** The "present today" value for a quick symptom, by its input type. */
function presentValue(categoryId: string): LogEntry['value'] {
  const cat = CATEGORY_MAP.get(categoryId);
  // Scales record a moderate 3 on a quick tap; everything else is a simple boolean true.
  return cat?.inputType === 'scale' ? 3 : true;
}

/**
 * Turn the flow answers into log entries. Only answered things become entries: an
 * unselected symptom, an un-asked flow step, and an explicit "no flow" add nothing.
 */
export function assembleEntries(answers: FlowAnswers): LogEntry[] {
  const entries: LogEntry[] = [];

  if (answers.mood) entries.push({ categoryId: 'mood', value: answers.mood });
  if (answers.flow && answers.flow !== 'none') {
    entries.push({ categoryId: 'menstrual_flow', value: answers.flow });
  }
  if (answers.energy) entries.push({ categoryId: 'energy', value: answers.energy });
  if (answers.sleep) entries.push({ categoryId: 'sleep_quality', value: answers.sleep });
  for (const [categoryId, selected] of Object.entries(answers.symptoms)) {
    if (selected) entries.push({ categoryId, value: presentValue(categoryId) });
  }
  return entries;
}

/**
 * The one small personal insight shown at the end (decision #12), drawn from the user's
 * own history: today's outlook first, then a standing correlation noticing. Returns null
 * when there isn't enough data yet — the screen then shows a calm default.
 */
export function insightOfTheDay(logs: DailyLog[], todayISO: string): string | null {
  const outlook = todayOutlook(logs, todayISO);
  if (outlook && outlook.observations.length > 0) {
    return outlook.suggestion ?? outlook.observations[0].pattern;
  }
  const [top] = surfaceCorrelations(logs);
  return top ? top.pattern : null;
}
