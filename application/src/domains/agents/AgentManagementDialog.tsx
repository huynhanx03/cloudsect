import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../app/store';
import type { Agent, Island } from '../workspace/model';
import { DialogShell } from '../../shared/ui/primitives';
import { ROBE_COLORS } from './palette';

export function AgentManagementDialog({ agent, island, open, onOpenChange }: {
  agent: Agent;
  island: Island;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const apply = useAppStore((state) => state.apply);
  const [name, setName] = useState(agent.name);
  const [islandName, setIslandName] = useState(island.name);
  const [color, setColor] = useState(agent.robeColor);
  const [error, setError] = useState<'name' | 'save' | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const validName = (value: string) => [...value.trim()].length > 0 && [...value.trim()].length <= 40;
    if (!validName(name) || !validName(islandName)) { setError('name'); return; }
    setSaving(true);
    const saved = await apply({ kind: 'updateAgentProfile', agentId: agent.id, name, islandName, robeColor: color });
    setSaving(false);
    if (saved) onOpenChange(false);
    else setError('save');
  };

  return <DialogShell title={t('manageDaoist')} description={t('profileDescription')} open={open} onOpenChange={onOpenChange} footer={
    <><button type="button" className="secondary-button" onClick={() => onOpenChange(false)}>{t('cancel')}</button><button type="button" className="primary-button" onClick={() => void save()} disabled={saving}>{t('save')}</button></>
  }>
    <label className="field-block"><span className="field-label">{t('agentName')}</span><input className="text-input" autoFocus value={name} maxLength={40} onChange={(event) => { setName(event.target.value); setError(null); }} /></label>
    <label className="field-block"><span className="field-label">{t('islandName')}</span><input className="text-input" value={islandName} maxLength={40} onChange={(event) => { setIslandName(event.target.value); setError(null); }} /></label>
    <div className="color-field"><span className="field-label">{t('robeColor')}</span><div className="color-swatches" role="radiogroup" aria-label={t('robeColor')}>
      {ROBE_COLORS.map((swatch) => <button type="button" key={swatch} className={`color-swatch ${color === swatch ? 'is-selected' : ''}`} style={{ '--swatch': swatch } as React.CSSProperties} role="radio" aria-checked={color === swatch} aria-label={swatch} onClick={() => setColor(swatch)} />)}
    </div></div>
    {error && <p className="field-error">{t(error === 'name' ? 'nameRequired' : 'saveError')}</p>}
  </DialogShell>;
}
