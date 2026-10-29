import type { MonthRef, DayData, DayState } from '../../types/calendar';

export const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayISO(): string {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}

export function prevMonth(ref: MonthRef): MonthRef {
  return ref.month === 0
    ? { year: ref.year - 1, month: 11 }
    : { year: ref.year, month: ref.month - 1 };
}

export function nextMonth(ref: MonthRef): MonthRef {
  return ref.month === 11
    ? { year: ref.year + 1, month: 0 }
    : { year: ref.year, month: ref.month + 1 };
}

export function monthLabel(ref: MonthRef): string {
  return new Date(ref.year, ref.month, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

export interface CalendarDay {
  date: string;
  day: number;
  state: DayState;
  isToday: boolean;
  isCurrentMonth: boolean;
}

// Returns a 6×7 grid of days for a given month (Mon-first)
export function buildMonthGrid(ref: MonthRef, days: DayData[]): CalendarDay[] {
  const stateMap = new Map(days.map((d) => [d.date, d.state]));
  const today = todayISO();

  const firstDay = new Date(ref.year, ref.month, 1);
  // Monday = 0, Sunday = 6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(ref.year, ref.month + 1, 0).getDate();

  const grid: CalendarDay[] = [];

  // Leading days from prev month
  const prevRef = prevMonth(ref);
  const daysInPrev = new Date(prevRef.year, prevRef.month + 1, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const date = toISO(prevRef.year, prevRef.month, d);
    grid.push({ date, day: d, state: stateMap.get(date) ?? null, isToday: date === today, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = toISO(ref.year, ref.month, d);
    grid.push({ date, day: d, state: stateMap.get(date) ?? null, isToday: date === today, isCurrentMonth: true });
  }

  // Trailing days from next month
  const nextRef = nextMonth(ref);
  let trailing = 1;
  while (grid.length < 42) {
    const date = toISO(nextRef.year, nextRef.month, trailing);
    grid.push({ date, day: trailing, state: stateMap.get(date) ?? null, isToday: date === today, isCurrentMonth: false });
    trailing++;
  }

  return grid;
}

// Returns only the days with a state for a mini-month preview
export function hasAnyState(ref: MonthRef, days: DayData[]): boolean {
  const prefix = `${ref.year}-${String(ref.month + 1).padStart(2, '0')}-`;
  return days.some((d) => d.date.startsWith(prefix) && d.state !== null);
}
