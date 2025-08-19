export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  patient: {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
  };
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  issuedDate: Date;
  dueDate?: Date;
  notes?: string;
  charges: ChargeResponse[];
  payments: PaymentResponse[];
  paystackInvoiceId?: string;
  paystackReference?: string;
}

export interface ChargeResponse {
  id: string;
  service: {
    id: string;
    name: string;
    serviceCode: string;
  };
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentResponse {
  id: string;
  amount: number;
  method: string;
  status: string;
  processedAt: Date;
  notes?: string;
}

export interface InvoiceSearchResult {
  invoices: InvoiceResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChargeSearchResult {
  charges: ChargeResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
