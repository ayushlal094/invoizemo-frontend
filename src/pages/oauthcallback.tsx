import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { client } from '../lib/api/client';
import { tokenStore } from '../auth/tokenStore';
import type { AuthUser } from '../auth/AuthProvider';

// Google redirects to: /oauth/callback?token=<accessToken>
// Grab token from URL → clear URL immediately → store in memory → fetch user → go to dashboard

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    // Clear token from URL bar immediately — never leave secrets in the URL
    window.history.replaceState({}, '', '/oauth/callback');

    if (error || !token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    async function finishLogin() {
      try {
        tokenStore.set(token!);
        const { data } = await client.get<{ data: AuthUser }>('/users/me');
        login(token!, data.data);
        navigate('/dashboard', { replace: true });
      } catch {
        tokenStore.clear();
        navigate('/login?error=oauth_failed', { replace: true });
      }
    }

    void finishLogin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="full-page-spinner">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 16px' }} />
        <p className="text-secondary text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}
