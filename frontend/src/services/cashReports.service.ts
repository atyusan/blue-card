import api from './api';

export interface CashReportFilters {
  startDate?: string;
  endDate?: string;
  department?: string;
  transactionType?: string;
  paymentMethod?: string;
  status?: string;
}

export interface DepartmentStats {
  department: string;
  totalAmount: number;
  transactionCount: number;
  revenue: number;
  expenses: number;
}

export interface PaymentMethodStats {
  method: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface DailyStats {
  date: string;
  revenue: number;
  expenses: number;
  netFlow: number;
  transactionCount: number;
}

export interface MonthlyStats {
  month: string;
  revenue: number;
  expenses: number;
  netFlow: number;
  transactionCount: number;
}

export interface YearlyStats {
  year: string;
  revenue: number;
  expenses: number;
  netFlow: number;
  transactionCount: number;
}

export interface CashReportData {
  totalRevenue: number;
  totalExpenses: number;
  netCashFlow: number;
  totalTransactions: number;
  pendingAmount: number;
  completedAmount: number;
  cancelledAmount: number;
  departmentStats: DepartmentStats[];
  paymentMethodStats: PaymentMethodStats[];
  dailyStats: DailyStats[];
  monthlyStats: MonthlyStats[];
  yearlyStats: YearlyStats[];
}

export interface InvoiceReportData {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  departmentStats: {
    department: string;
    totalAmount: number;
    invoiceCount: number;
  }[];
}

export interface PaymentReportData {
  totalPayments: number;
  totalAmount: number;
  totalRefunds: number;
  netAmount: number;
  paymentMethodStats: PaymentMethodStats[];
}

export interface SummaryReportData {
  cashFlow: CashReportData;
  invoices: InvoiceReportData;
  payments: PaymentReportData;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netCashFlow: number;
    totalInvoices: number;
    totalPayments: number;
    totalRefunds: number;
  };
}

class CashReportsService {
  async generateCashFlowReport(
    filters: CashReportFilters
  ): Promise<CashReportData> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.department) params.append('department', filters.department);
    if (filters.transactionType)
      params.append('transactionType', filters.transactionType);
    if (filters.paymentMethod)
      params.append('paymentMethod', filters.paymentMethod);
    if (filters.status) params.append('status', filters.status);

    try {
      const response = await api.get(
        `/cash-reports/cash-flow?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw error;
      }
      throw new Error(
        error.response?.data?.message || 'Failed to generate cash flow report'
      );
    }
  }

  async generateInvoiceReport(
    filters: CashReportFilters
  ): Promise<InvoiceReportData> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.department) params.append('department', filters.department);
    if (filters.status) params.append('status', filters.status);

    try {
      const response = await api.get(
        `/cash-reports/invoices?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw error;
      }
      throw new Error(
        error.response?.data?.message || 'Failed to generate invoice report'
      );
    }
  }

  async generatePaymentReport(
    filters: CashReportFilters
  ): Promise<PaymentReportData> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.department) params.append('department', filters.department);
    if (filters.paymentMethod)
      params.append('paymentMethod', filters.paymentMethod);
    if (filters.status) params.append('status', filters.status);

    try {
      const response = await api.get(
        `/cash-reports/payments?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw error;
      }
      throw new Error(
        error.response?.data?.message || 'Failed to generate payment report'
      );
    }
  }

  async generateSummaryReport(
    filters: CashReportFilters
  ): Promise<SummaryReportData> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.department) params.append('department', filters.department);

    try {
      const response = await api.get(
        `/cash-reports/summary?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      // If it's an authentication error, the interceptor will handle it
      if (error.response?.status === 401) {
        throw error;
      }
      // For other errors, throw a more descriptive error
      throw new Error(
        error.response?.data?.message || 'Failed to generate summary report'
      );
    }
  }

  // Helper methods for common date ranges
  getTodayRange() {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    return {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
    };
  }

  getThisWeekRange() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      startDate: startOfWeek.toISOString(),
      endDate: endOfWeek.toISOString(),
    };
  }

  getThisMonthRange() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    return {
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString(),
    };
  }

  getThisYearRange() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);

    return {
      startDate: startOfYear.toISOString(),
      endDate: endOfYear.toISOString(),
    };
  }

  getLastMonthRange() {
    const today = new Date();
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const endOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0,
      23,
      59,
      59
    );

    return {
      startDate: startOfLastMonth.toISOString(),
      endDate: endOfLastMonth.toISOString(),
    };
  }

  getLastYearRange() {
    const today = new Date();
    const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59);

    return {
      startDate: startOfLastYear.toISOString(),
      endDate: endOfLastYear.toISOString(),
    };
  }
}

export const cashReportsService = new CashReportsService();
