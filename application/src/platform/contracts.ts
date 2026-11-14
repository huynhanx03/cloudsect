import type { ProviderId, Preferences, TaskArea, WorkspaceSnapshot } from '../domains/workspace/model';

export type WorkspaceChange =
  | { kind: 'createAgent'; name: string; robeColor: string }
  | { kind: 'updateAgentProfile'; agentId: string; name: string; islandName: string; robeColor: string }
  | { kind: 'renameAgent'; agentId: string; name: string }
  | { kind: 'renameIsland'; islandId: string; name: string }
  | { kind: 'setRobeColor'; agentId: string; color: string }
  | { kind: 'assignSession'; sessionId: string; agentId: string | null }
  | { kind: 'moveAgent'; agentId: string; islandId: string }
  | { kind: 'setSessionArea'; sessionId: string; areaId: TaskArea }
  | { kind: 'setSessionHidden'; sessionId: string; hidden: boolean }
  | { kind: 'updatePreferences'; patch: Partial<Preferences> };

export type AppErrorCode = 'validation' | 'not_found' | 'conflict' | 'storage' | 'unsupported';
export class AppError extends Error {
  constructor(readonly code: AppErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export interface ApplyWorkspaceChange {
  expectedRevision: number;
  change: WorkspaceChange;
}

export interface WorkspaceGateway {
  load(): Promise<WorkspaceSnapshot>;
  apply(input: ApplyWorkspaceChange): Promise<WorkspaceSnapshot>;
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function errorFromUnknown(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : 'Unknown application error';
  return new AppError('storage', message);
}

export function sourceId(value: string): ProviderId | null {
  if (value === 'antigravity') return 'gemini';
  return value === 'codex' || value === 'claude' || value === 'gemini' ? value : null;
}
