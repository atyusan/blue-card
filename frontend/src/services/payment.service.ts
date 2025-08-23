import { http } from './api';

export interface Payment {
  id: string;
  reference: string;
  amount: number;
  fee?: number;
  method: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
  patientId: string;
  invoiceId: string;
  notes?: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    patientId: string;
    phone?: string;
    email?: string;
  };
  invoice?: {
    id: string;
    invoiceNumber?: string;
    number?: string;
    totalAmount: number;
    balance?: number;
    dueDate: Date;
  };
}

export interface Refund {
  id: string;
  reference: string;
  originalPaymentId: string;
  originalPaymentReference: string;
  amount: number;
  reason: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
  method: string;
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
  patientId: string;
  notes?: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    patientId: string;
    phone?: string;
    email?: string;
  };
  originalPayment?: {
    amount: number;
    method: string;
    reference: string;
  };
}

export interface ProcessPaymentData {
  invoiceId: string;
  patientId: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  processDate: string;
  fee?: number;
  feeType?: 'FIXED' | 'PERCENTAGE';
  feeValue?: number;
  sendReceipt?: boolean;
  receiptEmail?: string;
}

export interface ProcessRefundData {
  paymentId: string;
  amount: number;
  reason: string;
  method: string;
  notes?: string;
  processDate: string;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentMethod?: string;
  dateRange?: string;
  patientId?: string;
  invoiceId?: string;
}

export interface RefundQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentMethod?: string;
  dateRange?: string;
  patientId?: string;
  paymentId?: string;
}

class PaymentService {
  // Get payments with pagination and filters
  async getPayments(params: PaymentQueryParams = {}): Promise<any> {
    const response = await http.get('/payments', { params });
    return response;
  }

  // Get a single payment by ID
  async getPayment(id: string): Promise<Payment> {
    const response = await http.get(`/payments/${id}`);
    return response as Payment;
  }

  // Process a new payment
  async processPayment(data: ProcessPaymentData): Promise<Payment> {
    const response = await http.post('/payments', data);
    return response as Payment;
  }

  // Update payment status
  async updatePaymentStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<Payment> {
    const response = await http.patch(`/payments/${id}/status`, {
      status,
      notes,
    });
    return response as Payment;
  }

  // Cancel a payment
  async cancelPayment(id: string, reason: string): Promise<Payment> {
    const response = await http.post(`/payments/${id}/cancel`, { reason });
    return response as Payment;
  }

  // Generate payment receipt PDF
  async generateReceiptPDF(id: string): Promise<Blob> {
    const response = await http.get(`/payments/${id}/receipt`, {
      responseType: 'blob',
    });
    return response as Blob;
  }

  // Get refunds with pagination and filters
  async getRefunds(params: RefundQueryParams = {}): Promise<any> {
    const response = await http.get('/payments/refunds', { params });
    return response;
  }

  // Get a single refund by ID
  async getRefund(id: string): Promise<Refund> {
    const response = await http.get(`/refunds/${id}`);
    return response as Refund;
  }

  // Process a new refund
  async processRefund(data: ProcessRefundData): Promise<Refund> {
    const response = await http.post('/refunds', data);
    return response as Refund;
  }

  // Approve refund
  async approveRefund(id: string): Promise<Refund> {
    const response = await http.post(`/payments/refunds/${id}/approve`);
    return response as Refund;
  }

  // Update refund status (legacy method - keeping for backward compatibility)
  async updateRefundStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<Refund> {
    const response = await http.patch(`/refunds/${id}/status`, {
      status,
      notes,
    });
    return response as Refund;
  }

  // Cancel a refund
  async cancelRefund(id: string, reason: string): Promise<Refund> {
    const response = await http.post(`/refunds/${id}/cancel`, { reason });
    return response as Refund;
  }

  // Get payment statistics
  async getPaymentStats(dateRange?: string): Promise<any> {
    const response = await http.get('/payments/stats', {
      params: { dateRange },
    });
    return response;
  }

  // Get refund statistics
  async getRefundStats(dateRange?: string): Promise<any> {
    const response = await http.get('/refunds/stats', {
      params: { dateRange },
    });
    return response;
  }

  // Export payments to CSV/Excel
  async exportPayments(
    params: PaymentQueryParams = {},
    format: 'csv' | 'excel' = 'csv'
  ): Promise<Blob> {
    const response = await http.get('/payments/export', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response as Blob;
  }

  // Export refunds to CSV/Excel
  async exportRefunds(
    params: RefundQueryParams = {},
    format: 'csv' | 'excel' = 'csv'
  ): Promise<Blob> {
    const response = await http.get('/refunds/export', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response as Blob;
  }

  // Bulk payment operations
  async bulkUpdatePaymentStatus(
    paymentIds: string[],
    status: string,
    notes?: string
  ): Promise<any> {
    const response = await http.post('/payments/bulk/status', {
      paymentIds,
      status,
      notes,
    });
    return response;
  }

  // Bulk refund operations
  async bulkUpdateRefundStatus(
    refundIds: string[],
    status: string,
    notes?: string
  ): Promise<any> {
    const response = await http.post('/refunds/bulk/status', {
      refundIds,
      status,
      notes,
    });
    return response;
  }

  // Get payment methods
  async getPaymentMethods(): Promise<string[]> {
    const response = await http.get('/payments/methods');
    return response as string[];
  }

  // Validate payment reference
  async validatePaymentReference(
    reference: string
  ): Promise<{ isValid: boolean; message: string }> {
    const response = await http.post('/payments/validate-reference', {
      reference,
    });
    return response as { isValid: boolean; message: string };
  }

  // Get payment history for a patient
  async getPatientPaymentHistory(
    patientId: string,
    params: PaymentQueryParams = {}
  ): Promise<any> {
    const response = await http.get(`/patients/${patientId}/payments`, {
      params,
    });
    return response;
  }

  // Get payment history for an invoice
  async getInvoicePaymentHistory(
    invoiceId: string,
    params: PaymentQueryParams = {}
  ): Promise<any> {
    const response = await http.get(`/invoices/${invoiceId}/payments`, {
      params,
    });
    return response;
  }

  // Generate payment receipt PDF
  async generatePaymentReceiptPDF(id: string): Promise<Blob> {
    const response = await http.get(`/payments/${id}/receipt/pdf`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  // Generate refund receipt PDF
  async generateRefundReceiptPDF(id: string): Promise<Blob> {
    const response = await http.get(`/payments/refunds/${id}/receipt/pdf`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  // Create refund
  async createRefund(refundData: {
    paymentId: string;
    amount: number;
    reason: string;
    notes?: string;
  }): Promise<any> {
    const response = await http.post('/payments/refunds', refundData);
    return response;
  }

  // Get refund by ID
  async getRefundById(id: string): Promise<any> {
    const response = await http.get(`/payments/refunds/${id}`);
    return response;
  }

  // Reject refund
  async rejectRefund(id: string, rejectionReason?: string): Promise<any> {
    // Use the new reject API endpoint with rejection reason
    const response = await http.post(`/payments/refunds/${id}/reject`, {
      rejectionReason: rejectionReason || 'Refund rejected by administrator',
    });
    return response;
  }

  // Delete refund
  async deleteRefund(id: string): Promise<any> {
    const response = await http.delete(`/payments/refunds/${id}`);
    return response;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
