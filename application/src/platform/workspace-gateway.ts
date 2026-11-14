import { invoke } from '@tauri-apps/api/core';
import demoSnapshot from '../fixtures/demo-workspace.json';
import type { WorkspaceSnapshot } from '../domains/workspace/model';
import { AppError, isTauriRuntime, type ApplyWorkspaceChange, type WorkspaceGateway } from './contracts';
import { applyWorkspaceChange } from './organization-service';

const DEMO_KEY = 'cloudsect.application.demo-workspace.v1';

class DemoWorkspaceGateway implements WorkspaceGateway {
  private snapshot: WorkspaceSnapshot | null = null;

  async load(): Promise<WorkspaceSnapshot> {
    if (this.snapshot) return structuredClone(this.snapshot);
    try {
      const saved = localStorage.getItem(DEMO_KEY);
      this.snapshot = saved ? JSON.parse(saved) as WorkspaceSnapshot : structuredClone(demoSnapshot as WorkspaceSnapshot);
      return structuredClone(this.snapshot);
    } catch {
      throw new AppError('storage', 'demo_workspace_read');
    }
  }

  async apply(input: ApplyWorkspaceChange): Promise<WorkspaceSnapshot> {
    const current = await this.load();
    const next = applyWorkspaceChange(current, input);
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(next));
      this.snapshot = next;
      return structuredClone(next);
    } catch {
      throw new AppError('storage', 'demo_workspace_write');
    }
  }
}

class TauriWorkspaceGateway implements WorkspaceGateway {
  load(): Promise<WorkspaceSnapshot> {
    return invoke<WorkspaceSnapshot>('load_workspace');
  }
  apply(input: ApplyWorkspaceChange): Promise<WorkspaceSnapshot> {
    return invoke<WorkspaceSnapshot>('apply_workspace_change', { input });
  }
}

export const workspaceGateway: WorkspaceGateway = isTauriRuntime() ? new TauriWorkspaceGateway() : new DemoWorkspaceGateway();
