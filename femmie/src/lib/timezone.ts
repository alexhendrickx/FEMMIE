/**
 * Timezone & travel date helpers (Feature F3-20).
 *
 * Pure, framework-free, on-device. The cycle math in cycle.ts already compares
 * dates as UTC-anchored YYYY-MM-DD strings, so it never drifts with the device
 * timezone. What travel actually needs is:
 *   1. a stable "what local day is it for the user right now" (so each calendar day
 *      is logged exactly once, even when they fly across timezones), and
 *   2. a local wall-clock reminder time that stays at e.g. 21:00 LOCAL after they
 *      land somewhere new (not 21:00 of the old zone).
 * Both are derived from the IANA timezone via Intl — no external date library.
 */

/** The user's current local calendar day (YYYY-MM-DD) in the given IANA timezone. */
export function localDayISO(instant: Date | number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instant));
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function isSameLocalDay(a: Date | number, b: Date | number, timeZone: string): boolean {
  return localDayISO(a, timeZone) === localDayISO(b, timeZone);
}

/**
 * Offset (ms) of `timeZone` from UTC at `instant`: localWallClock − UTC.
 * Positive east of UTC. Accounts for DST because it probes at that instant.
 */
function tzOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUTC - instant.getTime();
}

/**
 * The UTC instant at which a given LOCAL wall-clock time occurs in `timeZone`, so a
 * "21:00 reminder" fires at 21:00 wherever the user currently is. Resolves the DST
 * offset at the target moment (with one refinement across a DST boundary).
 */
export function localWallClockToUtc(
  dayISO: string,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const [y, m, d] = dayISO.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute, 0);
  const offset1 = tzOffsetMs(new Date(guess), timeZone);
  let ts = guess - offset1;
  const offset2 = tzOffsetMs(new Date(ts), timeZone);
  if (offset2 !== offset1) ts = guess - offset2; // crossed a DST change — correct once
  return new Date(ts);
}

/**
 * Whole local calendar days between two instants in a timezone. Travel-safe: uses the
 * local day boundaries, so a redeye that crosses midnight counts as a day regardless
 * of the UTC gap. Can be negative when `later` precedes `earlier`.
 */
export function localDaysBetween(earlier: Date | number, later: Date | number, timeZone: string): number {
  const a = localDayISO(earlier, timeZone);
  const b = localDayISO(later, timeZone);
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}
