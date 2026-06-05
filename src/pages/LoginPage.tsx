import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { client } from '../lib/api/client';
import { getApiErrorMessage } from '../lib/utils';
import type { AuthUser } from '../auth/AuthProvider';
import { env } from '../lib/env';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type Fields = z.infer<typeof schema>;

interface LoginResponse {
  success: true;
  data: { accessToken: string; user: AuthUser };
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';
  const oauthError = searchParams.get('error') === 'oauth_failed';

  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Fields) => {
    setApiError('');
    try {
      const { data } = await client.post<LoginResponse>('/auth/login', values);
      login(data.data.accessToken, data.data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    }
  };

  const handleGoogle = () => {
    window.location.href = `${env.VITE_API_BASE_URL}/api/v1/auth/google`;
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">invoizemo</div>

        <div>
          <h1 className="auth-heading">Welcome back</h1>
          <p className="auth-subheading">Sign in to manage your invoices</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {oauthError && (
            <div className="alert alert-error" role="alert">
              Google sign-in failed. Please try again or use email.
            </div>
          )}
          {apiError && <div className="alert alert-error" role="alert">{apiError}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email" type="email" autoComplete="email"
              className="form-input" placeholder="you@company.com"
              {...register('email')}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password" type="password" autoComplete="current-password"
              className="form-input" placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full"
            disabled={isSubmitting} style={{ justifyContent: 'center' }}>
            {isSubmitting ? <><span className="spinner spinner-sm" /> Signing in…</> : 'Sign in'}
          </button>

          <div className="auth-divider">or</div>

          <button type="button" className="btn btn-google" onClick={handleGoogle}>
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        <div className="auth-form-footer" style={{ marginTop: 'auto', paddingTop: 24 }}>
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-illustration">
          <div className="auth-illustration-title">Invoice smarter,<br />get paid faster</div>
          <p className="auth-illustration-sub">
            Create professional invoices, track payments, and manage your clients — all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.9v2.33A9 9 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.9A9 9 0 0 0 0 9c0 1.45.35 2.82.9 4.04l3.07-2.33z" fill="#FBBC05"/>
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.34L15.02 2.3A9 9 0 0 0 9 0a9 9 0 0 0-8.1 4.96l3.07 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
