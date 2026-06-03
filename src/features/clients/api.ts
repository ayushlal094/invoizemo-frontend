import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/api/client';
import type { Client, CreateClientPayload, UpdateClientPayload, PaginatedClients } from './types';

const CLIENTS_KEY = ['clients'] as const;

interface ClientFilters {
  page?: number;
  limit?: number;
  search?: string;
}

// ── Queries ──────────────────────────────────────────────────────────────

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: [...CLIENTS_KEY, filters],
    queryFn: async () => {
      const { data } = await client.get<PaginatedClients>('/clients', { params: filters });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: [...CLIENTS_KEY, id],
    queryFn: async () => {
      const { data } = await client.get<{ success: true; data: Client }>(`/clients/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateClientPayload) => {
      const { data } = await client.post<{ success: true; data: Client }>('/clients', payload);
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CLIENTS_KEY });
    },
  });
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateClientPayload) => {
      const { data } = await client.patch<{ success: true; data: Client }>(
        `/clients/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CLIENTS_KEY });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CLIENTS_KEY });
    },
  });
}
