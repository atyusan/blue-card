import { http } from './api';

export interface Payment {
  id: string;
  invoiceId: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    patientName: string;
    totalAmount: number;
  };
  amount: number;
  paymentMethod:
    | 'CASH'
    | 'CARD'
    | 'BANK_TRANSFER'
    | 'MOBILE_MONEY'
    | 'PAYSTACK'
    | 'OTHER';
  paymentDate: string;
  reference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  processedBy: string;
  processor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  notes?: string;
  transactionId?: string;
  cardLast4?: string;
  bankName?: string;
  accountNumber?: string;
  mobileMoneyProvider?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentData {
  invoiceId: string;
  amount: number;
  paymentMethod:
    | 'CASH'
    | 'CARD'
    | 'BANK_TRANSFER'
    | 'MOBILE_MONEY'
    | 'PAYSTACK'
    | 'OTHER';
  reference?: string;
  notes?: string;
  cardLast4?: string;
  bankName?: string;
  accountNumber?: string;
  mobileMoneyProvider?: string;
  phoneNumber?: string;
}

export interface UpdatePaymentData {
  amount?: number;
  paymentMethod?:
    | 'CASH'
    | 'CARD'
    | 'BANK_TRANSFER'
    | 'MOBILE_MONEY'
    | 'PAYSTACK'
    | 'OTHER';
  reference?: string;
  notes?: string;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
}

export interface Refund {
  id: string;
  paymentId: string;
  payment: Payment;
  amount: number;
  reason: string;
  processedBy: string;
  processor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundData {
  paymentId: string;
  amount: number;
  reason: string;
  notes?: string;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentMethod?: string;
  invoiceId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class PaymentService {
  // ===== PAYMENT MANAGEMENT =====

  // Create new payment
  async createPayment(paymentData: CreatePaymentData): Promise<Payment> {
    const response = await http.post<Payment>('/payments', paymentData);
    return response;
  }

  // Get all payments with pagination and filtering
  async getPayments(
    params: PaymentQueryParams = {}
  ): Promise<PaginatedResponse<Payment>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<Payment>>(
      `/payments?${queryParams.toString()}`
    );
    return response;
  }

  // Get payment by ID
  async getPaymentById(id: string): Promise<Payment> {
    const response = await http.get<Payment>(`/payments/${id}`);
    return response;
  }

  // Update payment
  async updatePayment(
    id: string,
    paymentData: UpdatePaymentData
  ): Promise<Payment> {
    const response = await http.patch<Payment>(`/payments/${id}`, paymentData);
    return response;
  }

  // ===== REFUND MANAGEMENT =====

  // Create refund request
  async createRefund(refundData: CreateRefundData): Promise<Refund> {
    const response = await http.post<Refund>('/payments/refunds', refundData);
    return response;
  }

  // Approve refund
  async approveRefund(refundId: string, approvedBy: string): Promise<Refund> {
    const response = await http.post<Refund>(
      `/payments/refunds/${refundId}/approve`,
      {
        approvedBy,
      }
    );
    return response;
  }

  // Reject refund
  async rejectRefund(
    refundId: string,
    rejectionData: { reason: string; rejectedBy: string }
  ): Promise<Refund> {
    const response = await http.post<Refund>(
      `/payments/refunds/${refundId}/reject`,
      rejectionData
    );
    return response;
  }

  // ===== ENHANCED FEATURES =====

  // Verify payment before service
  async verifyPayment(invoiceId: string): Promise<{
    isVerified: boolean;
    paymentStatus: string;
    paidAmount: number;
    outstandingAmount: number;
    lastPaymentDate?: string;
  }> {
    const response = await http.get(`/payments/verify/${invoiceId}`);
    return response as {
      isVerified: boolean;
      paymentStatus: string;
      paidAmount: number;
      outstandingAmount: number;
      lastPaymentDate?: string;
    };
  }

  // Get payment methods breakdown
  async getPaymentMethodsBreakdown(): Promise<{
    totalPayments: number;
    byMethod: Record<
      string,
      { count: number; amount: number; percentage: number }
    >;
    byStatus: Record<
      string,
      { count: number; amount: number; percentage: number }
    >;
  }> {
    const response = await http.get('/payments/methods-breakdown');
    return response as {
      totalPayments: number;
      byMethod: Record<
        string,
        { count: number; amount: number; percentage: number }
      >;
      byStatus: Record<
        string,
        { count: number; amount: number; percentage: number }
      >;
    };
  }

  // Get reconciliation report
  async getReconciliationReport(
    startDate: string,
    endDate: string
  ): Promise<{
    totalPayments: number;
    totalRefunds: number;
    netAmount: number;
    byMethod: Record<
      string,
      { payments: number; refunds: number; net: number }
    >;
    byDay: Array<{
      date: string;
      payments: number;
      refunds: number;
      net: number;
    }>;
    discrepancies: Array<{
      type: string;
      description: string;
      amount: number;
      date: string;
    }>;
  }> {
    const response = await http.get(
      `/payments/reconciliation-report?startDate=${startDate}&endDate=${endDate}`
    );
    return response as {
      totalPayments: number;
      totalRefunds: number;
      netAmount: number;
      byMethod: Record<
        string,
        { payments: number; refunds: number; net: number }
      >;
      byDay: Array<{
        date: string;
        payments: number;
        refunds: number;
        net: number;
      }>;
      discrepancies: Array<{
        type: string;
        description: string;
        amount: number;
        date: string;
      }>;
    };
  }

  // Get payment analytics
  async getPaymentAnalytics(
    startDate: string,
    endDate: string
  ): Promise<{
    totalRevenue: number;
    totalPayments: number;
    averagePaymentAmount: number;
    paymentTrends: Array<{
      date: string;
      amount: number;
      count: number;
    }>;
    topPaymentMethods: Array<{
      method: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
    paymentSuccessRate: number;
    refundRate: number;
  }> {
    const response = await http.get(
      `/payments/analytics?startDate=${startDate}&endDate=${endDate}`
    );
    return response as {
      totalRevenue: number;
      totalPayments: number;
      averagePaymentAmount: number;
      paymentTrends: Array<{
        date: string;
        amount: number;
        count: number;
      }>;
      topPaymentMethods: Array<{
        method: string;
        count: number;
        amount: number;
        percentage: number;
      }>;
      paymentSuccessRate: number;
      refundRate: number;
    };
  }

  // ===== ADDITIONAL FEATURES =====

  // Get payment by invoice
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    const response = await http.get<Payment[]>(
      `/payments/invoice/${invoiceId}`
    );
    return response;
  }

  // Get payment by reference
  async getPaymentByReference(reference: string): Promise<Payment> {
    const response = await http.get<Payment>(
      `/payments/reference/${reference}`
    );
    return response;
  }

  // Get payment statistics
  async getPaymentStats(): Promise<{
    totalPayments: number;
    totalAmount: number;
    paymentsByStatus: Record<string, { count: number; amount: number }>;
    paymentsByMethod: Record<string, { count: number; amount: number }>;
    todayPayments: { count: number; amount: number };
    thisWeekPayments: { count: number; amount: number };
    thisMonthPayments: { count: number; amount: number };
  }> {
    const response = await http.get('/payments/stats');
    return response as {
      totalPayments: number;
      totalAmount: number;
      paymentsByStatus: Record<string, { count: number; amount: number }>;
      paymentsByMethod: Record<string, { count: number; amount: number }>;
      todayPayments: { count: number; amount: number };
      thisWeekPayments: { count: number; amount: number };
      thisMonthPayments: { count: number; amount: number };
    };
  }

  // Get payment history for patient
  async getPatientPaymentHistory(patientId: string): Promise<Payment[]> {
    const response = await http.get<Payment[]>(
      `/payments/patient/${patientId}/history`
    );
    return response;
  }

  // Get payment history for user
  async getUserPaymentHistory(userId: string): Promise<Payment[]> {
    const response = await http.get<Payment[]>(
      `/payments/user/${userId}/history`
    );
    return response;
  }

  // Export payment report
  async exportPaymentReport(
    params: PaymentQueryParams,
    format: 'pdf' | 'csv' | 'excel'
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    queryParams.append('format', format);

    const response = await http.get(
      `/payments/export?${queryParams.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response as unknown as Blob;
  }

  // Get payment methods
  async getPaymentMethods(): Promise<
    Array<{
      method: string;
      name: string;
      isActive: boolean;
      description?: string;
      icon?: string;
    }>
  > {
    const response = await http.get('/payments/methods');
    return response as Array<{
      method: string;
      name: string;
      isActive: boolean;
      description?: string;
      icon?: string;
    }>;
  }

  // Get payment statuses
  async getPaymentStatuses(): Promise<
    Array<{
      status: string;
      name: string;
      description: string;
      color: string;
    }>
  > {
    const response = await http.get('/payments/statuses');
    return response as Array<{
      status: string;
      name: string;
      description: string;
      color: string;
    }>;
  }

  // Process bulk payments
  async processBulkPayments(
    payments: Array<{
      invoiceId: string;
      amount: number;
      paymentMethod: string;
      reference?: string;
    }>
  ): Promise<{
    successful: Payment[];
    failed: Array<{ invoiceId: string; error: string }>;
    totalProcessed: number;
    totalSuccessful: number;
    totalFailed: number;
  }> {
    const response = await http.post('/payments/bulk', { payments });
    return response as {
      successful: Payment[];
      failed: Array<{ invoiceId: string; error: string }>;
      totalProcessed: number;
      totalSuccessful: number;
      totalFailed: number;
    };
  }

  // Get payment dashboard data
  async getPaymentDashboardData(): Promise<{
    recentPayments: Payment[];
    pendingPayments: number;
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    paymentMethodsChart: Array<{
      method: string;
      amount: number;
      percentage: number;
    }>;
    dailyRevenueChart: Array<{ date: string; revenue: number }>;
  }> {
    const response = await http.get('/payments/dashboard');
    return response as {
      recentPayments: Payment[];
      pendingPayments: number;
      todayRevenue: number;
      weekRevenue: number;
      monthRevenue: number;
      paymentMethodsChart: Array<{
        method: string;
        amount: number;
        percentage: number;
      }>;
      dailyRevenueChart: Array<{ date: string; revenue: number }>;
    };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
