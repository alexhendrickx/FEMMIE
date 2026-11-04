import type { DailyLog } from '../types/logging';
import type { DayState } from '../types/calendar';
import { buildCalendarDays } from './calendar';
import { summarizeDay, type DaySummaryItem } from './history';
import { extractPeriodStarts, averageCycleLength, cyclePositionFor } from './cycle';

/**
 * Pure, framework-free logic for the shared <Agenda> — a chronological,
 * Google-Calendar-style list of cycle days (UX decision #6 "Mix, Google-Calendar
 * style"). It unifies two things the old History split across tabs: the cycle STATE
 * of each day (period / predicted / fertile, from the prediction model) and the
 * ENTRIES logged that day. One day = one row.
 *
 * No react-native / expo / SQLite imports, so it's unit-testable and survives the
 * iOS/Android/backend split (CLAUDE.md rule 3). It composes the existing on-device
 * modules — `calendar.buildCalendarDays` for state, `cycle.cyclePositionFor` for the
 * cycle-day number, `history.summarizeDay` for the entry chips — rather than
 * re-deriving any of that.
 */

export interface AgendaDay {
  /** YYYY-MM-DD. */
  date: string;
  /** Cycle state driving the whole-date colour (null = an ordinary logged day). */
  state: DayState;
  isToday: boolean;
  /** Strictly after today — a predicted / upcoming day, styled as an outlook. */
  isFuture: boolean;
  /** 1-based day within its own cycle, for the "Day N" caption; null when unknown. */
  cycleDay: number | null;
  /** Short Mon-first weekday label, e.g. 'Mon'. */
  weekdayLabel: string;
  dayOfMonth: number;
  /** The day's logged entries as icon+label chips (empty when nothing was logged). */
  summary: DaySummaryItem[];
}

export interface AgendaSection {
  /** YYYY-MM, the grouping key. */
  monthKey: string;
  /** Display label, e.g. 'November 2026'. */
  monthLabel: string;
  days: AgendaDay[];
}

function parseUTC(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

function weekdayLabel(iso: string): string {
  return new Date(parseUTC(iso)).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

function dayOfMonth(iso: string): number {
  return new Date(parseUTC(iso)).getUTCDate();
}

function monthLabelFromKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Build the agenda: every day that carries a cycle state, has logged entries, or is
 * today — in ascending date order, grouped into month sections. Returns an empty
 * array only when there is genuinely nothing and no `todayISO` (never thrown).
 */
export function buildAgenda(logs: DailyLog[], todayISO: string): AgendaSection[] {
  const calDays = buildCalendarDays(logs, todayISO);
  const stateByDate = new Map(calDays.map((d) => [d.date, d.state]));
  const logByDate = new Map(logs.map((l) => [l.date, l]));

  const starts = extractPeriodStarts(logs);
  const avg = averageCycleLength(starts);

  // The union of "interesting" days: a cycle state, real entries, or today.
  const dates = new Set<string>();
  for (const d of calDays) dates.add(d.date);
  for (const l of logs) if (l.entries.length > 0) dates.add(l.date);
  dates.add(todayISO);

  const ordered = [...dates].sort((a, b) => a.localeCompare(b));

  const sections: AgendaSection[] = [];
  for (const date of ordered) {
    const log = logByDate.get(date);
    const pos = cyclePositionFor(starts, date, avg);
    const day: AgendaDay = {
      date,
      state: stateByDate.get(date) ?? null,
      isToday: date === todayISO,
      isFuture: date > todayISO,
      cycleDay: pos ? pos.cycleDay : null,
      weekdayLabel: weekdayLabel(date),
      dayOfMonth: dayOfMonth(date),
      summary: log && log.entries.length > 0 ? summarizeDay(log) : [],
    };

    const monthKey = date.slice(0, 7);
    const last = sections[sections.length - 1];
    if (last && last.monthKey === monthKey) {
      last.days.push(day);
    } else {
      sections.push({ monthKey, monthLabel: monthLabelFromKey(monthKey), days: [day] });
    }
  }

  return sections;
}
