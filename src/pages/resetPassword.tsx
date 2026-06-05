import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { client } from '../lib/api/client';
import { getApiErrorMessage } from '../lib/utils';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type Fields = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [apiError, setApiError] = useState('');
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Fields) => {
    setApiError('');
    try {
      await client.post('/auth/reset-password', {
        token,
        password: values.password,
      });
      setDone(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-brand">invoizemo</div>
          <div className="alert alert-error" style={{ marginTop: 40 }}>
            Invalid reset link. Please request a new one.
          </div>
          <Link to="/forgot-password" className="btn btn-primary mt-4">
            Request new link
          </Link>
        </div>
        <div className="auth-right" />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">invoizemo</div>

        {done ? (
          <div className="animate-in">
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✅</div>
            <h1 className="auth-heading" style={{ marginBottom: 8 }}>Password reset!</h1>
            <p className="auth-subheading">
              Your password has been changed. Redirecting you to sign in…
            </p>
            <Link to="/login" className="btn btn-primary mt-6" style={{ display: 'inline-flex' }}>
              Sign in now
            </Link>
          </div>
        ) : (
          <div className="animate-in">
            <h1 className="auth-heading">Set new password</h1>
            <p className="auth-subheading">Choose a strong password for your account.</p>

            <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
              {apiError && (
                <div className="alert alert-error" role="alert">
                  {apiError}
                  {apiError.toLowerCase().includes('expired') && (
                    <span>
                      {' '}
                      <Link to="/forgot-password" style={{ color: 'inherit', textDecoration: 'underline' }}>
                        Request a new link
                      </Link>
                    </span>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="form-input"
                  placeholder="At least 8 characters"
                  {...register('password')}
                />
                {errors.password && <span className="form-error">{errors.password.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="form-input"
                  placeholder="Repeat your password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <span className="form-error">{errors.confirmPassword.message}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={isSubmitting}
                style={{ justifyContent: 'center' }}
              >
                {isSubmitting
                  ? <><span className="spinner spinner-sm" /> Resetting…</>
                  : 'Reset password'
                }
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="auth-right">
        <div className="auth-illustration">
          <div className="auth-illustration-title">Almost there</div>
          <p className="auth-illustration-sub">
            After resetting, all your active sessions will be signed out for security.
          </p>
        </div>
      </div>
    </div>
  );
}
