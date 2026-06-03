import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/AuthProvider';
import { client as apiClient } from '../lib/api/client';
import { useToast } from '../components/ToastProvider';
import { getApiErrorMessage } from '../lib/utils';
import type { AuthUser } from '../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

type Tab = 'profile' | 'sessions' | 'danger';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  defaultCurrency: z.string().min(1),
  timezone: z.string().min(1),
});
type ProfileFields = z.infer<typeof profileSchema>;

interface Session {
  _id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

interface SessionsResponse {
  success: true;
  data: Session[];
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Settings</span>
      </div>

      <div className="page-content animate-in">
        <div className="settings-grid">
          {/* Settings nav */}
          <nav className="settings-nav" aria-label="Settings sections">
            {([
              { id: 'profile', label: 'Profile' },
              { id: 'sessions', label: 'Active sessions' },
              { id: 'danger', label: 'Danger zone' },
            ] as { id: Tab; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                className={`settings-nav-link${tab === id ? ' active' : ''}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Panel */}
          <div>
            {tab === 'profile' && <ProfilePanel />}
            {tab === 'sessions' && <SessionsPanel />}
            {tab === 'danger' && <DangerPanel />}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Profile panel ─────────────────────────────────────────────────────────────

function ProfilePanel() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFields>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      defaultCurrency: user?.defaultCurrency ?? 'USD',
      timezone: user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const onSubmit = async (values: ProfileFields) => {
    try {
      const { data } = await apiClient.patch<{ success: true; data: AuthUser }>('/users/me', values);
      setUser(data.data);
      toast('Profile updated');
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await apiClient.get('/users/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-data.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('Data exported');
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ marginBottom: 4 }}>Profile</h2>
        <p className="text-secondary text-sm">Update your name and account preferences.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Full name</label>
          <input id="name" type="text" className="form-input" {...register('name')} />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Email address</label>
          <input type="email" className="form-input" value={user?.email ?? ''} disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          <span className="text-xs text-muted">Email cannot be changed.</span>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="defaultCurrency">Default currency</label>
            <select id="defaultCurrency" className="form-input" {...register('defaultCurrency')}>
              {['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="timezone">Timezone</label>
            <input id="timezone" type="text" className="form-input" placeholder="e.g. America/New_York" {...register('timezone')} />
          </div>
        </div>

        <div className="flex gap-3" style={{ marginTop: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? <><span className="spinner spinner-sm" /> Saving…</> : 'Save changes'}
          </button>
        </div>
      </form>

      {/* GDPR export */}
      <div className="card card-sm" style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>Data export</div>
        <p className="text-secondary text-sm" style={{ marginBottom: 14 }}>
          Download a copy of all your data in JSON format.
        </p>
        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          Download my data
        </button>
      </div>
    </div>
  );
}

// ── Sessions panel ────────────────────────────────────────────────────────────

function SessionsPanel() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<SessionsResponse>('/users/me/sessions');
      setSessions(data.data);
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useState(() => { void loadSessions(); });

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await apiClient.delete(`/users/me/sessions/${sessionId}`);
      toast('Session revoked');
      setSessions((prev) => prev?.filter((s) => s._id !== sessionId) ?? null);
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ marginBottom: 4 }}>Active sessions</h2>
        <p className="text-secondary text-sm">Devices currently logged in to your account. Revoke any you don't recognise.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ padding: 40 }}>
          <span className="spinner" />
        </div>
      ) : sessions === null ? (
        <div className="alert alert-error">Failed to load sessions.</div>
      ) : sessions.length === 0 ? (
        <div className="empty-state" style={{ padding: 40 }}>
          <h3>No sessions found</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map((s) => (
            <div key={s._id} className="card card-sm flex items-center justify-between gap-3">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: 2 }}>
                  {s.userAgent.slice(0, 60)}{s.userAgent.length > 60 ? '…' : ''}
                  {s.isCurrent && (
                    <span className="badge badge-paid" style={{ marginLeft: 8, fontSize: '0.7rem' }}>Current</span>
                  )}
                </div>
                <div className="text-muted text-xs">IP: {s.ip} · Last used: {new Date(s.lastUsedAt).toLocaleString()}</div>
              </div>
              {!s.isCurrent && (
                <button
                  className="btn btn-danger btn-sm"
                  disabled={revoking === s._id}
                  onClick={() => handleRevoke(s._id)}
                  style={{ flexShrink: 0 }}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Danger zone ───────────────────────────────────────────────────────────────

function DangerPanel() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const REQUIRED_TEXT = 'DELETE MY ACCOUNT';

  const handleDelete = async () => {
    if (confirmText !== REQUIRED_TEXT) return;
    setLoading(true);
    try {
      await apiClient.delete('/users/me', { data: { confirmText } });
      await logout();
      toast('Account deleted');
      navigate('/login');
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ marginBottom: 4 }}>Danger zone</h2>
        <p className="text-secondary text-sm">Irreversible actions. Proceed with caution.</p>
      </div>

      <div className="danger-zone">
        <div className="danger-zone-title">Delete account</div>
        <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>
          Permanently delete your account and all associated data — invoices, clients, and settings. This action <strong style={{ color: 'var(--text-primary)' }}>cannot be undone</strong>.
        </p>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" htmlFor="confirmDelete">
            Type <strong style={{ color: 'var(--text-primary)' }}>{REQUIRED_TEXT}</strong> to confirm
          </label>
          <input
            id="confirmDelete"
            type="text"
            className="form-input"
            placeholder={REQUIRED_TEXT}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>
        <button
          className="btn btn-danger"
          disabled={confirmText !== REQUIRED_TEXT || loading}
          onClick={handleDelete}
        >
          {loading ? <><span className="spinner spinner-sm" /> Deleting…</> : 'Delete my account'}
        </button>
      </div>
    </div>
  );
}
