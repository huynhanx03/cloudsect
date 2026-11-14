import type { Agent, Island, TaskArea, WorkspaceSnapshot } from '../domains/workspace/model';
import { TASK_AREAS } from '../domains/workspace/model';
import { AppError, type ApplyWorkspaceChange, type WorkspaceChange } from './contracts';

const ROBE_COLORS = new Set(['#3d836c', '#b9794a', '#766da4', '#68856a', '#b35f59', '#477d92', '#9a784f', '#72809a']);
const AREAS = new Set<TaskArea>(Object.keys(TASK_AREAS) as TaskArea[]);

function validName(raw: string): string {
  const name = raw.trim();
  const length = [...name].length;
  if (length < 1 || length > 40) throw new AppError('validation', 'name');
  return name;
}

function requireItem<T extends { id: string }>(items: T[], id: string, entity: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new AppError('not_found', entity);
  return item;
}

function applyChange(snapshot: WorkspaceSnapshot, change: WorkspaceChange): WorkspaceSnapshot {
  const next = structuredClone(snapshot);
  switch (change.kind) {
    case 'createAgent': {
      const name = validName(change.name);
      if (!ROBE_COLORS.has(change.robeColor)) throw new AppError('validation', 'robeColor');
      const palette = ['pine', 'blossom', 'bamboo', 'cloud'] as const;
      const order = next.islands.reduce((max, island) => Math.max(max, island.order), -1) + 1;
      const id = crypto.randomUUID();
      const islandId = crypto.randomUUID();
      const agent: Agent = { id, name, title: 'Đệ tử mới', robeColor: change.robeColor, islandId, avatarSeed: Math.floor(Math.random() * 10000) };
      const island: Island = { id: islandId, name, biome: palette[order % palette.length], layoutSeed: agent.avatarSeed, order };
      next.agents.push(agent);
      next.islands.push(island);
      break;
    }
    case 'updateAgentProfile': {
      const agent = requireItem(next.agents, change.agentId, 'agent');
      const island = requireItem(next.islands, agent.islandId, 'island');
      if (!ROBE_COLORS.has(change.robeColor)) throw new AppError('validation', 'robeColor');
      agent.name = validName(change.name);
      agent.robeColor = change.robeColor;
      island.name = validName(change.islandName);
      break;
    }
    case 'renameAgent': {
      const agent = requireItem(next.agents, change.agentId, 'agent');
      agent.name = validName(change.name);
      break;
    }
    case 'renameIsland':
      requireItem(next.islands, change.islandId, 'island').name = validName(change.name);
      break;
    case 'setRobeColor': {
      if (!ROBE_COLORS.has(change.color)) throw new AppError('validation', 'robeColor');
      requireItem(next.agents, change.agentId, 'agent').robeColor = change.color;
      break;
    }
    case 'assignSession': {
      const session = requireItem(next.sessions, change.sessionId, 'session');
      if (change.agentId !== null) requireItem(next.agents, change.agentId, 'agent');
      session.agentId = change.agentId;
      break;
    }
    case 'moveAgent': {
      const agent = requireItem(next.agents, change.agentId, 'agent');
      const target = requireItem(next.islands, change.islandId, 'island');
      if (next.agents.some((other) => other.id !== agent.id && other.islandId === target.id)) {
        throw new AppError('conflict', 'island_occupied');
      }
      agent.islandId = target.id;
      break;
    }
    case 'setSessionArea':
      if (!AREAS.has(change.areaId)) throw new AppError('validation', 'areaId');
      requireItem(next.sessions, change.sessionId, 'session').areaId = change.areaId;
      break;
    case 'setSessionHidden':
      requireItem(next.sessions, change.sessionId, 'session').hidden = change.hidden;
      break;
    case 'updatePreferences':
      next.preferences = { ...next.preferences, ...change.patch };
      break;
  }
  next.revision = snapshot.revision + 1;
  return next;
}

export function applyWorkspaceChange(snapshot: WorkspaceSnapshot, input: ApplyWorkspaceChange): WorkspaceSnapshot {
  if (input.expectedRevision !== snapshot.revision) throw new AppError('conflict', 'revision');
  return applyChange(snapshot, input.change);
}
