import { useParams, Link, useNavigate } from 'react-router-dom';
import { useInvoice, useUpdateInvoiceStatus, useDeleteInvoice } from '../features/invoices/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatCents, formatDate, getApiErrorMessage } from '../lib/utils';
import { useToast } from '../components/ToastProvider';
import { STATUS_TRANSITIONS, type InvoiceStatus } from '../features/invoices/types';

const STATUS_ACTION_LABELS: Partial<Record<InvoiceStatus, string>> = {
  sent: 'Mark as Sent',
  paid: 'Mark as Paid',
  overdue: 'Mark as Overdue',
  cancelled: 'Cancel Invoice',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: invoice, isLoading, error } = useInvoice(id ?? '');
  const statusMutation = useUpdateInvoiceStatus(id ?? '');
  const deleteMutation = useDeleteInvoice();

  if (isLoading) {
    return (
      <>
        <div className="topbar"><span className="topbar-title">Invoice</span></div>
        <div className="page-content flex items-center justify-center" style={{ padding: 80 }}>
          <span className="spinner" />
        </div>
      </>
    );
  }

  if (error || !invoice) {
    return (
      <>
        <div className="topbar"><span className="topbar-title">Invoice</span></div>
        <div className="page-content">
          <div className="alert alert-error">Invoice not found.</div>
          <Link to="/invoices" className="btn btn-ghost mt-4">← Back to invoices</Link>
        </div>
      </>
    );
  }

  const transitions = STATUS_TRANSITIONS[invoice.status] ?? [];
  const clientObj = typeof invoice.clientId === 'object' ? invoice.clientId : null;
  const canDelete = invoice.status === 'draft' || invoice.status === 'cancelled';

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    const label = STATUS_ACTION_LABELS[newStatus] ?? newStatus;
    if (!confirm(`${label}?`)) return;
    try {
      await statusMutation.mutateAsync({ status: newStatus });
      toast(`Invoice marked as ${newStatus}`);
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(invoice._id);
      toast(`${invoice.invoiceNumber} deleted`);
      navigate('/invoices');
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">
          <Link to="/invoices" className="text-muted" style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
            Invoices
          </Link>
          {' / '}
          <span className="font-mono">{invoice.invoiceNumber}</span>
        </span>
        <div className="topbar-actions">
          {invoice.status === 'draft' && (
            <Link to={`/invoices/${invoice._id}/edit`} className="btn btn-secondary btn-sm">
              Edit
            </Link>
          )}
          {transitions.map((status) => (
            <button
              key={status}
              className={`btn btn-sm ${status === 'cancelled' ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => handleStatusChange(status)}
              disabled={statusMutation.isPending}
            >
              {STATUS_ACTION_LABELS[status] ?? status}
            </button>
          ))}
          {canDelete && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="page-content animate-in">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
          {/* Main invoice card */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-mono text-accent" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {invoice.invoiceNumber}
                </div>
                <div className="text-muted text-sm mt-2">
                  Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
                </div>
              </div>
              <StatusBadge status={invoice.status as InvoiceStatus} />
            </div>

            {/* Client info */}
            {clientObj && (
              <div style={{ marginBottom: 28 }}>
                <div className="text-xs text-muted" style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Billed to</div>
                <div style={{ fontWeight: 500 }}>{clientObj.name}</div>
                <div className="text-secondary text-sm">{clientObj.email}</div>
              </div>
            )}

            {/* Line items */}
            <table className="line-items-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Description</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit price</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, i) => (
                  <tr key={i}>
                    <td style={{ paddingTop: 12, paddingBottom: 12 }}>{item.description}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {formatCents(item.unitPriceCents, invoice.currency)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      {formatCents(item.amountCents, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="line-items-totals">
              <div className="totals-row">
                <span>Subtotal</span>
                <span>{formatCents(invoice.subtotalCents, invoice.currency)}</span>
              </div>
              <div className="totals-row">
                <span>Tax ({(invoice.taxRate * 100).toFixed(0)}%)</span>
                <span>{formatCents(invoice.taxCents, invoice.currency)}</span>
              </div>
              <div className="totals-row total">
                <span>Total</span>
                <span>{formatCents(invoice.totalCents, invoice.currency)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div className="text-xs text-muted" style={{ marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Notes</div>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card-sm">
              <div className="text-xs text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Total due
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                {formatCents(invoice.totalCents, invoice.currency)}
              </div>
              <div className="text-xs text-muted mt-1">{invoice.currency}</div>
            </div>

            {clientObj && (
              <div className="card card-sm">
                <div className="text-xs text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  Client
                </div>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>{clientObj.name}</div>
                <div className="text-secondary text-sm">{clientObj.email}</div>
                <Link to={`/clients/${typeof invoice.clientId === 'string' ? invoice.clientId : clientObj._id}`}
                  className="btn btn-ghost btn-sm mt-4" style={{ width: '100%', justifyContent: 'center' }}>
                  View client →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
