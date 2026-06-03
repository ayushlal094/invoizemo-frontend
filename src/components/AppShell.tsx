import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from './ToastProvider';
import { getInitials } from '../lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: GridIcon },
  { to: '/invoices', label: 'Invoices', icon: FileIcon },
  { to: '/clients', label: 'Clients', icon: UsersIcon },
];

const BOTTOM_ITEMS = [
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast('Signed out successfully');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        <div className="sidebar-logo">
          <span className="sidebar-logo-mark">
            <span className="sidebar-logo-dot" />
            invoizemo
          </span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Menu</span>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon className="nav-icon" />
              {label}
            </NavLink>
          ))}

          <span className="nav-section-label" style={{ marginTop: 8 }}>Account</span>
          {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon className="nav-icon" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-user w-full" onClick={handleLogout} title="Sign out">
            <div className="user-avatar">{user ? getInitials(user.name || user.email) : '?'}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || user?.email}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </button>
        </div>
      </aside>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────────────────

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 2H5a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 5 18h10a1.5 1.5 0 0 0 1.5-1.5V7.5L11 2z" />
      <path d="M11 2v5.5H16.5" strokeLinecap="round" />
      <path d="M7 11h6M7 14h4" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="7" r="3" />
      <path d="M2 17c0-3.314 2.686-5 6-5s6 1.686 6 5" strokeLinecap="round" />
      <path d="M14.5 4.5a2.5 2.5 0 1 1 0 5M18 17c0-2.485-1.5-4-3.5-4.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  );
}
