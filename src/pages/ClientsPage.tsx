import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useClients, useDeleteClient } from '../features/clients/api';
import { formatDate, getApiErrorMessage } from '../lib/utils';
import { useToast } from '../components/ToastProvider';
import { ClientFormModal } from '../features/clients/components/ClientFormModal';
import type { Client } from '../features/clients/types';

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);

  const { data, isLoading } = useClients({ page, limit: 20, search: debouncedSearch || undefined });
  const deleteMutation = useDeleteClient();
  const { toast } = useToast();

  const clients = data?.data ?? [];
  const pagination = data?.pagination;

  // Simple debounce on search input
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    clearTimeout((window as unknown as { _searchTimer?: number })._searchTimer);
    (window as unknown as { _searchTimer?: number })._searchTimer = window.setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 350);
  }, []);

  const handleEdit = (client: Client) => {
    setEditTarget(client);
    setShowModal(true);
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(client._id);
      toast(`${client.name} deleted`);
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditTarget(null);
  };

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Clients</span>
        <div className="topbar-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            + Add client
          </button>
        </div>
      </div>

      <div className="page-content animate-in">
        <div className="toolbar">
          <div className="search-input-wrap">
            <span className="search-icon">
              <SearchIcon />
            </span>
            <input
              type="search"
              className="search-input"
              placeholder="Search clients…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Search clients"
            />
          </div>
          <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
            {pagination ? `${pagination.total} client${pagination.total !== 1 ? 's' : ''}` : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center" style={{ padding: 64 }}>
            <span className="spinner" />
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <h3>{debouncedSearch ? 'No clients found' : 'No clients yet'}</h3>
            <p>{debouncedSearch ? 'Try a different search term.' : 'Add your first client to start invoicing.'}</p>
            {!debouncedSearch && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add client</button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Added</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <Link to={`/clients/${c._id}`} style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {c.name}
                      </Link>
                    </td>
                    <td className="text-secondary">{c.email}</td>
                    <td className="text-secondary">{c.company ?? '—'}</td>
                    <td className="text-secondary text-sm">{formatDate(c.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <Link to={`/clients/${c._id}`} className="btn btn-ghost btn-sm">View</Link>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <div className="pagination-controls">
                  <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                  <button className="btn btn-ghost btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <ClientFormModal client={editTarget} onClose={handleModalClose} />
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3 3" strokeLinecap="round" />
    </svg>
  );
}
