import type { InvoiceStatus } from '../features/invoices/types';
import { STATUS_LABELS } from '../features/invoices/types';

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>;
}
