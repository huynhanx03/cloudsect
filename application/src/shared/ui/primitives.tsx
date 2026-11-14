import * as Dialog from '@radix-ui/react-dialog';
import type { PropsWithChildren, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProviderId, SessionStatus } from '../../domains/workspace/model';
import { SOURCE_LABELS } from '../../domains/workspace/model';
import { providerColor } from '../format';
import '../../shared/styles/components.css';

export function IconButton({ label, children, onClick, className = '' }: PropsWithChildren<{
  label: string; onClick?: () => void; className?: string;
}>) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

export function StatusBadge({ status, label }: { status: SessionStatus; label: string }) {
  return <span className={`status-badge status-${status}`}><i aria-hidden="true" />{label}</span>;
}

export function SourceBadge({ source }: { source: ProviderId }) {
  return <span className="source-badge" style={{ '--source-color': providerColor[source] } as React.CSSProperties}>{SOURCE_LABELS[source]}</span>;
}

export function DialogShell({ title, description, open, onOpenChange, children, footer }: PropsWithChildren<{
  title: string; description?: string; open: boolean; onOpenChange: (open: boolean) => void; footer?: ReactNode;
}>) {
  const { t } = useTranslation();
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="dialog-content">
        <div className="dialog-head"><div><Dialog.Title className="dialog-title">{title}</Dialog.Title>
          {description && <Dialog.Description className="dialog-description">{description}</Dialog.Description>}</div>
          <Dialog.Close asChild><button className="icon-button" aria-label={t('close')}><X size={17} /></button></Dialog.Close>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="section-title-row"><h2>{title}</h2>{action}</div>;
}

export function MetricLine({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div className="metric-line">{icon && <span className="metric-icon">{icon}</span>}<span>{label}</span><strong>{value}</strong></div>;
}

