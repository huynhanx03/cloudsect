import { lazy, Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { Moon, Settings2, Sun, Mountain, Globe2, Plus, ListTodo, ChartNoAxesCombined, PanelTopClose } from 'lucide-react';
import { useAppStore, type AppView } from './store';
import { formatAmount } from '../shared/format';
import { isTauriRuntime } from '../platform/contracts';
import { DialogShell, IconButton } from '../shared/ui/primitives';
import { AgentCreateDialog } from '../domains/agents/AgentCreateDialog';
import { SettingsDialog } from '../domains/settings/SettingsDialog';
import { TreasuryDrawer } from '../domains/treasury/TreasuryDrawer';
import { SpiritStoneIcon } from '../shared/ui/SpiritStoneIcon';
import '../shared/styles/application-dialogs.css';
import './App.css';

const SectScreen = lazy(() => import('../domains/sect/SectScreen'));
const TasksScreen = lazy(() => import('../domains/sessions/TasksScreen'));
const StatisticsScreen = lazy(() => import('../domains/statistics/StatisticsScreen'));

const navItems: Array<{ id: AppView; icon: typeof Mountain; label: string }> = [
  { id: 'sect', icon: Mountain, label: 'sect' },
  { id: 'tasks', icon: ListTodo, label: 'tasks' },
  { id: 'statistics', icon: ChartNoAxesCombined, label: 'statistics' },
];

export default function App() {
  const { t, i18n } = useTranslation();
  const snapshot = useAppStore((state) => state.snapshot);
  const loading = useAppStore((state) => state.loading);
  const view = useAppStore((state) => state.view);
  const boot = useAppStore((state) => state.boot);
  const setView = useAppStore((state) => state.setView);
  const apply = useAppStore((state) => state.apply);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [treasuryOpen, setTreasuryOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => { void boot(); }, [boot]);
  useEffect(() => { document.title = `CloudSect · ${t(view)}`; }, [i18n.language, t, view]);
  useEffect(() => {
    if (!snapshot) return;
    void i18n.changeLanguage(snapshot.preferences.locale);
    const preference = snapshot.preferences.theme;
    const dark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.motion = snapshot.preferences.motion;
  }, [snapshot?.preferences, i18n, snapshot]);

  if (loading && !snapshot) return <main className="boot-screen"><div className="boot-mark"><Mountain size={25} /></div><p>{t('appName')}</p></main>;
  if (!snapshot) return <main className="boot-screen"><div className="boot-mark"><Mountain size={25} /></div><h1>{t('error')}</h1><p>{t('loadError')}</p><button className="primary-button" onClick={() => void boot()}>{t('retry')}</button></main>;

  const viewTitle = t(view);
  const sessionCount = snapshot.sessions.filter((session) => !session.hidden).length;
  const theme = snapshot.preferences.theme;
  const activeTheme = document.documentElement.dataset.theme;

  const toggleTheme = () => {
    const next = activeTheme === 'dark' ? 'light' : 'dark';
    void apply({ kind: 'updatePreferences', patch: { theme: next } });
  };

  return <div className={`app-shell ${view === 'sect' ? 'is-world-first' : ''} ${compact ? 'is-compact' : ''}`}>
    <aside className="side-rail" aria-label={t('changeView')}>
      <div className="rail-mark" title={t('appName')}><Mountain size={23} strokeWidth={1.7} /></div>
      <div className="rail-divider" />
      <nav className="rail-nav" aria-label={t('changeView')}>
        {navItems.map(({ id, icon: Icon, label }) => <button key={id} type="button" className="rail-button" aria-label={t(label)} aria-current={view === id ? 'page' : undefined} title={t(label)} onClick={() => setView(id)}>
          <Icon size={20} strokeWidth={1.8} />
        </button>)}
      </nav>
      <div className="rail-bottom"><IconButton label={t('settings')} onClick={() => setSettingsOpen(true)}><Settings2 size={19} /></IconButton></div>
    </aside>

    <header className="app-header">
      <div className="brand-lockup"><div><h1 className="brand-name">CloudSect</h1><span className="brand-caption">{t('subtitle')}</span></div></div>
      <div className="header-actions">
        <span className="demo-pill"><i className="demo-dot" />{t('demo')}</span>
        <button type="button" className="stone-balance" onClick={() => setTreasuryOpen(true)} aria-label={`${t('spirit')}: ${formatAmount(snapshot.treasury.balance, i18n.language)}`}>
          <SpiritStoneIcon size={22} /><span><strong className="tabular">{formatAmount(snapshot.treasury.balance, i18n.language)}</strong><small>{t('spirit')}</small></span>
        </button>
        <button className="header-button language-button" onClick={() => void apply({ kind: 'updatePreferences', patch: { locale: i18n.language === 'vi' ? 'en' : 'vi' } })} aria-label={t('language')}><Globe2 size={16} /><span>{i18n.language === 'vi' ? 'VI' : 'EN'}</span></button>
        <IconButton label={activeTheme === 'dark' ? t('light') : t('dark')} onClick={toggleTheme}>{activeTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</IconButton>
        <IconButton label={compact ? t('expand') : t('compact')} onClick={() => {
          const next = !compact;
          setCompact(next);
          if (isTauriRuntime()) void invoke('set_window_mode', { mode: next ? 'compact' : 'full' }).catch(() => setCompact(false));
        }}>{compact ? <Plus size={17} /> : <PanelTopClose size={17} />}</IconButton>
        <IconButton label={t('settings')} onClick={() => setSettingsOpen(true)}><Settings2 size={17} /></IconButton>
      </div>
    </header>

    <main className="main-stage">
      <div className="section-head">
        <div><h2>{view === 'sect' ? t('welcome') : viewTitle}</h2><p>{view === 'sect' ? t('overview') : view === 'tasks' ? t('overview') : t('demoNote')}</p></div>
        <div className="section-head-actions">
          {view === 'sect' && <span className="session-total"><span className="session-total-count">{sessionCount}</span><span>{t('sessions').toLowerCase()}</span></span>}
          <button type="button" className="primary-button" onClick={() => setCreateOpen(true)}><Plus size={16} />{t('addAgent')}</button>
        </div>
      </div>
      <div className="content-scroll" key={view}>
        <Suspense fallback={<div className="view-loading" aria-label={t('demo')} />}>
          {view === 'sect' && <SectScreen onCreateAgent={() => setCreateOpen(true)} />}
          {view === 'tasks' && <TasksScreen />}
          {view === 'statistics' && <StatisticsScreen />}
        </Suspense>
      </div>
    </main>

    <AgentCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    <TreasuryDrawer open={treasuryOpen} onOpenChange={setTreasuryOpen} />
    {theme === 'system' && <span className="sr-only">{t('system')}</span>}
  </div>;
}

export function SimpleDialog({ title, open, onOpenChange, children }: {
  title: string; open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode;
}) {
  return <DialogShell title={title} open={open} onOpenChange={onOpenChange}>{children}</DialogShell>;
}
