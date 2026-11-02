/**
 * Pain & migraine tracking types (Feature F2-11).
 *
 * CONSTRAINT: body-map locations are stored as NAMED REGION STRINGS, never pixel
 * coordinates, so the data stays portable across screen sizes and platforms. Pain
 * events are health data — encrypted before persistence/sync.
 */

/** Canonical body-map regions (front/back). The single source of truth for locations. */
export const BODY_REGIONS = [
  'head',
  'neck',
  'chest',
  'breasts',
  'upper_abdomen',
  'lower_abdomen',
  'pelvis',
  'lower_back',
  'upper_back',
  'hips',
  'thighs',
  'legs',
] as const;

export type BodyRegion = (typeof BODY_REGIONS)[number];

export const PAIN_INTENSITY_MIN = 0;
export const PAIN_INTENSITY_MAX = 10;
export const MED_EFFECTIVENESS_MIN = 1;
export const MED_EFFECTIVENESS_MAX = 5;

export interface Medication {
  name: string;
  /** How well it worked, MED_EFFECTIVENESS_MIN..MAX. */
  effectiveness: number;
}

export interface PainEvent {
  id: string;
  date: string; // YYYY-MM-DD
  locations: BodyRegion[];
  /** PAIN_INTENSITY_MIN..MAX. */
  intensity: number;
  durationMin: number;
  medications: Medication[];
}

export interface LocationCount {
  region: BodyRegion;
  count: number;
}

export interface MedicationStat {
  name: string;
  timesTried: number;
  avgEffectiveness: number;
}
