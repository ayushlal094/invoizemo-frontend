import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useClient, useDeleteClient } from '../features/clients/api';
import { useInvoices } from '../features/invoices/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatCents, formatDate, getApiErrorMessage } from '../lib/utils';
import { useToast } from '../components/ToastProvider';
import { ClientFormModal } from '../features/clients/components/ClientFormModal';
import type { InvoiceStatus } from '../features/invoices/types';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState(false);

  const { data: client, isLoading, error } = useClient(id ?? '');
  const { data: invoicesData } = useInvoices({ clientId: id, limit: 50 });
  const deleteMutation = useDeleteClient();
  const invoices = invoicesData?.data ?? [];

  if (isLoading) {
    return (
      <>
        <div className="topbar"><span className="topbar-title">Client</span></div>
        <div className="page-content flex items-center justify-center" style={{ padding: 80 }}>
          <span className="spinner" />
        </div>
      </>
    );
  }

  if (error || !client) {
    return (
      <>
        <div className="topbar"><span className="topbar-title">Client</span></div>
        <div className="page-content">
          <div className="alert alert-error">Client not found.</div>
          <Link to="/clients" className="btn btn-ghost mt-4">← Back to clients</Link>
        </div>
      </>
    );
  }

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalCents, 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.totalCents, 0);

  const handleDelete = async () => {
    if (!confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(client._id);
      toast(`${client.name} deleted`);
      navigate('/clients');
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">
          <Link to="/clients" className="text-muted" style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
            Clients
          </Link>
          {' / '}
          {client.name}
        </span>
        <div className="topbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
          <Link to="/invoices/new" className="btn btn-primary btn-sm">+ Invoice</Link>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="page-content animate-in">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>

          {/* Left: invoices */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                Invoices ({invoices.length})
              </h2>
            </div>

            {invoices.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <h3>No invoices yet</h3>
                <p>Create an invoice for {client.name} to get started.</p>
                <Link to="/invoices/new" className="btn btn-primary">Create invoice</Link>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Status</th>
                      <th>Due</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td>
                          <Link to={`/invoices/${inv._id}`} className="text-accent font-mono" style={{ fontSize: '0.85rem' }}>
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td><StatusBadge status={inv.status as InvoiceStatus} /></td>
                        <td className="text-secondary text-sm">{formatDate(inv.dueDate)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 500 }}>
                          {formatCents(inv.totalCents, inv.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right: client card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card-sm">
              <div className="text-xs text-muted mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Client info
              </div>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{client.name}</div>
              <div className="text-secondary text-sm">{client.email}</div>
              {client.company && <div className="text-muted text-sm">{client.company}</div>}
              {client.phone && <div className="text-muted text-sm mt-1">{client.phone}</div>}
              {client.address && <div className="text-muted text-sm">{client.address}</div>}
              {client.notes && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div className="text-xs text-muted mb-1" style={{ fontWeight: 600 }}>Notes</div>
                  <p className="text-secondary" style={{ fontSize: '0.82rem' }}>{client.notes}</p>
                </div>
              )}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Added {formatDate(client.createdAt)}
              </div>
            </div>

            <div className="card card-sm">
              <div className="text-xs text-muted mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Billing summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Total billed</span>
                  <span style={{ fontWeight: 500 }}>{formatCents(totalBilled)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Total paid</span>
                  <span className="text-green" style={{ fontWeight: 500 }}>{formatCents(totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <span className="text-secondary">Outstanding</span>
                  <span style={{ fontWeight: 600 }}>{formatCents(totalBilled - totalPaid)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <ClientFormModal client={client} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
}
