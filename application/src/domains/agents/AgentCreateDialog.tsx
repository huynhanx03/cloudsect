import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../app/store';
import { DialogShell } from '../../shared/ui/primitives';
import { ROBE_COLORS } from './palette';

export function AgentCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  const apply = useAppStore((state) => state.apply);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(ROBE_COLORS[0]);
  const [error, setError] = useState<'name' | 'save' | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if ([...name.trim()].length < 1 || [...name.trim()].length > 40) { setError('name'); return; }
    setSaving(true);
    const saved = await apply({ kind: 'createAgent', name, robeColor: color });
    setSaving(false);
    if (saved) { setName(''); setError(null); onOpenChange(false); }
    else setError('save');
  };
  return <DialogShell title={t('newAgent')} description={t('createIsland')} open={open} onOpenChange={onOpenChange} footer={
    <><button className="secondary-button" onClick={() => onOpenChange(false)}>{t('cancel')}</button><button className="primary-button" onClick={() => void save()} disabled={saving}>{t('create')}</button></>
  }>
    <label className="field-label" htmlFor="agent-name">{t('agentName')}</label>
    <input id="agent-name" className="text-input" autoFocus value={name} maxLength={40} onChange={(event) => { setName(event.target.value); setError(null); }} onKeyDown={(event) => { if (event.key === 'Enter') void save(); }} />
    {error && <p className="field-error">{t(error === 'name' ? 'nameRequired' : 'saveError')}</p>}
    <div className="color-field"><span className="field-label">{t('robeColor')}</span><div className="color-swatches" role="radiogroup" aria-label={t('robeColor')}>
      {ROBE_COLORS.map((swatch) => <button type="button" key={swatch} className={`color-swatch ${color === swatch ? 'is-selected' : ''}`} style={{ '--swatch': swatch } as React.CSSProperties} role="radio" aria-checked={color === swatch} aria-label={swatch} onClick={() => setColor(swatch)} />)}
    </div></div>
    <p className="field-hint">{t('createIsland')}</p>
  </DialogShell>;
}
