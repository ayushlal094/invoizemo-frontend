import { useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCreateInvoice, useUpdateInvoice, useInvoice } from '../features/invoices/api';
import { useClients } from '../features/clients/api';
import { formatCents, getApiErrorMessage } from '../lib/utils';
import { useToast } from '../components/ToastProvider';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Required'),
  quantity: z.number({ invalid_type_error: 'Required' }).min(1, 'Min 1'),
  unitPriceCents: z.number({ invalid_type_error: 'Required' }).min(0, 'Min 0'),
});

const schema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  issueDate: z.string().min(1, 'Required'),
  dueDate: z.string().min(1, 'Required'),
  currency: z.string().min(1, 'Required'),
  taxRate: z.number({ invalid_type_error: 'Required' }).min(0).max(1),
  lineItems: z.array(lineItemSchema).min(1, 'Add at least one line item'),
  notes: z.string().optional(),
});

type Fields = z.infer<typeof schema>;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function InvoiceFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: existing } = useInvoice(id ?? '');
  const { data: clientsData } = useClients({ limit: 100 });
  const clients = clientsData?.data ?? [];

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice(id ?? '');

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: '',
      issueDate: todayStr(),
      dueDate: plusDays(30),
      currency: 'USD',
      taxRate: 0,
      lineItems: [{ description: '', quantity: 1, unitPriceCents: 0 }],
      notes: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existing && isEdit) {
      reset({
        clientId: typeof existing.clientId === 'string' ? existing.clientId : existing.clientId._id,
        issueDate: existing.issueDate.slice(0, 10),
        dueDate: existing.dueDate.slice(0, 10),
        currency: existing.currency,
        taxRate: existing.taxRate,
        lineItems: existing.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPriceCents: li.unitPriceCents,
        })),
        notes: existing.notes ?? '',
      });
    }
  }, [existing, isEdit, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  // Live totals
  const watchedItems = useWatch({ control, name: 'lineItems' });
  const watchedTaxRate = useWatch({ control, name: 'taxRate' }) ?? 0;
  const watchedCurrency = useWatch({ control, name: 'currency' }) ?? 'USD';

  const subtotalCents = (watchedItems ?? []).reduce((sum, item) => {
    const qty = Number(item?.quantity) || 0;
    const price = Number(item?.unitPriceCents) || 0;
    return sum + qty * price;
  }, 0);
  const taxCents = Math.round(subtotalCents * (Number(watchedTaxRate) || 0));
  const totalCents = subtotalCents + taxCents;

  const onSubmit = async (values: Fields) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(values);
        toast('Invoice updated');
        navigate(`/invoices/${id}`);
      } else {
        const created = await createMutation.mutateAsync(values);
        toast('Invoice created');
        navigate(`/invoices/${created._id}`);
      }
    } catch (err) {
      toast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">
          <Link to="/invoices" className="text-muted" style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
            Invoices
          </Link>
          {' / '}
          {isEdit ? 'Edit invoice' : 'New invoice'}
        </span>
      </div>

      <div className="page-content animate-in">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>

            {/* Main form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Client & dates */}
              <div className="card">
                <h3 style={{ marginBottom: 20, fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  Invoice details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="clientId">Client</label>
                    <select id="clientId" className="form-input" {...register('clientId')}>
                      <option value="">Select a client…</option>
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                      ))}
                    </select>
                    {errors.clientId && <span className="form-error">{errors.clientId.message}</span>}
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="issueDate">Issue date</label>
                      <input id="issueDate" type="date" className="form-input" {...register('issueDate')} />
                      {errors.issueDate && <span className="form-error">{errors.issueDate.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="dueDate">Due date</label>
                      <input id="dueDate" type="date" className="form-input" {...register('dueDate')} />
                      {errors.dueDate && <span className="form-error">{errors.dueDate.message}</span>}
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="currency">Currency</label>
                      <select id="currency" className="form-input" {...register('currency')}>
                        <option value="USD">USD — US Dollar</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="GBP">GBP — British Pound</option>
                        <option value="INR">INR — Indian Rupee</option>
                        <option value="CAD">CAD — Canadian Dollar</option>
                        <option value="AUD">AUD — Australian Dollar</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="taxRate">Tax rate (%)</label>
                      <input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="form-input"
                        placeholder="e.g. 18 for 18%"
                        {...register('taxRate', {
                          setValueAs: (v: string) => (v === '' ? 0 : parseFloat(v) / 100),
                        })}
                      />
                      {errors.taxRate && <span className="form-error">{errors.taxRate.message}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                    Line items
                  </h3>
                </div>

                {errors.lineItems?.root && (
                  <div className="alert alert-error mb-4">{errors.lineItems.root.message}</div>
                )}

                <table className="line-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Description</th>
                      <th style={{ width: '12%' }}>Qty</th>
                      <th style={{ width: '20%' }}>Unit price (cents)</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Amount</th>
                      <th style={{ width: '8%' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const qty = Number(watchedItems?.[index]?.quantity) || 0;
                      const price = Number(watchedItems?.[index]?.unitPriceCents) || 0;
                      const amount = qty * price;
                      return (
                        <tr key={field.id}>
                          <td>
                            <input
                              className="form-input"
                              placeholder="Service or product name"
                              {...register(`lineItems.${index}.description`)}
                            />
                            {errors.lineItems?.[index]?.description && (
                              <span className="form-error">{errors.lineItems[index]?.description?.message}</span>
                            )}
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              placeholder="in cents"
                              {...register(`lineItems.${index}.unitPriceCents`, { valueAsNumber: true })}
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 500, paddingRight: 8 }}>
                            {formatCents(amount, watchedCurrency)}
                          </td>
                          <td>
                            {fields.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm btn-icon"
                                onClick={() => remove(index)}
                                aria-label="Remove line item"
                                style={{ color: 'var(--red)' }}
                              >
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm mt-4"
                  onClick={() => append({ description: '', quantity: 1, unitPriceCents: 0 })}
                >
                  + Add line item
                </button>

                <div className="line-items-totals mt-4">
                  <div className="totals-row">
                    <span>Subtotal</span>
                    <span>{formatCents(subtotalCents, watchedCurrency)}</span>
                  </div>
                  <div className="totals-row">
                    <span>Tax ({((Number(watchedTaxRate) || 0) * 100).toFixed(0)}%)</span>
                    <span>{formatCents(taxCents, watchedCurrency)}</span>
                  </div>
                  <div className="totals-row total">
                    <span>Total</span>
                    <span>{formatCents(totalCents, watchedCurrency)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="card">
                <div className="form-group">
                  <label className="form-label" htmlFor="notes">Notes (optional)</label>
                  <textarea
                    id="notes"
                    className="form-input"
                    rows={3}
                    placeholder="Payment instructions, thank you message, terms…"
                    {...register('notes')}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 'calc(var(--topbar-h) + 28px)' }}>
              <div className="card card-sm">
                <div className="text-xs text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  Total
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                  {formatCents(totalCents, watchedCurrency)}
                </div>
                <div className="text-xs text-muted mt-1">{watchedCurrency}</div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isSubmitting}
                style={{ justifyContent: 'center', padding: '11px 22px' }}
              >
                {isSubmitting
                  ? <><span className="spinner spinner-sm" /> Saving…</>
                  : isEdit ? 'Save changes' : 'Create invoice'
                }
              </button>

              <Link to={isEdit ? `/invoices/${id}` : '/invoices'} className="btn btn-ghost w-full" style={{ justifyContent: 'center' }}>
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
