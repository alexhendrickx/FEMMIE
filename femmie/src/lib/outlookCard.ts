import type { TodayOutlook } from './outlook';
import { PHASE_LABEL } from './cycle';

/**
 * View-model for <TodayOutlookCard> (F2-08). Pure so the placeholder / mute branching and
 * the exact copy are unit-testable. The card only renders what this returns.
 */
export const OUTLOOK_CARD_TITLE = "Today's outlook";
export const OUTLOOK_NO_HISTORY_BODY =
  'Once you have logged a few cycles, this shows what your own history tends to look like around this point.';
export const OUTLOOK_NO_PATTERN_BODY = 'No clear pattern for this point in your cycle yet.';

export type OutlookCardModel =
  | { kind: 'hidden' }
  | { kind: 'placeholder'; title: string; body: string; footer: string | null }
  | {
      kind: 'ready';
      title: string;
      /** e.g. "Day 14 · Fertile window" */
      headline: string;
      observations: { key: string; text: string }[];
      suggestion: string | null;
      footer: string;
    };

export function buildOutlookCard(outlook: TodayOutlook | null, muted: boolean): OutlookCardModel {
  if (muted) return { kind: 'hidden' };
  if (outlook === null) {
    return { kind: 'placeholder', title: OUTLOOK_CARD_TITLE, body: OUTLOOK_NO_HISTORY_BODY, footer: null };
  }
  if (outlook.observations.length === 0) {
    return { kind: 'placeholder', title: OUTLOOK_CARD_TITLE, body: OUTLOOK_NO_PATTERN_BODY, footer: outlook.dataBasis };
  }
  return {
    kind: 'ready',
    title: OUTLOOK_CARD_TITLE,
    headline: `Day ${outlook.cycleDay} · ${PHASE_LABEL[outlook.phase]}`,
    observations: outlook.observations.map((o) => ({ key: o.signal, text: o.pattern })),
    suggestion: outlook.suggestion,
    footer: outlook.dataBasis,
  };
}
