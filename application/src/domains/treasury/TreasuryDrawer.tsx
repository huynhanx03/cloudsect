import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../app/store';
import { formatAmount } from '../../shared/format';
import { DialogShell } from '../../shared/ui/primitives';
import { SpiritStoneIcon } from '../../shared/ui/SpiritStoneIcon';

export function TreasuryDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t, i18n } = useTranslation();
  const treasury = useAppStore((state) => state.snapshot?.treasury);
  if (!treasury) return null;
  return <DialogShell title={t('spirit')} description={t('illustrative')} open={open} onOpenChange={onOpenChange}>
    <div className="treasury-balance"><SpiritStoneIcon size={34} /><div><strong>{formatAmount(treasury.balance, i18n.language)}</strong><span>{t('balance')}</span></div><div className="treasury-earned"><Sparkles size={15} /><span>{formatAmount(treasury.earned, i18n.language)} {t('earned').toLowerCase()}</span></div></div>
    <div className="treasury-rule"><span>1,000</span><SpiritStoneIcon size={18} /><span>1</span><small>{t('illustrative')}</small></div>
    <div className="ledger-list">{treasury.entries.map((entry) => <div className="ledger-row" key={entry.id}><span className="ledger-icon"><SpiritStoneIcon size={18} /></span><span><strong>{entry.description}</strong><small>{new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(entry.createdAt))}</small></span><b>+{formatAmount(entry.stones, i18n.language)}</b></div>)}</div>
  </DialogShell>;
}
