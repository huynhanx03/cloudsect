import type { ActivityInterval, ProviderId, Session } from '../domains/workspace/model';

export function formatAmount(value: string | null | undefined, locale: string): string {
  if (value == null) return '—';
  try { return new Intl.NumberFormat(locale).format(BigInt(value)); }
  catch { return '—'; }
}

export function formatDuration(seconds: number | null, locale: string): string {
  if (seconds == null) return '—';
  seconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (locale === 'vi') return hours ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function sumAmounts(values: Array<string | null>): string | null {
  const known = values.filter((value): value is string => value !== null);
  if (!known.length) return null;
  if (known.some((value) => !/^\d+$/.test(value))) return null;
  return known.reduce((total, value) => total + BigInt(value), 0n).toString();
}

export function unionSeconds(intervals: ActivityInterval[]): number {
  const ordered = intervals.map((interval) => [Date.parse(interval.startedAt), Date.parse(interval.endedAt)] as const)
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end >= start)
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let currentStart: number | null = null;
  let currentEnd = 0;
  for (const [start, end] of ordered) {
    if (currentStart === null) { currentStart = start; currentEnd = end; }
    else if (start <= currentEnd) currentEnd = Math.max(currentEnd, end);
    else { total += currentEnd - currentStart; currentStart = start; currentEnd = end; }
  }
  if (currentStart !== null) total += currentEnd - currentStart;
  return Math.floor(total / 1000);
}

export function sessionTokens(session: Session): string | null {
  const { usage } = session;
  if (usage.total !== null) return /^\d+$/.test(usage.total) ? usage.total : null;
  if ([usage.freshInput, usage.cachedInput, usage.output].some((part) => part !== null)) {
    return [usage.freshInput, usage.cachedInput, usage.output]
      .filter((part): part is string => part !== null)
      .reduce((total, part) => total + BigInt(part), 0n).toString();
  }
  return null;
}

export const providerColor: Record<ProviderId, string> = {
  codex: '#4a8268', claude: '#ab7049', gemini: '#766f9f',
};

export function shortDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`));
}
