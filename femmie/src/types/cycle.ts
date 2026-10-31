export type CyclePhase = 'period' | 'follicular' | 'fertile' | 'luteal';

export interface Prediction {
  confidence: 'high' | 'medium' | 'low';
  mostLikely?: string;   // YYYY-MM-DD
  windowStart?: string;  // YYYY-MM-DD
  windowEnd?: string;    // YYYY-MM-DD
  basis: string;
}
