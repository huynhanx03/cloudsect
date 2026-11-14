import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, CalendarDays, Clock3, Download, Layers3, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../app/store';
import { formatAmount, formatDuration, shortDate } from '../../shared/format';
import { SOURCE_LABELS } from '../workspace/model';
import { dailyTokens, localDateKey, selectUsage, sumDailyTokens, type Range } from './selectors';
import { SectionTitle, SourceBadge } from '../../shared/ui/primitives';
import { SpiritStoneIcon } from '../../shared/ui/SpiritStoneIcon';
import '../../shared/styles/statistics.css';

export default function StatisticsScreen() {
  const { t, i18n } = useTranslation();
  const snapshot = useAppStore((state) => state.snapshot)!;
  const [range, setRange] = useState<Range>('week');
  const [source, setSource] = useState('all');
  const [agentId, setAgentId] = useState('all');
  const today = localDateKey();
  const summary = useMemo(() => selectUsage(snapshot, range, source, agentId, today), [snapshot, range, source, agentId, today]);
  const byAgent = snapshot.agents.map((agent) => ({
    ...agent,
    tokens: sumDailyTokens(summary.rows.filter((row) => row.agentId === agent.id)) ?? '0',
    activeSeconds: summary.rows.filter((row) => row.agentId === agent.id).reduce((total, row) => total + row.activeSeconds, 0),
  })).sort((a, b) => {
    const left = BigInt(a.tokens); const right = BigInt(b.tokens);
    return right > left ? 1 : right < left ? -1 : a.name.localeCompare(b.name, i18n.language);
  });
  const bySource = Object.entries(SOURCE_LABELS).map(([id, label]) => ({
    id, label,
    tokens: sumDailyTokens(summary.rows.filter((row) => row.sourceId === id)) ?? '0',
  })).filter((item) => item.tokens !== '0');
  const rowsByDate = new Map<string, bigint>();
  for (const row of summary.rows) {
    const tokens = dailyTokens(row);
    if (tokens !== null) rowsByDate.set(row.date, (rowsByDate.get(row.date) ?? 0n) + BigInt(tokens));
  }
  const maxChartValue = [...rowsByDate.values()].reduce((maximum, value) => value > maximum ? value : maximum, 1n);
  const chartData = [...rowsByDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, tokens: Number(value * 10000n / maxChartValue) / 100 }));
  const maxAgent = byAgent.reduce((maximum, agent) => BigInt(agent.tokens) > BigInt(maximum) ? agent.tokens : maximum, '1');

  const exportUsage = () => {
    const payload = { schemaVersion: 1, mode: 'demo', generatedAt: new Date().toISOString(), range, source, agentId, totals: summary, quota: snapshot.quotas, rule: 'Illustrative only: 1,000 eligible tokens = 1 spirit stone.' };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `cloudsect-demo-usage-${range}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="statistics-page">
    <div className="statistics-toolbar">
      <div className="range-control" role="group" aria-label={t('range')}>
        {(['today', 'week', 'month'] as Range[]).map((item) => <button key={item} type="button" aria-pressed={range === item} className={range === item ? 'is-active' : ''} onClick={() => setRange(item)}>{t(item)}</button>)}
      </div>
      <label><span className="sr-only">{t('sourceFilter')}</span><select className="select-input" value={source} onChange={(event) => setSource(event.target.value)}><option value="all">{t('allSources')}</option>{Object.entries(SOURCE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label><span className="sr-only">{t('agentFilter')}</span><select className="select-input" value={agentId} onChange={(event) => setAgentId(event.target.value)}><option value="all">{t('allIslands')}</option>{snapshot.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
      <button type="button" className="secondary-button export-button" onClick={exportUsage}><Download size={15} />{t('export')}</button>
    </div>

    <div className="stat-metrics">
      <article className="stat-metric stat-metric-primary"><span className="stat-icon"><Layers3 size={17} /></span><small>{t('tokens')}</small><strong>{formatAmount(summary.tokens, i18n.language)}</strong><span className="stat-caption">{t('demoSource')}</span></article>
      <article className="stat-metric"><span className="stat-icon"><Activity size={17} /></span><small>{t('activeTotal')}</small><strong>{formatDuration(summary.summedSeconds, i18n.language)}</strong><span className="stat-caption">Σ {t('agents').toLowerCase()} · {t('demo')}</span></article>
      <article className="stat-metric"><span className="stat-icon"><Clock3 size={17} /></span><small>{t('elapsed')}</small><strong>{formatDuration(summary.elapsedSeconds, i18n.language)}</strong><span className="stat-caption">{t('demo')}</span></article>
      <article className="stat-metric stat-metric-stone"><span className="stat-icon"><SpiritStoneIcon size={18} /></span><small>{t('earned')}</small><strong>{formatAmount(snapshot.treasury.earned, i18n.language)}</strong><span className="stat-caption">{t('illustrative')}</span></article>
    </div>

    <div className="statistics-grid">
      <section className="chart-panel surface-panel">
        <div className="chart-heading"><div><SectionTitle title={t('daily')} /><p>{t('relativeTokens')}</p></div><span className="chart-unit"><CalendarDays size={14} />{range === 'today' ? t('today') : range === 'week' ? t('week') : t('month')}</span></div>
        {chartData.length ? <div className="usage-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 12, left: -15, bottom: 0 }}>
          <defs><linearGradient id="jadeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#75a989" stopOpacity={.3} /><stop offset="96%" stopColor="#75a989" stopOpacity={.025} /></linearGradient></defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 5" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(value: string) => shortDate(value, i18n.language)} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value: number) => `${value}%`} domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ color: 'var(--text)', border: '1px solid var(--line)', borderRadius: 12, background: 'var(--surface)' }} formatter={(value) => [`${value}%`, t('tokens')]} labelFormatter={(value) => shortDate(String(value), i18n.language)} />
          <Area type="monotone" dataKey="tokens" stroke="#4f896c" strokeWidth={2.3} fill="url(#jadeFill)" activeDot={{ r: 4, strokeWidth: 0, fill: '#397a61' }} />
        </AreaChart></ResponsiveContainer></div> : <div className="chart-empty">{t('noData')}</div>}
      </section>

      <section className="quota-panel surface-panel">
        <SectionTitle title={t('quotaWindow')} />
        <div className="quota-list">{snapshot.quotas.map((quota) => <div className="quota-row" key={`${quota.sourceId}-${quota.windowLabel}`}>
          <div className="quota-row-top"><SourceBadge source={quota.sourceId} /><span>{quota.windowLabel === '5h' ? t('fiveHourWindow') : t('weekWindow')}</span>{quota.remainingPercent === null ? <strong className="quota-unknown">{t('unknownQuota')}</strong> : <strong>{quota.remainingPercent}% {t('remaining')}</strong>}</div>
          {quota.remainingPercent !== null ? <div className="quota-meter"><i style={{ width: `${quota.remainingPercent}%` }} /></div> : <p className="quota-reason">{quota.reason}</p>}
          <small>{quota.resetAt ? `${t('resets')} · ${new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(quota.resetAt))}` : quota.reason}</small>
        </div>)}</div>
      </section>

      <section className="agent-stats-panel surface-panel">
        <SectionTitle title={t('byAgent')} />
        <div className="agent-bars">{byAgent.map((agent) => {
          const ratio = Math.max(3, Number(BigInt(agent.tokens) * 10000n / BigInt(maxAgent)) / 100);
          return <div className="agent-bar-row" key={agent.id}><div className="agent-bar-label"><i style={{ background: agent.robeColor }} /><strong>{agent.name}</strong><small>{formatDuration(agent.activeSeconds, i18n.language)}</small></div><div className="agent-bar-track"><i style={{ width: `${ratio}%`, background: agent.robeColor }} /></div><span>{formatAmount(agent.tokens, i18n.language)}</span></div>;
        })}</div>
      </section>

      <section className="source-stats-panel surface-panel">
        <SectionTitle title={t('bySource')} />
        {bySource.map((item) => <div className="source-stat-row" key={item.id}><SourceBadge source={item.id as keyof typeof SOURCE_LABELS} /><span>{formatAmount(item.tokens, i18n.language)}</span></div>)}
        <div className="usage-breakdown"><div><span>{t('input')}</span><strong>{formatAmount(summary.fresh, i18n.language)}</strong></div><div><span>{t('cached')}</span><strong>{formatAmount(summary.cached, i18n.language)}</strong></div><div><span>{t('output')}</span><strong>{formatAmount(summary.output, i18n.language)}</strong></div></div>
      </section>
    </div>
    <p className="statistics-disclaimer"><Sparkles size={13} />{t('illustrative')}</p>
  </div>;
}
