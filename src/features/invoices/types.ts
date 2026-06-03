export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface LineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  amountCents: number;
}

export interface Invoice {
  _id: string;
  userId: string;
  clientId: string | PopulatedClient;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  taxRate: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedClient {
  _id: string;
  name: string;
  email: string;
  company?: string;
}

export interface CreateInvoicePayload {
  clientId: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  currency: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  notes?: string;
}

export type UpdateInvoicePayload = Partial<CreateInvoicePayload>;

export interface UpdateStatusPayload {
  status: InvoiceStatus;
}

export interface PaginatedInvoices {
  data: Invoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Valid status transitions matching backend rules
export const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['paid', 'overdue', 'cancelled'],
  overdue: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
};

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};
