import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/api/client';
import type {
  Invoice,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  UpdateStatusPayload,
  PaginatedInvoices,
} from './types';

const INVOICES_KEY = ['invoices'] as const;

interface InvoiceFilters {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
}

// ── Queries ──────────────────────────────────────────────────────────────

export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery({
    queryKey: [...INVOICES_KEY, filters],
    queryFn: async () => {
      const { data } = await client.get<PaginatedInvoices>('/invoices', { params: filters });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: [...INVOICES_KEY, id],
    queryFn: async () => {
      const { data } = await client.get<{ success: true; data: Invoice }>(`/invoices/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateInvoicePayload) => {
      const { data } = await client.post<{ success: true; data: Invoice }>('/invoices', payload);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

export function useUpdateInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateInvoicePayload) => {
      const { data } = await client.patch<{ success: true; data: Invoice }>(
        `/invoices/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

export function useUpdateInvoiceStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateStatusPayload) => {
      const { data } = await client.patch<{ success: true; data: Invoice }>(
        `/invoices/${id}/status`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}
