import type { CyclePhase } from '../types/cycle';
import {
  PAIN_INTENSITY_MIN,
  PAIN_INTENSITY_MAX,
  MED_EFFECTIVENESS_MIN,
  MED_EFFECTIVENESS_MAX,
  type BodyRegion,
  type PainEvent,
} from '../types/pain';
import { isValidPainEvent } from './pain';

/** English label for every canonical region (F2-11). Keyed so a missing region fails tsc. */
export const REGION_LABEL: Record<BodyRegion, string> = {
  head: 'Head',
  neck: 'Neck',
  chest: 'Chest',
  breasts: 'Breasts',
  upper_abdomen: 'Upper abdomen',
  lower_abdomen: 'Lower abdomen',
  pelvis: 'Pelvis',
  lower_back: 'Lower back',
  upper_back: 'Upper back',
  hips: 'Hips',
  thighs: 'Thighs',
  legs: 'Legs',
};

export const PHASE_LABEL: Record<CyclePhase, string> = {
  period: 'Period',
  follicular: 'Follicular',
  fertile: 'Fertile window',
  luteal: 'Luteal',
};

/** Duration chips. Values are minutes (PainEvent.durationMin). */
export const DURATION_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 h' },
  { value: 120, label: '2 h' },
  { value: 240, label: '4 h' },
  { value: 480, label: '8 h+' },
];

/** 0..10 inclusive, derived from the type constants so the two can't drift. */
export const INTENSITY_STEPS: ReadonlyArray<number> = Array.from(
  { length: PAIN_INTENSITY_MAX - PAIN_INTENSITY_MIN + 1 },
  (_, i) => PAIN_INTENSITY_MIN + i,
);

/** 1..5 inclusive. */
export const EFFECTIVENESS_STEPS: ReadonlyArray<number> = Array.from(
  { length: MED_EFFECTIVENESS_MAX - MED_EFFECTIVENESS_MIN + 1 },
  (_, i) => MED_EFFECTIVENESS_MIN + i,
);

/** What the store accepts: a PainEvent minus the id the store assigns. */
export type PainEventInput = Omit<PainEvent, 'id'>;

/** Uncommitted form state. `intensity`/`medicationEffectiveness` are null until picked. */
export interface PainDraft {
  date: string;
  locations: BodyRegion[];
  intensity: number | null;
  durationMin: number;
  medicationName: string;
  medicationEffectiveness: number | null;
}

export function emptyDraft(date: string): PainDraft {
  return {
    date,
    locations: [],
    intensity: null,
    durationMin: 60,
    medicationName: '',
    medicationEffectiveness: null,
  };
}

/** Toggle a region in/out of the selection; order of first selection is preserved. */
export function toggleRegion(locations: BodyRegion[], region: BodyRegion): BodyRegion[] {
  return locations.includes(region)
    ? locations.filter((r) => r !== region)
    : [...locations, region];
}

/**
 * Convert a draft into a storable event input, or null when the draft is incomplete /
 * invalid. Rules on top of `isValidPainEvent`:
 *   - at least one region;
 *   - intensity explicitly chosen;
 *   - a medication name without an effectiveness (or vice-versa) is incomplete.
 * The medication name is trimmed; a blank name means "no medication".
 */
export function draftToEvent(draft: PainDraft): PainEventInput | null {
  if (draft.locations.length === 0) return null;
  if (draft.intensity === null) return null;

  const name = draft.medicationName.trim();
  const eff = draft.medicationEffectiveness;
  if (name.length === 0 && eff !== null) return null;
  if (name.length > 0 && eff === null) return null;

  const input: PainEventInput = {
    date: draft.date,
    locations: [...draft.locations],
    intensity: draft.intensity,
    durationMin: draft.durationMin,
    medications: name.length > 0 && eff !== null ? [{ name, effectiveness: eff }] : [],
  };
  return isValidPainEvent({ ...input, id: 'draft' }) ? input : null;
}

export function canSaveDraft(draft: PainDraft): boolean {
  return draftToEvent(draft) !== null;
}

/** Newest first, then by id for a stable order; used by the "Recent episodes" list. */
export function sortEventsNewestFirst(events: PainEvent[]): PainEvent[] {
  return [...events].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

/** "Head, Lower back" — for list rows and accessibility labels. */
export function describeLocations(locations: BodyRegion[]): string {
  return locations.map((r) => REGION_LABEL[r]).join(', ');
}
