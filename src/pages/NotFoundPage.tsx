import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="full-page-spinner" style={{ flexDirection: 'column', gap: 20, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '5rem', color: 'var(--accent)', lineHeight: 1 }}>
        404
      </div>
      <h2>Page not found</h2>
      <p className="text-secondary">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 8 }}>
        Go to dashboard
      </Link>
    </div>
  );
}
