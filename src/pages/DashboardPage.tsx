import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useInvoices } from '../features/invoices/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatCents, formatDate } from '../lib/utils';
import type { Invoice, InvoiceStatus } from '../features/invoices/types';

const STATUS_COLORS: Record<string, string> = {
  all: 'var(--accent)',
  paid: 'var(--green)',
  overdue: 'var(--red)',
  sent: 'var(--blue)',
  draft: 'var(--text-muted)',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useInvoices({ limit: 100 });

  const invoices = data?.data ?? [];
  const totalInvoices = data?.pagination.total ?? 0;

  const revenue = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalCents, 0);

  const overdue = invoices.filter((inv) => inv.status === 'overdue').length;
  const outstanding = invoices
    .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.totalCents, 0);

  const recent = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 7);

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Dashboard</span>
        <div className="topbar-actions">
          <Link to="/invoices/new" className="btn btn-primary btn-sm">
            + New invoice
          </Link>
        </div>
      </div>

      <div className="page-content animate-in">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-header-title">
              Good {getGreeting()}, {firstName(user?.name ?? user?.email ?? '')}
            </h1>
            <p className="page-header-sub">Here's an overview of your invoicing activity.</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard
            label="Total invoices"
            value={String(totalInvoices)}
            sub="all time"
            color={STATUS_COLORS.all}
            loading={isLoading}
          />
          <StatCard
            label="Revenue collected"
            value={formatCents(revenue)}
            sub="paid invoices"
            color={STATUS_COLORS.paid}
            loading={isLoading}
          />
          <StatCard
            label="Outstanding"
            value={formatCents(outstanding)}
            sub="sent + overdue"
            color={STATUS_COLORS.sent}
            loading={isLoading}
          />
          <StatCard
            label="Overdue"
            value={String(overdue)}
            sub={overdue === 1 ? 'invoice' : 'invoices'}
            color={overdue > 0 ? STATUS_COLORS.overdue : STATUS_COLORS.all}
            loading={isLoading}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            Recent invoices
          </h2>
          <Link to="/invoices" className="btn btn-ghost btn-sm text-accent">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center" style={{ padding: 48 }}>
            <span className="spinner" />
          </div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <h3>No invoices yet</h3>
            <p>Create your first invoice to get started.</p>
            <Link to="/invoices/new" className="btn btn-primary">
              Create invoice
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((inv) => (
                  <InvoiceRow key={inv._id} invoice={inv} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const client = typeof invoice.clientId === 'object' ? invoice.clientId : null;
  return (
    <tr>
      <td>
        <Link to={`/invoices/${invoice._id}`} className="text-accent font-mono" style={{ fontSize: '0.85rem' }}>
          {invoice.invoiceNumber}
        </Link>
      </td>
      <td style={{ color: 'var(--text-secondary)' }}>{client?.name ?? '—'}</td>
      <td><StatusBadge status={invoice.status as InvoiceStatus} /></td>
      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        {formatDate(invoice.dueDate)}
      </td>
      <td style={{ textAlign: 'right', fontWeight: 500 }}>
        {formatCents(invoice.totalCents, invoice.currency)}
      </td>
    </tr>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  color: string;
  loading: boolean;
}

function StatCard({ label, value, sub, color, loading }: StatCardProps) {
  return (
    <div className="stat-card" style={{ '--accent-color': color } as React.CSSProperties}>
      <div className="stat-card-label">{label}</div>
      {loading ? (
        <div className="stat-card-value" style={{ opacity: 0.3 }}>—</div>
      ) : (
        <div className="stat-card-value">{value}</div>
      )}
      <div className="stat-card-sub">{sub}</div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function firstName(name: string) {
  return name.split(' ')[0] || name;
}
