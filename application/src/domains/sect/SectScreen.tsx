import { useMemo, useState } from 'react';
import { ArrowUpRight, CircleHelp, Focus, Gem, ListTodo, Mountain, Plus, RotateCcw, Settings2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../app/store';
import { formatAmount, sessionTokens } from '../../shared/format';
import { TASK_AREAS, SOURCE_LABELS } from '../workspace/model';
import type { SceneProjection } from '../../scene/runtime/types';
import { SceneCanvas } from './SceneCanvas';
import { SessionDetail } from '../sessions/SessionDetail';
import { AgentManagementDialog } from '../agents/AgentManagementDialog';
import '../../shared/styles/sect.css';

export default function SectScreen({ onCreateAgent }: { onCreateAgent: () => void }) {
  const { t, i18n } = useTranslation();
  const snapshot = useAppStore((state) => state.snapshot)!;
  const selectedAgentId = useAppStore((state) => state.selectedAgentId);
  const selectedSessionId = useAppStore((state) => state.selectedSessionId);
  const selectAgent = useAppStore((state) => state.selectAgent);
  const selectSession = useAppStore((state) => state.selectSession);
  const setView = useAppStore((state) => state.setView);
  const [panel, setPanel] = useState<'sessions' | 'detail'>('sessions');
  const [panelOpen, setPanelOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const agent = snapshot.agents.find((candidate) => candidate.id === selectedAgentId) ?? snapshot.agents[0];
  const island = snapshot.islands.find((candidate) => candidate.id === agent?.islandId);
  const agentSessions = snapshot.sessions.filter((session) => session.agentId === agent?.id && !session.hidden);
  const activeSessions = agentSessions.filter((session) => session.status === 'working' || session.status === 'awaiting_input');
  const selected = snapshot.sessions.find((session) => session.id === selectedSessionId && !session.hidden);
  const unassigned = snapshot.sessions.filter((session) => session.agentId === null && !session.hidden);

  const projection = useMemo<SceneProjection>(() => ({
    islands: snapshot.islands.map(({ id, name, biome, layoutSeed, order }) => ({ id, name, biome, layoutSeed, order })),
    agents: snapshot.agents.map(({ id, name, islandId, robeColor }) => ({ id, name, islandId, robeColor })),
    disciples: snapshot.sessions.filter((session) => !session.hidden && session.agentId !== null).map((session) => ({
      sessionId: session.id,
      agentId: session.agentId!,
      islandId: snapshot.agents.find((owner) => owner.id === session.agentId)!.islandId,
      title: session.title,
      areaId: session.areaId,
      status: session.status,
    })),
    selectedSessionId,
  }), [snapshot.agents, snapshot.islands, snapshot.sessions, selectedSessionId]);

  const focusAgent = (agentId: string | null) => {
    selectAgent(agentId);
    setPanel('sessions');
    setPanelOpen(true);
    const next = snapshot.sessions.find((session) => session.agentId === agentId && !session.hidden);
    if (next) selectSession(next.id);
  };
  const resetCamera = () => window.dispatchEvent(new CustomEvent('cloudsect:camera-reset'));
  const focusSession = (sessionId: string) => { selectSession(sessionId); setPanel('detail'); setPanelOpen(true); };
  const focusIsland = (islandId: string) => {
    const owner = snapshot.agents.find((candidate) => candidate.islandId === islandId);
    if (owner) focusAgent(owner.id);
  };
  if (!snapshot.agents.length) return <div className="sect-layout"><div className="sect-world sect-world-empty"><div className="empty-world-mark"><Mountain size={33} /></div><h3>{t('noAgents')}</h3><p>{t('createIsland')}</p><button className="primary-button" onClick={onCreateAgent}><Plus size={15} />{t('createFirst')}</button></div></div>;

  return <div className="sect-layout">
    <section className="sect-world" aria-label={t('sect')}>
      <div className="scene-viewport">
        <SceneCanvas projection={projection} onSelectSession={focusSession} onFocusIsland={focusIsland} />
        <div className="island-captions" aria-label={t('agentFilter')}>
          {snapshot.islands.map((item) => {
            const owner = snapshot.agents.find((entry) => entry.islandId === item.id);
            return <button type="button" key={item.id} className={`island-caption ${owner?.id === agent?.id ? 'is-active' : ''}`} onClick={() => focusIsland(item.id)} style={{ '--robe': owner?.robeColor ?? 'var(--jade)' } as React.CSSProperties}>
              <i aria-hidden="true" /><span>{item.name}</span>{owner && <small>{owner.name}</small>}
            </button>;
          })}
        </div>
        <div className="world-tools">
          <button type="button" className="world-tool world-add" onClick={onCreateAgent}><Plus size={16} />{t('addAgent')}</button>
          <button type="button" className="world-tool camera-reset" onClick={resetCamera} title={t('overviewCamera')} aria-label={t('overviewCamera')}><RotateCcw size={15} /></button>
        </div>
      </div>
      <div className="scene-legend">
        <span><i style={{ '--legend': 'var(--success)' } as React.CSSProperties} />{t('working')}</span>
        <span><i style={{ '--legend': 'var(--warning)' } as React.CSSProperties} />{t('awaiting')}</span>
        <span><i style={{ '--legend': 'var(--river-slate)' } as React.CSSProperties} />{t('idle')}</span>
        <span className="scene-hint"><Focus size={13} />{t('homeHint')}</span>
      </div>
      {unassigned.length > 0 && <div className="unassigned-strip"><CircleHelp size={14} /><span>{unassigned.length} · {t('unassigned')}</span><button onClick={() => setView('tasks')}>{t('viewAll')} <ArrowUpRight size={12} /></button></div>}
    </section>

    {panelOpen && <aside className="agent-inspector" aria-label={agent?.name ?? t('sessions')}>
      <div className="agent-inspector-head">
        <span className="agent-inspector-avatar" style={{ '--robe': agent?.robeColor ?? 'var(--jade)' } as React.CSSProperties}>{agent?.name.slice(0, 1)}</span>
        <div className="agent-inspector-title"><h3>{agent?.name}</h3><p>{agent?.title}</p></div>
        <div className="agent-task-count"><strong>{agentSessions.length}</strong><span>{t('sessions').toLowerCase()}</span></div>
        <button type="button" className="inspector-close" aria-label={t('close')} onClick={() => setPanelOpen(false)}><X size={17} /></button>
      </div>
      <div className="agent-island-name"><Gem size={12} /> {island?.name} {activeSessions.length > 0 && `· ${activeSessions.length} ${t('working').toLowerCase()}`}</div>
      <div className="inspector-tabs" role="tablist" aria-label={t('sessions')}>
        <button role="tab" aria-selected={panel === 'sessions'} onClick={() => setPanel('sessions')}>{t('sessions')}</button>
        <button role="tab" aria-selected={panel === 'detail'} onClick={() => setPanel('detail')}>{t('usage')}</button>
      </div>
      {panel === 'sessions' ? <div className="agent-session-list">
        {agentSessions.length === 0 ? <div className="empty-state"><ListTodo size={19} /><h3>{t('noTasks')}</h3><p>{t('createIsland')}</p></div> : agentSessions.map((session) => <button type="button" key={session.id} className={`agent-session-item ${session.id === selectedSessionId ? 'is-selected' : ''}`} onClick={() => focusSession(session.id)} style={{ '--state': session.status === 'working' ? 'var(--success)' : session.status === 'awaiting_input' ? 'var(--warning)' : 'var(--river-slate)' } as React.CSSProperties}>
          <i aria-hidden="true" /><span className="agent-session-copy"><strong>{session.title}</strong><small>{TASK_AREAS[session.areaId][i18n.language === 'en' ? 'en' : 'vi']} · {SOURCE_LABELS[session.sourceId]}</small></span><span>{formatAmount(sessionTokens(session), i18n.language)}</span>
        </button>)}
      </div> : selected ? <div className="inspector-detail-scroll"><SessionDetail session={selected} compact /></div> : <div className="inspector-detail-scroll"><div className="empty-state"><ListTodo size={19} /><h3>{t('selectTask')}</h3><p>{t('unassignedNote')}</p></div></div>}
      <div className="island-management"><small>{agent?.title}</small><button type="button" className="quiet-button" aria-label={t('manageDaoist')} onClick={() => setManageOpen(true)}><Settings2 size={13} />{t('manageDaoist')}</button></div>
    </aside>}
    {manageOpen && agent && island && <AgentManagementDialog agent={agent} island={island} open onOpenChange={setManageOpen} />}
  </div>;
}
