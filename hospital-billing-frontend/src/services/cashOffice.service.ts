import { http } from './api';

export interface CashTransaction {
  id: string;
  transactionType: 'RECEIPT' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT' | 'TRANSFER';
  amount: number;
  currency: string;
  description: string;
  reference: string;
  category:
    | 'PATIENT_PAYMENT'
    | 'SUPPLIER_PAYMENT'
    | 'STAFF_SALARY'
    | 'UTILITIES'
    | 'MAINTENANCE'
    | 'OTHER';
  paymentMethod: 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CARD';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REVERSED';
  processedBy: string;
  processor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  patientId?: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    patientId: string;
  };
  invoiceId?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
  };
  notes?: string;
  receiptNumber?: string;
  checkNumber?: string;
  bankName?: string;
  accountNumber?: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCashTransactionData {
  transactionType: 'RECEIPT' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT' | 'TRANSFER';
  amount: number;
  currency: string;
  description: string;
  reference: string;
  category:
    | 'PATIENT_PAYMENT'
    | 'SUPPLIER_PAYMENT'
    | 'STAFF_SALARY'
    | 'UTILITIES'
    | 'MAINTENANCE'
    | 'OTHER';
  paymentMethod: 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CARD';
  patientId?: string;
  invoiceId?: string;
  notes?: string;
  receiptNumber?: string;
  checkNumber?: string;
  bankName?: string;
  accountNumber?: string;
  transactionDate: string;
}

export interface UpdateCashTransactionData {
  amount?: number;
  description?: string;
  category?: string;
  paymentMethod?: string;
  notes?: string;
  status?: string;
}

export interface PettyCash {
  id: string;
  requesterId: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
  };
  amount: number;
  purpose: string;
  category: 'OFFICE_SUPPLIES' | 'MAINTENANCE' | 'TRANSPORT' | 'MEALS' | 'OTHER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
  requestDate: string;
  approvedBy?: string;
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePettyCashData {
  amount: number;
  purpose: string;
  category: 'OFFICE_SUPPLIES' | 'MAINTENANCE' | 'TRANSPORT' | 'MEALS' | 'OTHER';
  notes?: string;
}

export interface CashTransactionQueryParams {
  page?: number;
  limit?: number;
  transactionType?: string;
  category?: string;
  paymentMethod?: string;
  status?: string;
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

class CashOfficeService {
  // ===== CASH TRANSACTION MANAGEMENT =====

  // Create cash transaction
  async createCashTransaction(
    transactionData: CreateCashTransactionData
  ): Promise<CashTransaction> {
    const response = await http.post<CashTransaction>(
      '/cash-office/transactions',
      transactionData
    );
    return response;
  }

  // Get all cash transactions with pagination and filtering
  async getCashTransactions(
    params: CashTransactionQueryParams = {}
  ): Promise<PaginatedResponse<CashTransaction>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<CashTransaction>>(
      `/cash-office/transactions?${queryParams.toString()}`
    );
    return response;
  }

  // Get cash transaction by ID
  async getCashTransactionById(id: string): Promise<CashTransaction> {
    const response = await http.get<CashTransaction>(
      `/cash-office/transactions/${id}`
    );
    return response;
  }

  // Update cash transaction
  async updateCashTransaction(
    id: string,
    transactionData: UpdateCashTransactionData
  ): Promise<CashTransaction> {
    const response = await http.patch<CashTransaction>(
      `/cash-office/transactions/${id}`,
      transactionData
    );
    return response;
  }

  // ===== PETTY CASH MANAGEMENT =====

  // Create petty cash request
  async createPettyCashRequest(
    pettyCashData: CreatePettyCashData
  ): Promise<PettyCash> {
    const response = await http.post<PettyCash>(
      '/cash-office/petty-cash',
      pettyCashData
    );
    return response;
  }

  // Approve petty cash request
  async approvePettyCashRequest(
    id: string,
    approverId: string
  ): Promise<PettyCash> {
    const response = await http.post<PettyCash>(
      `/cash-office/petty-cash/${id}/approve`,
      {
        approverId,
      }
    );
    return response;
  }

  // Reject petty cash request
  async rejectPettyCashRequest(
    id: string,
    rejectionData: { reason: string; rejectedBy: string }
  ): Promise<PettyCash> {
    const response = await http.post<PettyCash>(
      `/cash-office/petty-cash/${id}/reject`,
      rejectionData
    );
    return response;
  }

  // ===== PAYMENT PROCESSING INTEGRATION =====

  // Process invoice payment through cash office
  async processInvoicePayment(
    invoiceId: string,
    paymentData: {
      amount: number;
      paymentMethod: 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CARD';
      reference: string;
      notes?: string;
    }
  ): Promise<any> {
    const response = await http.post(
      `/cash-office/invoices/${invoiceId}/payments`,
      paymentData
    );
    return response;
  }

  // Check invoice payment status
  async checkInvoicePaymentStatus(invoiceId: string): Promise<{
    isPaid: boolean;
    paidAmount: number;
    outstandingAmount: number;
    lastPaymentDate?: string;
    paymentHistory: any[];
  }> {
    const response = await http.get(
      `/cash-office/invoices/${invoiceId}/payment-status`
    );
    return response as {
      isPaid: boolean;
      paidAmount: number;
      outstandingAmount: number;
      lastPaymentDate?: string;
      paymentHistory: any[];
    };
  }

  // Get invoice payment history
  async getInvoicePaymentHistory(invoiceId: string): Promise<any[]> {
    const response = await http.get(
      `/cash-office/invoices/${invoiceId}/payment-history`
    );
    return response as any[];
  }

  // ===== ADDITIONAL FEATURES =====

  // Get cash office balance
  async getCashOfficeBalance(): Promise<{
    totalCash: number;
    totalReceipts: number;
    totalPayments: number;
    netBalance: number;
    lastReconciliation: string;
  }> {
    const response = await http.get('/cash-office/balance');
    return response as {
      totalCash: number;
      totalReceipts: number;
      totalPayments: number;
      netBalance: number;
      lastReconciliation: string;
    };
  }

  // Get cash office statistics
  async getCashOfficeStats(): Promise<{
    totalTransactions: number;
    totalAmount: number;
    transactionsByType: Record<string, { count: number; amount: number }>;
    transactionsByCategory: Record<string, { count: number; amount: number }>;
    transactionsByMethod: Record<string, { count: number; amount: number }>;
    todayTransactions: { count: number; amount: number };
    thisWeekTransactions: { count: number; amount: number };
    thisMonthTransactions: { count: number; amount: number };
  }> {
    const response = await http.get('/cash-office/stats');
    return response as {
      totalTransactions: number;
      totalAmount: number;
      transactionsByType: Record<string, { count: number; amount: number }>;
      transactionsByCategory: Record<string, { count: number; amount: number }>;
      transactionsByMethod: Record<string, { count: number; amount: number }>;
      todayTransactions: { count: number; amount: number };
      thisWeekTransactions: { count: number; amount: number };
      thisMonthTransactions: { count: number; amount: number };
    };
  }

  // Get petty cash statistics
  async getPettyCashStats(): Promise<{
    totalRequests: number;
    totalAmount: number;
    requestsByStatus: Record<string, { count: number; amount: number }>;
    requestsByCategory: Record<string, { count: number; amount: number }>;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
  }> {
    const response = await http.get('/cash-office/petty-cash/stats');
    return response as {
      totalRequests: number;
      totalAmount: number;
      requestsByStatus: Record<string, { count: number; amount: number }>;
      requestsByCategory: Record<string, { count: number; amount: number }>;
      pendingRequests: number;
      approvedRequests: number;
      rejectedRequests: number;
    };
  }

  // Get cash office categories
  async getCashOfficeCategories(): Promise<string[]> {
    const response = await http.get<string[]>('/cash-office/categories');
    return response;
  }

  // Get payment methods
  async getPaymentMethods(): Promise<string[]> {
    const response = await http.get<string[]>('/cash-office/payment-methods');
    return response;
  }

  // Search cash transactions
  async searchCashTransactions(query: string): Promise<CashTransaction[]> {
    const response = await http.get<CashTransaction[]>(
      `/cash-office/transactions/search?q=${query}`
    );
    return response;
  }

  // Get cash transactions by date range
  async getCashTransactionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<CashTransaction[]> {
    const response = await http.get<CashTransaction[]>(
      `/cash-office/transactions/date-range?startDate=${startDate}&endDate=${endDate}`
    );
    return response;
  }

  // Get cash transactions by category
  async getCashTransactionsByCategory(
    category: string
  ): Promise<CashTransaction[]> {
    const response = await http.get<CashTransaction[]>(
      `/cash-office/transactions/category/${category}`
    );
    return response;
  }

  // Get cash transactions by type
  async getCashTransactionsByType(type: string): Promise<CashTransaction[]> {
    const response = await http.get<CashTransaction[]>(
      `/cash-office/transactions/type/${type}`
    );
    return response;
  }

  // Export cash office report
  async exportCashOfficeReport(
    params: CashTransactionQueryParams,
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
      `/cash-office/export?${queryParams.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response as unknown as Blob;
  }

  // Get cash office reconciliation report
  async getCashOfficeReconciliationReport(
    startDate: string,
    endDate: string
  ): Promise<{
    totalReceipts: number;
    totalPayments: number;
    netAmount: number;
    byCategory: Record<
      string,
      { receipts: number; payments: number; net: number }
    >;
    byDay: Array<{
      date: string;
      receipts: number;
      payments: number;
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
      `/cash-office/reconciliation?startDate=${startDate}&endDate=${endDate}`
    );
    return response as {
      totalReceipts: number;
      totalPayments: number;
      netAmount: number;
      byCategory: Record<
        string,
        { receipts: number; payments: number; net: number }
      >;
      byDay: Array<{
        date: string;
        receipts: number;
        payments: number;
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

  // Get cash office dashboard data
  async getCashOfficeDashboardData(): Promise<{
    recentTransactions: CashTransaction[];
    pendingPettyCashRequests: number;
    todayReceipts: number;
    todayPayments: number;
    weekReceipts: number;
    weekPayments: number;
    monthReceipts: number;
    monthPayments: number;
    categoryChart: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    dailyChart: Array<{ date: string; receipts: number; payments: number }>;
  }> {
    const response = await http.get('/cash-office/dashboard');
    return response as {
      recentTransactions: CashTransaction[];
      pendingPettyCashRequests: number;
      todayReceipts: number;
      todayPayments: number;
      weekReceipts: number;
      weekPayments: number;
      monthReceipts: number;
      monthPayments: number;
      categoryChart: Array<{
        category: string;
        amount: number;
        percentage: number;
      }>;
      dailyChart: Array<{ date: string; receipts: number; payments: number }>;
    };
  }

  // Get petty cash requests by user
  async getPettyCashRequestsByUser(userId: string): Promise<PettyCash[]> {
    const response = await http.get<PettyCash[]>(
      `/cash-office/petty-cash/user/${userId}`
    );
    return response;
  }

  // Get petty cash requests by status
  async getPettyCashRequestsByStatus(status: string): Promise<PettyCash[]> {
    const response = await http.get<PettyCash[]>(
      `/cash-office/petty-cash/status/${status}`
    );
    return response;
  }

  // Get petty cash requests by category
  async getPettyCashRequestsByCategory(category: string): Promise<PettyCash[]> {
    const response = await http.get<PettyCash[]>(
      `/cash-office/petty-cash/category/${category}`
    );
    return response;
  }
}

export const cashOfficeService = new CashOfficeService();
export default cashOfficeService;
