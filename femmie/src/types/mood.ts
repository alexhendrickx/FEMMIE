/**
 * DRSP-style mood logging types (Feature F2-10).
 *
 * DRSP = Daily Record of Severity of Problems. This is a structured, OPT-IN daily
 * record — explicitly "not a diagnosis". Scores are health data and must be encrypted
 * before they are persisted or synced.
 */

/** Number of DRSP items recorded per day (a 10-item short form). */
export const DRSP_ITEM_COUNT = 10;
/** Each item is rated on a 1 (none) – 6 (extreme) severity scale. */
export const DRSP_MIN = 1;
export const DRSP_MAX = 6;

export interface DrspEntry {
  date: string; // YYYY-MM-DD
  /** Exactly DRSP_ITEM_COUNT item scores, each DRSP_MIN..DRSP_MAX. */
  scores: number[];
}

export interface CycleSeverity {
  /** Period-start ISO date that opened the cycle. */
  cycleId: string;
  /** Mean daily severity across the cycle's DRSP entries. */
  meanSeverity: number;
  /** DRSP entries that fell in this cycle. */
  entryCount: number;
}

export interface MoodSafeguard {
  /** True when the pattern is severe enough to gently suggest a clinician — once. */
  triggered: boolean;
  /** Cycles whose mean severity met the severe threshold. */
  severeCycles: number;
  /** Human, non-diagnostic basis sentence. */
  basis: string;
}
