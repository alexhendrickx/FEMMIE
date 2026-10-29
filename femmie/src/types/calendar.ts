export type DayState = 'confirmed' | 'predicted' | 'fertile' | null;

export interface DayData {
  date: string; // YYYY-MM-DD
  state: DayState;
}

export interface MonthRef {
  year: number;
  month: number; // 0-indexed (0 = January)
}
