import type { SessionStatus } from '../../domains/workspace/model';

export interface SceneProjection {
  islands: Array<{ id: string; name: string; biome: string; layoutSeed: number; order: number }>;
  agents: Array<{ id: string; name: string; islandId: string; robeColor: string }>;
  disciples: Array<{ sessionId: string; agentId: string; islandId: string; title: string; areaId: string; status: SessionStatus }>;
  selectedSessionId: string | null;
}

export interface SceneLifecycle {
  active: boolean;
  motion: boolean;
  mode: 'full' | 'compact';
  quality: 'auto' | 'low' | 'balanced';
  theme: 'light' | 'dark';
}

export interface SectScene {
  update(projection: SceneProjection): void;
  setLifecycle(lifecycle: SceneLifecycle): void;
  dispose(): void;
}

