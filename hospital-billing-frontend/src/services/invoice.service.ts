import { http } from './api';
import type {
  Invoice,
  CreateInvoiceFormData,
  PaginatedResponse,
} from '../types';

export interface InvoiceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InvoiceStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  cancelled: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  monthlyRevenue: Array<{
    month: string;
    amount: number;
  }>;
}

export interface PaymentData {
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
}

class InvoiceService {
  // Get all invoices with pagination and filtering
  async getInvoices(
    params: InvoiceQueryParams = {}
  ): Promise<PaginatedResponse<Invoice>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<Invoice>>(
      `/billing/invoices?${queryParams.toString()}`
    );
    return response;
  }

  // Get invoice by ID
  async getInvoiceById(id: string): Promise<Invoice> {
    const response = await http.get<Invoice>(`/billing/invoices/${id}`);
    return response;
  }

  // Create new invoice
  async createInvoice(invoiceData: CreateInvoiceFormData): Promise<Invoice> {
    const response = await http.post<Invoice>('/billing/invoices', invoiceData);
    return response;
  }

  // Update invoice
  async updateInvoice(
    id: string,
    invoiceData: Partial<CreateInvoiceFormData>
  ): Promise<Invoice> {
    const response = await http.patch<Invoice>(
      `/billing/invoices/${id}`,
      invoiceData
    );
    return response;
  }

  // Add charge to invoice
  async addChargeToInvoice(
    invoiceId: string,
    chargeData: {
      serviceId: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }
  ): Promise<Invoice> {
    const response = await http.post<Invoice>(
      `/billing/invoices/${invoiceId}/charges`,
      chargeData
    );
    return response;
  }

  // Remove charge from invoice
  async removeChargeFromInvoice(
    invoiceId: string,
    chargeId: string
  ): Promise<void> {
    await http.delete(`/billing/invoices/${invoiceId}/charges/${chargeId}`);
  }

  // Delete invoice
  async deleteInvoice(id: string): Promise<void> {
    await http.delete(`/billing/invoices/${id}`);
  }

  // Cancel invoice
  async cancelInvoice(id: string, reason?: string): Promise<Invoice> {
    const response = await http.post<Invoice>(
      `/billing/invoices/${id}/cancel`,
      {
        reason,
      }
    );
    return response;
  }

  // Get invoice statistics
  async getInvoiceStats(): Promise<InvoiceStats> {
    const response = await http.get<InvoiceStats>('/billing/invoices/stats');
    return response;
  }

  // Send invoice to patient
  async sendInvoice(id: string, email?: string): Promise<void> {
    const payload = email ? { email } : {};
    await http.post(`/billing/invoices/${id}/send`, payload);
  }

  // Generate invoice PDF
  async generateInvoicePDF(id: string): Promise<Blob> {
    const response = await http.get(`/billing/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  // Process payment for invoice
  async processPayment(id: string, paymentData: PaymentData): Promise<Invoice> {
    const response = await http.post<Invoice>(
      `/billing/invoices/${id}/payments`,
      paymentData
    );
    return response;
  }

  // Get invoice payments
  async getInvoicePayments(id: string): Promise<any[]> {
    const response = await http.get<any[]>(`/billing/invoices/${id}/payments`);
    return response;
  }

  // Mark invoice as paid
  async markAsPaid(id: string, paymentData: PaymentData): Promise<Invoice> {
    const response = await http.post<Invoice>(
      `/billing/invoices/${id}/mark-paid`,
      paymentData
    );
    return response;
  }

  // Get overdue invoices
  async getOverdueInvoices(): Promise<Invoice[]> {
    const response = await http.get<Invoice[]>('/billing/invoices/overdue');
    return response;
  }

  // Get recent invoices
  async getRecentInvoices(limit: number = 10): Promise<Invoice[]> {
    const response = await http.get<Invoice[]>(
      `/billing/invoices/recent?limit=${limit}`
    );
    return response;
  }

  // Duplicate invoice
  async duplicateInvoice(id: string): Promise<Invoice> {
    const response = await http.post<Invoice>(
      `/billing/invoices/${id}/duplicate`
    );
    return response;
  }

  // Apply discount to invoice
  async applyDiscount(
    id: string,
    discount: { type: 'percentage' | 'fixed'; value: number; reason?: string }
  ): Promise<Invoice> {
    const response = await http.post<Invoice>(
      `/billing/invoices/${id}/discount`,
      discount
    );
    return response;
  }

  // Get invoice templates
  async getInvoiceTemplates(): Promise<any[]> {
    const response = await http.get<any[]>('/billing/invoices/templates');
    return response;
  }

  // Create invoice from template
  async createFromTemplate(templateId: string, data: any): Promise<Invoice> {
    const response = await http.post<Invoice>(
      `/billing/invoices/templates/${templateId}`,
      data
    );
    return response;
  }

  // Process refund for payment
  async processRefund(
    paymentId: string,
    refundData: {
      amount: number;
      reason: string;
      processedBy: string;
      notes?: string;
    }
  ): Promise<any> {
    const response = await http.post<any>(
      `/billing/payments/${paymentId}/refunds`,
      refundData
    );
    return response;
  }

  // Get billing analytics
  async getBillingAnalytics(startDate: string, endDate: string): Promise<any> {
    const response = await http.get<any>(
      `/billing/analytics?startDate=${startDate}&endDate=${endDate}`
    );
    return response;
  }

  // Paystack Integration Endpoints
  async createInvoiceWithPaystack(
    invoiceData: CreateInvoiceFormData,
    lineItems?: Array<{ name: string; amount: number; quantity: number }>
  ): Promise<Invoice> {
    const payload = { ...invoiceData, lineItems };
    const response = await http.post<Invoice>(
      '/billing/paystack/invoices',
      payload
    );
    return response;
  }

  async getPaystackInvoices(
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const response = await http.get<any>(
      `/billing/paystack/invoices?page=${page}&limit=${limit}`
    );
    return response;
  }

  async getPaystackInvoiceDetails(id: string): Promise<any> {
    const response = await http.get<any>(`/billing/paystack/invoices/${id}`);
    return response;
  }

  async getPaystackPaymentStats(): Promise<any> {
    const response = await http.get<any>('/billing/paystack/stats');
    return response;
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
