import { useState } from 'react';
import { Eye, EyeOff, Pencil, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../app/store';
import { formatAmount, formatDuration, sessionTokens } from '../../shared/format';
import { TASK_AREAS, type Agent, type Session, type TaskArea } from '../workspace/model';
import { IconButton, SourceBadge, StatusBadge } from '../../shared/ui/primitives';
import '../../shared/styles/session-detail.css';

const statuses = { working: 'working', awaiting_input: 'awaiting', idle: 'idle', interrupted: 'interrupted', unknown: 'unknown' } as const;

export function SessionDetail({ session, compact = false }: { session: Session; compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const snapshot = useAppStore((state) => state.snapshot)!;
  const apply = useAppStore((state) => state.apply);
  const agent = snapshot.agents.find((candidate) => candidate.id === session.agentId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(agent?.name ?? '');
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveName = async () => {
    if (!agent || [...draft.trim()].length < 1 || [...draft.trim()].length > 40) { setError(true); return; }
    setSaving(true);
    const saved = await apply({ kind: 'renameAgent', agentId: agent.id, name: draft });
    setSaving(false);
    if (saved) { setEditing(false); setError(false); }
  };
  const tokenTotal = sessionTokens(session);
  const updateArea = (areaId: TaskArea) => void apply({ kind: 'setSessionArea', sessionId: session.id, areaId });
  const toggleHidden = () => void apply({ kind: 'setSessionHidden', sessionId: session.id, hidden: !session.hidden });

  return <article className={`session-detail ${compact ? 'session-detail-compact' : ''}`}>
    <div className="detail-topline"><SourceBadge source={session.sourceId} /><StatusBadge status={session.status} label={t(statuses[session.status])} />
      <IconButton label={session.hidden ? t('showHidden') : t('hide')} onClick={toggleHidden}>{session.hidden ? <Eye size={15} /> : <EyeOff size={15} />}</IconButton>
    </div>
    <h3 className="task-title">{session.title}</h3>
    <p className="task-project">{session.projectLabel ?? t('unknownUsage')}</p>
    <div className="detail-agent-row">
      <span className="robe-avatar" style={{ '--robe': agent?.robeColor ?? 'var(--river-slate)' } as React.CSSProperties}>{agent?.name.slice(0, 1) ?? '?'}</span>
      <span className="detail-agent-copy">{agent ? <><strong>{agent.name}</strong><small>{agent.title}</small></> : <><strong>{t('unassigned')}</strong><small>{t('unassignedNote')}</small></>}</span>
      {agent && <button type="button" className="quiet-button edit-agent" onClick={() => { setDraft(agent.name); setEditing(true); }} aria-label={t('rename')}><Pencil size={14} /></button>}
    </div>
    {editing && agent && <div className="inline-edit"><input className="text-input" autoFocus value={draft} maxLength={80} onChange={(event) => { setDraft(event.target.value); setError(false); }} onCompositionEnd={() => setError(false)} onKeyDown={(event) => { if (event.key === 'Enter') void saveName(); if (event.key === 'Escape') setEditing(false); }} />
      {error && <small className="field-error">{t('nameRequired')}</small>}<div><button className="quiet-button" onClick={() => setEditing(false)}><X size={14} />{t('cancel')}</button><button className="quiet-button" disabled={saving} onClick={() => void saveName()}><Save size={14} />{t('save')}</button></div></div>}
    {!agent && <label className="field-block"><span className="field-label">{t('assign')}</span><select className="select-input" value="" onChange={(event) => { if (event.target.value) void apply({ kind: 'assignSession', sessionId: session.id, agentId: event.target.value }); }}><option value="">{t('selectAgent')}</option>{snapshot.agents.map((candidate: Agent) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.title}</option>)}</select></label>}
    <label className="field-block"><span className="field-label">{t('area')}</span><select className="select-input" value={session.areaId} onChange={(event) => updateArea(event.target.value as TaskArea)}>{Object.entries(TASK_AREAS).map(([id, name]) => <option key={id} value={id}>{name[i18n.language === 'en' ? 'en' : 'vi']}</option>)}</select></label>
    <div className="detail-metrics"><div><span>{t('tokens')}</span><strong className="tabular">{formatAmount(tokenTotal, i18n.language)}</strong></div><div><span>{t('time')}</span><strong>{formatDuration(session.activity.activeSeconds, i18n.language)}</strong></div></div>
    {session.usage.availability === 'unknown' ? <p className="data-note">{session.usage.reason ?? t('unknownUsage')}</p> : <div className="token-breakdown">
      <div><span>{t('input')}</span><b>{formatAmount(session.usage.freshInput, i18n.language)}</b></div>
      <div><span>{t('cached')}</span><b>{formatAmount(session.usage.cachedInput, i18n.language)}</b></div>
      <div><span>{t('output')}</span><b>{formatAmount(session.usage.output, i18n.language)}</b></div>
      <small>{t('reasoning')}: {formatAmount(session.usage.reasoningWithinOutput, i18n.language)}</small>
    </div>}
    {session.statusObservedAt && <p className="observed-note">{t('lastUpdated')} · {new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }).format(new Date(session.statusObservedAt))}</p>}
  </article>;
}
