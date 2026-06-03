import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices, useDeleteInvoice } from '../features/invoices/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatCents, formatDate, getApiErrorMessage } from '../lib/utils';
import { useToast } from '../components/ToastProvider';
import type { Invoice, InvoiceStatus } from '../features/invoices/types';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading } = useInvoices({ page, limit: 20, status: status || undefined });
  const deleteMutation = useDeleteInvoice();
  const { toast } = useToast();

  const invoices = data?.data ?? [];
  const pagination = data?.pagination;

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Delete ${invoiceNumber}? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast(`${invoiceNumber} deleted`);
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Invoices</span>
        <div className="topbar-actions">
          <Link to="/invoices/new" className="btn btn-primary btn-sm">
            + New invoice
          </Link>
        </div>
      </div>

      <div className="page-content animate-in">
        <div className="toolbar">
          <select
            className="filter-select"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
            {pagination ? `${pagination.total} invoice${pagination.total !== 1 ? 's' : ''}` : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center" style={{ padding: 64 }}>
            <span className="spinner" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <h3>No invoices found</h3>
            <p>{status ? 'Try a different filter.' : 'Create your first invoice to get started.'}</p>
            {!status && (
              <Link to="/invoices/new" className="btn btn-primary">Create invoice</Link>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <InvoiceRow
                    key={inv._id}
                    invoice={inv}
                    onDelete={() => handleDelete(inv._id, inv.invoiceNumber)}
                  />
                ))}
              </tbody>
            </table>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="pagination-controls">
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function InvoiceRow({ invoice, onDelete }: { invoice: Invoice; onDelete: () => void }) {
  const clientObj = typeof invoice.clientId === 'object' ? invoice.clientId : null;
  const canDelete = invoice.status === 'draft' || invoice.status === 'cancelled';

  return (
    <tr>
      <td>
        <Link to={`/invoices/${invoice._id}`} className="text-accent font-mono" style={{ fontSize: '0.85rem' }}>
          {invoice.invoiceNumber}
        </Link>
      </td>
      <td style={{ color: 'var(--text-secondary)' }}>{clientObj?.name ?? '—'}</td>
      <td><StatusBadge status={invoice.status as InvoiceStatus} /></td>
      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatDate(invoice.issueDate)}</td>
      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatDate(invoice.dueDate)}</td>
      <td style={{ textAlign: 'right', fontWeight: 500 }}>
        {formatCents(invoice.totalCents, invoice.currency)}
      </td>
      <td style={{ textAlign: 'right' }}>
        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
          <Link to={`/invoices/${invoice._id}`} className="btn btn-ghost btn-sm">View</Link>
          {invoice.status === 'draft' && (
            <Link to={`/invoices/${invoice._id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
          )}
          {canDelete && (
            <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
          )}
        </div>
      </td>
    </tr>
  );
}
