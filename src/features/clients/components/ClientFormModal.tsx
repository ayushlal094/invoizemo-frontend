import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateClient, useUpdateClient } from '../api';
import { useToast } from '../../../components/ToastProvider';
import { getApiErrorMessage } from '../../../lib/utils';
import type { Client } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type Fields = z.infer<typeof schema>;

interface Props {
  client?: Client | null;
  onClose: () => void;
}

export function ClientFormModal({ client, onClose }: Props) {
  const isEdit = Boolean(client);
  const { toast } = useToast();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient(client?._id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        email: client.email,
        company: client.company ?? '',
        phone: client.phone ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
      });
    }
  }, [client, reset]);

  const onSubmit = async (values: Fields) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(values);
        toast('Client updated');
      } else {
        await createMutation.mutateAsync(values);
        toast('Client added');
      }
      onClose();
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal slide-up" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit client' : 'Add client'}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit client' : 'Add client'}</h2>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full name *</label>
                <input id="name" type="text" className="form-input" placeholder="Jane Smith" {...register('name')} />
                {errors.name && <span className="form-error">{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email *</label>
                <input id="email" type="email" className="form-input" placeholder="jane@company.com" {...register('email')} />
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="company">Company</label>
                <input id="company" type="text" className="form-input" placeholder="Acme Inc." {...register('company')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone</label>
                <input id="phone" type="tel" className="form-input" placeholder="+1 555 000 0000" {...register('phone')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">Address</label>
              <input id="address" type="text" className="form-input" placeholder="123 Main St, City, Country" {...register('address')} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">Notes</label>
              <textarea id="notes" className="form-input" rows={2} placeholder="Any additional notes…" {...register('notes')} style={{ resize: 'vertical' }} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? <><span className="spinner spinner-sm" /> Saving…</>
                : isEdit ? 'Save changes' : 'Add client'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
