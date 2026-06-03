export interface Client {
  _id: string;
  userId: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientPayload {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export type UpdateClientPayload = Partial<CreateClientPayload>;

export interface PaginatedClients {
  data: Client[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
