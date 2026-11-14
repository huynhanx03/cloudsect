import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, CircleHelp, ListFilter, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../app/store';
import { formatAmount, formatDuration, sessionTokens } from '../../shared/format';
import { SOURCE_LABELS, type SessionStatus } from '../workspace/model';
import { SourceBadge, StatusBadge } from '../../shared/ui/primitives';
import { SessionDetail } from './SessionDetail';
import '../../shared/styles/sessions.css';

const statusKeys: Record<SessionStatus, string> = { working: 'working', awaiting_input: 'awaiting', idle: 'idle', interrupted: 'interrupted', unknown: 'unknown' };

export default function TasksScreen() {
  const { t, i18n } = useTranslation();
  const snapshot = useAppStore((state) => state.snapshot)!;
  const selectedSessionId = useAppStore((state) => state.selectedSessionId);
  const selectSession = useAppStore((state) => state.selectSession);
  const query = useAppStore((state) => state.query);
  const setQuery = useAppStore((state) => state.setQuery);
  const sourceFilter = useAppStore((state) => state.sourceFilter);
  const setSourceFilter = useAppStore((state) => state.setSourceFilter);
  const statusFilter = useAppStore((state) => state.statusFilter);
  const setStatusFilter = useAppStore((state) => state.setStatusFilter);
  const parentRef = useRef<HTMLDivElement>(null);
  const [includeHidden, setIncludeHidden] = useState(false);
  const filtered = useMemo(() => snapshot.sessions.filter((session) => {
    if (session.hidden && !includeHidden) return false;
    if (sourceFilter !== 'all' && session.sourceId !== sourceFilter) return false;
    if (statusFilter !== 'all' && session.status !== statusFilter) return false;
    const agentName = snapshot.agents.find((agent) => agent.id === session.agentId)?.name ?? '';
    const searchable = `${session.title} ${session.projectLabel ?? ''} ${agentName} ${SOURCE_LABELS[session.sourceId]}`.toLocaleLowerCase(i18n.language);
    return searchable.includes(query.toLocaleLowerCase(i18n.language));
  }), [snapshot.sessions, snapshot.agents, sourceFilter, statusFilter, query, i18n.language, includeHidden]);
  const selected = snapshot.sessions.find((session) => session.id === selectedSessionId && (!session.hidden || includeHidden));
  // TanStack Virtual returns an imperative instance by design; the UI reads its live viewport measurements.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({ count: filtered.length, getScrollElement: () => parentRef.current, estimateSize: () => 70, overscan: 8 });
  const visibleItems = virtualizer.getVirtualItems();
  const virtual = filtered.length > 50;

  return <div className="tasks-layout">
    <section className="tasks-table-panel surface-panel">
      <div className="tasks-tools">
        <label className="search-box"><Search size={16} /><span className="sr-only">{t('search')}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search')} /></label>
        <label className="filter-select"><span className="sr-only">{t('sourceFilter')}</span><select className="select-input" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">{t('allSources')}</option>{Object.entries(SOURCE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="filter-select"><span className="sr-only">{t('statusFilter')}</span><select className="select-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">{t('allStates')}</option>{Object.entries(statusKeys).map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}</select></label>
        <button type="button" className={`quiet-button hidden-toggle ${includeHidden ? 'is-active' : ''}`} aria-pressed={includeHidden} onClick={() => setIncludeHidden((value) => !value)}>{includeHidden ? <EyeOff size={14} /> : <Eye size={14} />}{t('includeHidden')}</button>
        <span className="result-count"><ListFilter size={14} />{filtered.length}</span>
      </div>
      <div className="table-head"><span>{t('task')}</span><span>{t('agent')}</span><span>{t('status')}</span><span>{t('tokens')}</span></div>
      <div className="session-table-scroll" ref={parentRef}>
        {!filtered.length ? <div className="empty-state"><CircleHelp size={22} /><h3>{t('noTasks')}</h3><p>{t('unassignedNote')}</p></div> : virtual ? <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {visibleItems.map((item) => { const session = filtered[item.index]; const agent = snapshot.agents.find((candidate) => candidate.id === session.agentId); return <button key={session.id} className={`task-row ${selectedSessionId === session.id ? 'is-selected' : ''}`} style={{ position: 'absolute', insetInlineStart: 0, top: 0, transform: `translateY(${item.start}px)` }} onClick={() => selectSession(session.id)}>
            <span className="task-row-title"><strong>{session.title}</strong><small>{session.projectLabel}</small></span><span className="task-row-agent"><i style={{ background: agent?.robeColor ?? 'var(--river-slate)' }} />{agent?.name ?? t('unassigned')}<SourceBadge source={session.sourceId} /></span><StatusBadge status={session.status} label={t(statusKeys[session.status])} /><span className="task-row-tokens">{formatAmount(sessionTokens(session), i18n.language)}</span>
          </button>; })}
        </div> : filtered.map((session) => { const agent = snapshot.agents.find((candidate) => candidate.id === session.agentId); return <button key={session.id} className={`task-row ${selectedSessionId === session.id ? 'is-selected' : ''}`} onClick={() => selectSession(session.id)}>
          <span className="task-row-title"><strong>{session.title}</strong><small>{session.projectLabel}</small></span><span className="task-row-agent"><i style={{ background: agent?.robeColor ?? 'var(--river-slate)' }} />{agent?.name ?? t('unassigned')}<SourceBadge source={session.sourceId} /></span><StatusBadge status={session.status} label={t(statusKeys[session.status])} /><span className="task-row-tokens">{formatAmount(sessionTokens(session), i18n.language)}<small>{formatDuration(session.activity.activeSeconds, i18n.language)}</small></span>
        </button>; })}
      </div>
    </section>
    <aside className="task-inspector surface-panel">{selected ? <SessionDetail session={selected} /> : <div className="empty-state"><ListFilter size={22} /><h3>{t('selectTask')}</h3><p>{t('unassignedNote')}</p></div>}</aside>
  </div>;
}
