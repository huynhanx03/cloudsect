export type ProviderId = 'codex' | 'claude' | 'gemini';
export type SessionStatus = 'working' | 'awaiting_input' | 'idle' | 'interrupted' | 'unknown';
export type TaskArea = 'implementation' | 'research' | 'testing' | 'design' | 'council' | 'rest';
export type Amount = string | null;

export interface Agent {
  id: string;
  name: string;
  title: string;
  robeColor: string;
  islandId: string;
  avatarSeed: number;
}

export interface Island {
  id: string;
  name: string;
  biome: 'pine' | 'blossom' | 'bamboo' | 'cloud';
  layoutSeed: number;
  order: number;
}

export interface SessionUsage {
  freshInput: Amount;
  cachedInput: Amount;
  output: Amount;
  reasoningWithinOutput: Amount;
  total: Amount;
  availability: 'available' | 'partial' | 'unknown';
  reason: string | null;
}

export interface ActivityInterval {
  startedAt: string;
  endedAt: string;
}

export interface SessionActivity {
  activeSeconds: number | null;
  intervals: ActivityInterval[];
}

export interface Session {
  id: string;
  sourceId: ProviderId;
  sourceSessionId: string;
  agentId: string | null;
  title: string;
  projectLabel: string | null;
  status: SessionStatus;
  statusObservedAt: string | null;
  areaId: TaskArea;
  startedAt: string | null;
  usage: SessionUsage;
  activity: SessionActivity;
  hidden: boolean;
}

export interface QuotaWindow {
  sourceId: ProviderId;
  accountLabel: string;
  windowLabel: '5h' | 'weekly';
  remainingPercent: number | null;
  resetAt: string | null;
  observedAt: string | null;
  availability: 'available' | 'unknown';
  reason: string | null;
}

export interface DailyUsageRecord {
  id: string;
  date: string;
  sourceId: ProviderId;
  agentId: string | null;
  sessionId: string;
  freshInput: string;
  cachedInput: string;
  output: string;
  activeSeconds: number;
  intervals: ActivityInterval[];
}

export interface LedgerEntry {
  id: string;
  createdAt: string;
  description: string;
  stones: string;
  kind: 'earned' | 'opening';
}

export interface Preferences {
  locale: 'vi' | 'en';
  theme: 'light' | 'dark' | 'system';
  motion: 'system' | 'reduced' | 'full';
  quality: 'auto' | 'low' | 'balanced';
  hiddenSessionIds: string[];
}

export interface WorkspaceSnapshot {
  schemaVersion: 1;
  revision: number;
  mode: 'demo';
  agents: Agent[];
  islands: Island[];
  sessions: Session[];
  quotas: QuotaWindow[];
  dailyUsage: DailyUsageRecord[];
  treasury: { balance: string; earned: string; entries: LedgerEntry[] };
  preferences: Preferences;
}

export const TASK_AREAS: Record<TaskArea, { vi: string; en: string }> = {
  implementation: { vi: 'Luyện Khí Đường', en: 'Crafting Court' },
  research: { vi: 'Tàng Kinh Các', en: 'Scripture Library' },
  testing: { vi: 'Khảo Nghiệm Đài', en: 'Trial Terrace' },
  design: { vi: 'Linh Cơ Các', en: 'Design Pavilion' },
  council: { vi: 'Nghị Sự Đình', en: 'Council Hall' },
  rest: { vi: 'Tĩnh Tâm Viện', en: 'Quiet Garden' },
};

export const SOURCE_LABELS: Record<ProviderId, string> = {
  codex: 'Codex', claude: 'Claude', gemini: 'Gemini',
};

