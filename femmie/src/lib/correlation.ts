import type { DailyLog, EntryValue } from '../types/logging';
import type { CyclePhase } from '../types/cycle';
import { CATEGORY_MAP } from '../data/categories';
import { extractPeriodStarts, averageCycleLength, cyclePositionFor } from './cycle';

/**
 * Symptom-to-cycle correlation engine (Feature F2-07).
 *
 * PRIVACY / ARCHITECTURE: this runs entirely on-device against the user's OWN
 * decrypted logs. It never uses population averages and never leaves the device.
 * The backend only ever stores ciphertext, so correlation CANNOT live server-side
 * (the roadmap's "Fastify + TimescaleDB" framing would require the server to read
 * plaintext health data — a product-ending privacy break). Hence: framework-free
 * `src/lib`, no react-native / expo / sqlite imports, fully unit-testable.
 */

/** Patterns are only surfaced once seen across at least this many distinct cycles. */
export const MIN_CYCLES_FOR_PATTERN = 3;

/** A scale symptom (1–5) counts as "present" at or above this intensity. */
export const SCALE_PRESENT_THRESHOLD = 3;

export type PhaseCounts = Record<CyclePhase, number>;

/** Canonical phase order — the single source of truth for iteration and tie-breaks. */
export const PHASES: readonly CyclePhase[] = ['period', 'follicular', 'fertile', 'luteal'];

const EMPTY_PHASE_COUNTS = (): PhaseCounts => ({
  period: 0,
  follicular: 0,
  fertile: 0,
  luteal: 0,
});

const emptyPhaseSets = (): Record<CyclePhase, Set<string>> => ({
  period: new Set(),
  follicular: new Set(),
  fertile: new Set(),
  luteal: new Set(),
});

const PHASE_LABEL: Record<CyclePhase, string> = {
  period: 'menstrual',
  follicular: 'follicular',
  fertile: 'ovulatory',
  luteal: 'luteal',
};

export interface Correlation {
  symptomId: string;
  symptomName: string;
  /** Days the symptom was present, bucketed by phase. */
  phaseCounts: PhaseCounts;
  /** Total days the symptom was present (sum of phaseCounts). */
  occurrences: number;
  /** Distinct cycles in which the symptom was present at least once. */
  cyclesObserved: number;
  /** The phase holding the largest share of occurrences. */
  dominantPhase: CyclePhase;
  /** Cycles whose occurrences fell (at least once) in the dominant phase. */
  cyclesInDominant: number;
  confidence: 'sufficient' | 'low_sample';
  /** Observation-only sentence, never prescriptive. */
  pattern: string;
}

export interface CorrelationOptions {
  /** Map symptomId → display name. Custom tags (F2-13) merge in here. */
  labels?: Record<string, string>;
  /**
   * Override which category ids are eligible. By default only NEGATIVE signals
   * correlate: built-in `symptoms`/`mood` categories, plus any unknown id (custom
   * tags — F2-13). `flow` categories define the cycle itself, and `lifestyle`
   * categories (sleep hours/quality, energy, exercise) are neutral/positive signals
   * — counting a good night's sleep as a "symptom occurrence" would be nonsense.
   */
  isSymptom?: (categoryId: string) => boolean;
}

/** Default eligibility: negative built-in symptoms/moods, and all custom tags. */
export function defaultIsSymptom(categoryId: string): boolean {
  const cat = CATEGORY_MAP.get(categoryId);
  if (!cat) return true; // custom tag (F2-13) → treat as a user-defined symptom
  return cat.group === 'symptoms' || cat.group === 'mood';
}

/**
 * Whether an entry value means the symptom was meaningfully "present" that day.
 * Booleans must be true; scales must reach the intensity threshold; mood counts
 * only on a low/bad day. (Eligibility — see {@link defaultIsSymptom} — has already
 * excluded neutral/positive signals such as sleep hours and energy before this runs.)
 */
export function isPresent(value: EntryValue): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value >= SCALE_PRESENT_THRESHOLD;
  if (value === 'low' || value === 'bad') return true; // negative mood
  return false;
}

function titleCase(id: string): string {
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function dominantPhaseOf(counts: PhaseCounts): CyclePhase {
  // Ties resolve to the earlier phase in PHASES order (deterministic).
  return PHASES.reduce((best, p) => (counts[p] > counts[best] ? p : best), PHASES[0]);
}

/**
 * Compute per-symptom phase distributions across the user's own cycle history.
 *
 * Returns one entry per observed symptom (unsorted — callers sort/filter).
 * `cyclesObserved < MIN_CYCLES_FOR_PATTERN` is flagged `low_sample`;
 * use {@link surfaceCorrelations} to get only the patterns worth showing.
 */
export function computeCorrelations(
  logs: DailyLog[],
  options: CorrelationOptions = {},
): Correlation[] {
  const starts = extractPeriodStarts(logs);
  if (starts.length === 0) return [];

  const avg = averageCycleLength(starts);
  const isSymptom = options.isSymptom ?? defaultIsSymptom;

  // symptomId -> phase -> count, and symptomId -> set of cycleIds (overall + per phase)
  const counts = new Map<string, PhaseCounts>();
  const cyclesWith = new Map<string, Set<string>>();
  const cyclesWithInPhase = new Map<string, Record<CyclePhase, Set<string>>>();

  for (const log of logs) {
    const pos = cyclePositionFor(starts, log.date, avg);
    if (!pos) continue; // date predates first tracked cycle

    for (const entry of log.entries) {
      if (!isSymptom(entry.categoryId)) continue;
      if (!isPresent(entry.value)) continue;

      const id = entry.categoryId;
      if (!counts.has(id)) {
        counts.set(id, EMPTY_PHASE_COUNTS());
        cyclesWith.set(id, new Set());
        cyclesWithInPhase.set(id, emptyPhaseSets());
      }
      counts.get(id)![pos.phase] += 1;
      cyclesWith.get(id)!.add(pos.cycleId);
      cyclesWithInPhase.get(id)![pos.phase].add(pos.cycleId);
    }
  }

  const out: Correlation[] = [];
  for (const [id, phaseCounts] of counts) {
    const occurrences =
      phaseCounts.period +
      phaseCounts.follicular +
      phaseCounts.fertile +
      phaseCounts.luteal;
    const cyclesObserved = cyclesWith.get(id)!.size;
    const dominantPhase = dominantPhaseOf(phaseCounts);
    const cyclesInDominant = cyclesWithInPhase.get(id)![dominantPhase].size;
    const confidence =
      cyclesObserved >= MIN_CYCLES_FOR_PATTERN ? 'sufficient' : 'low_sample';
    const symptomName = options.labels?.[id] ?? titleCase(id);

    out.push({
      symptomId: id,
      symptomName,
      phaseCounts,
      occurrences,
      cyclesObserved,
      dominantPhase,
      cyclesInDominant,
      confidence,
      pattern: buildPattern(symptomName, dominantPhase, cyclesInDominant, cyclesObserved),
    });
  }

  return out;
}

function buildPattern(
  name: string,
  dominantPhase: CyclePhase,
  cyclesInDominant: number,
  cyclesObserved: number,
): string {
  // Accurate claim: `cyclesInDominant` = cycles in which it appeared AT LEAST ONCE
  // during the dominant phase (not necessarily its majority there).
  return `Your ${name.toLowerCase()} appeared during your ${PHASE_LABEL[dominantPhase]} phase in ${cyclesInDominant} of ${cyclesObserved} cycles.`;
}

/** Feedback persisted per symptom; `helpful: false` hides it from future surfacing. */
export type CorrelationFeedback = Record<string, { helpful: boolean }>;

/**
 * The patterns worth showing the user: sufficient sample size AND not dismissed
 * as "not relevant". Sorted by how concentrated the pattern is (strongest first).
 *
 * CONSTRAINT (F2-07): returns an empty array — never throws — when there isn't
 * enough data.
 */
export function surfaceCorrelations(
  logs: DailyLog[],
  feedback: CorrelationFeedback = {},
  options: CorrelationOptions = {},
): Correlation[] {
  return computeCorrelations(logs, options)
    .filter((c) => c.confidence === 'sufficient')
    .filter((c) => feedback[c.symptomId]?.helpful !== false)
    .sort(
      (a, b) =>
        b.cyclesInDominant / b.cyclesObserved -
          a.cyclesInDominant / a.cyclesObserved ||
        b.occurrences - a.occurrences,
    );
}
