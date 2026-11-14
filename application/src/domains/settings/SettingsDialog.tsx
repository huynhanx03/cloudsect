import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../app/store';
import { DialogShell } from '../../shared/ui/primitives';
import type { Preferences } from '../workspace/model';

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const prefs = useAppStore((state) => state.snapshot?.preferences);
  const apply = useAppStore((state) => state.apply);
  if (!prefs) return null;
  const change = <K extends keyof Preferences>(key: K, value: Preferences[K]) => void apply({ kind: 'updatePreferences', patch: { [key]: value } });
  return <DialogShell title={t('settings')} description={t('demoNote')} open={open} onOpenChange={onOpenChange}>
    <div className="settings-list">
      <label className="settings-row"><span><strong>{t('language')}</strong><small>VI · EN</small></span><select className="select-input settings-select" value={prefs.locale} onChange={(event) => change('locale', event.target.value as Preferences['locale'])}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
      <label className="settings-row"><span><strong>{t('theme')}</strong><small>{t('appearance')}</small></span><select className="select-input settings-select" value={prefs.theme} onChange={(event) => change('theme', event.target.value as Preferences['theme'])}><option value="system">{t('system')}</option><option value="light">{t('light')}</option><option value="dark">{t('dark')}</option></select></label>
      <label className="settings-row"><span><strong>{t('motion')}</strong><small>{t('reduced')}</small></span><select className="select-input settings-select" value={prefs.motion} onChange={(event) => change('motion', event.target.value as Preferences['motion'])}><option value="system">{t('system')}</option><option value="reduced">{t('reduced')}</option><option value="full">{t('fullMotion')}</option></select></label>
      <label className="settings-row"><span><strong>{t('quality')}</strong><small>{t('automatic')}</small></span><select className="select-input settings-select" value={prefs.quality} onChange={(event) => change('quality', event.target.value as Preferences['quality'])}><option value="auto">{t('automatic')}</option><option value="balanced">{t('balanced')}</option><option value="low">{t('low')}</option></select></label>
    </div>
  </DialogShell>;
}
