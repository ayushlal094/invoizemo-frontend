import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { client } from '../lib/api/client';
import { getApiErrorMessage } from '../lib/utils';
import type { AuthUser } from '../auth/AuthProvider';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

type Fields = z.infer<typeof schema>;

interface RegisterResponse {
  success: true;
  data: { accessToken: string; user: AuthUser };
}

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Fields) => {
    setApiError('');
    try {
      const { data } = await client.post<RegisterResponse>('/auth/register', values);
      login(data.data.accessToken, data.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">invoizemo</div>

        <div>
          <h1 className="auth-heading">Create account</h1>
          <p className="auth-subheading">Start invoicing in under a minute</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {apiError && <div className="alert alert-error" role="alert">{apiError}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="form-input"
              placeholder="Jane Smith"
              {...register('name')}
            />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

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

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
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

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={isSubmitting}
            style={{ justifyContent: 'center' }}
          >
            {isSubmitting ? <><span className="spinner spinner-sm" /> Creating account…</> : 'Create account'}
          </button>
        </form>

        <div className="auth-form-footer" style={{ marginTop: 'auto', paddingTop: 24 }}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-illustration">
          <div className="auth-illustration-title">Your invoicing workflow, simplified</div>
          <p className="auth-illustration-sub">
            Join freelancers and small teams who send professional invoices and track payments with ease.
          </p>
        </div>
      </div>
    </div>
  );
}
