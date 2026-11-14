import { create } from 'zustand';
import type { WorkspaceSnapshot } from '../domains/workspace/model';
import type { WorkspaceChange } from '../platform/contracts';
import { errorFromUnknown } from '../platform/contracts';
import { workspaceGateway } from '../platform/workspace-gateway';

export type AppView = 'sect' | 'tasks' | 'statistics';
interface AppState {
  snapshot: WorkspaceSnapshot | null;
  loading: boolean;
  errorCode: string | null;
  view: AppView;
  selectedSessionId: string | null;
  selectedAgentId: string | null;
  query: string;
  sourceFilter: string;
  statusFilter: string;
  boot: () => Promise<void>;
  setView: (view: AppView) => void;
  selectSession: (id: string | null) => void;
  selectAgent: (id: string | null) => void;
  setQuery: (query: string) => void;
  setSourceFilter: (source: string) => void;
  setStatusFilter: (status: string) => void;
  apply: (change: WorkspaceChange) => Promise<boolean>;
  retry: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  snapshot: null,
  loading: true,
  errorCode: null,
  view: 'sect',
  selectedSessionId: 'session-codex-router',
  selectedAgentId: 'agent-moc-nghien',
  query: '',
  sourceFilter: 'all',
  statusFilter: 'all',
  boot: async () => {
    set({ loading: true, errorCode: null });
    try {
      const snapshot = await workspaceGateway.load();
      set({ snapshot, loading: false, errorCode: null });
    } catch (error) {
      set({ loading: false, errorCode: errorFromUnknown(error).code });
    }
  },
  setView: (view) => set({ view }),
  selectSession: (id) => {
    const snapshot = get().snapshot;
    const session = snapshot?.sessions.find((item) => item.id === id);
    set({ selectedSessionId: id, selectedAgentId: session?.agentId ?? get().selectedAgentId });
  },
  selectAgent: (id) => set({ selectedAgentId: id, selectedSessionId: null }),
  setQuery: (query) => set({ query }),
  setSourceFilter: (sourceFilter) => set({ sourceFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  apply: async (change) => {
    const current = get().snapshot;
    if (!current) return false;
    try {
      const snapshot = await workspaceGateway.apply({ expectedRevision: current.revision, change });
      set({ snapshot, errorCode: null });
      return true;
    } catch {
      // Mutation failures should be shown by the active form, not replace the loaded workspace.
      return false;
    }
  },
  retry: async () => get().boot(),
}));
