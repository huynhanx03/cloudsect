import type { DailyUsageRecord, WorkspaceSnapshot } from '../workspace/model';
import { sumAmounts, unionSeconds } from '../../shared/format';

export type Range = 'today' | 'week' | 'month';
export interface UsageSummary {
  tokens: string | null;
  fresh: string | null;
  cached: string | null;
  output: string | null;
  summedSeconds: number;
  elapsedSeconds: number;
  rows: DailyUsageRecord[];
}

export function dailyTokens(row: Pick<DailyUsageRecord, 'freshInput' | 'cachedInput' | 'output'>): string | null {
  const values = [row.freshInput, row.cachedInput, row.output];
  if (values.some((value) => !/^\d+$/.test(value))) return null;
  return values.reduce((total, value) => total + BigInt(value), 0n).toString();
}

export function sumDailyTokens(rows: Array<Pick<DailyUsageRecord, 'freshInput' | 'cachedInput' | 'output'>>): string | null {
  let total = 0n;
  for (const row of rows) {
    const tokens = dailyTokens(row);
    if (tokens === null) return null;
    total += BigInt(tokens);
  }
  return total.toString();
}

export function selectUsage(
  snapshot: WorkspaceSnapshot,
  range: Range,
  sourceId: string,
  agentId: string,
  today = localDateKey(),
): UsageSummary {
  const span = range === 'today' ? 1 : range === 'week' ? 7 : 30;
  const earliest = new Date(`${today}T12:00:00Z`);
  earliest.setUTCDate(earliest.getUTCDate() - (span - 1));
  const dateFloor = earliest.toISOString().slice(0, 10);
  const rows = snapshot.dailyUsage.filter((row) => row.date >= dateFloor && row.date <= today
    && (sourceId === 'all' || row.sourceId === sourceId)
    && (agentId === 'all' || row.agentId === agentId));
  const fresh = sumAmounts(rows.map((row) => row.freshInput));
  const cached = sumAmounts(rows.map((row) => row.cachedInput));
  const output = sumAmounts(rows.map((row) => row.output));
  const tokens = rows.length ? sumDailyTokens(rows) : null;
  return {
    tokens: rows.length ? tokens : null,
    fresh: rows.length ? fresh : null,
    cached: rows.length ? cached : null,
    output: rows.length ? output : null,
    summedSeconds: rows.reduce((total, row) => total + row.activeSeconds, 0),
    elapsedSeconds: unionSeconds(rows.flatMap((row) => row.intervals)),
    rows,
  };
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

