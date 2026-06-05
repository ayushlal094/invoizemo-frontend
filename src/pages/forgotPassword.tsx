import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { client } from '../lib/api/client';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});
type Fields = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Fields) => {
    // Always show success — backend never leaks if email exists
    await client.post('/auth/forgot-password', { email: values.email }).catch(() => {});
    setSubmittedEmail(values.email);
    setSent(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">invoizemo</div>

        {sent ? (
          <div className="animate-in">
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📧</div>
            <h1 className="auth-heading" style={{ marginBottom: 8 }}>Check your inbox</h1>
            <p className="auth-subheading" style={{ marginBottom: 32 }}>
              If <strong style={{ color: 'var(--text-primary)' }}>{submittedEmail}</strong> is
              registered, we've sent a reset link. It expires in 1 hour.
            </p>
            <div className="alert alert-warning" style={{ marginBottom: 24, fontSize: '0.85rem' }}>
              Don't see it? Check your spam folder.
            </div>
            <Link to="/login" className="btn btn-ghost" style={{ padding: 0 }}>
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <div className="animate-in">
            <h1 className="auth-heading">Forgot password?</h1>
            <p className="auth-subheading">
              Enter your email and we'll send you a reset link.
            </p>

            <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="form-input"
                  placeholder="you@company.com"
                  {...register('email')}
                />
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={isSubmitting}
                style={{ justifyContent: 'center' }}
              >
                {isSubmitting
                  ? <><span className="spinner spinner-sm" /> Sending…</>
                  : 'Send reset link'
                }
              </button>
            </form>

            <div className="auth-form-footer" style={{ marginTop: 24 }}>
              <Link to="/login" className="text-accent">← Back to sign in</Link>
            </div>
          </div>
        )}
      </div>

      <div className="auth-right">
        <div className="auth-illustration">
          <div className="auth-illustration-title">Reset in seconds,<br />back to invoicing</div>
          <p className="auth-illustration-sub">
            We'll send a secure link to your email. The link expires after 1 hour.
          </p>
        </div>
      </div>
    </div>
  );
}
