import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CashReportFilters {
  startDate?: string;
  endDate?: string;
  department?: string;
  transactionType?: string;
  paymentMethod?: string;
  status?: string;
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

@Injectable()
export class CashReportsService {
  constructor(private prisma: PrismaService) {}

  async generateCashReport(
    filters: CashReportFilters,
  ): Promise<CashReportData> {
    const {
      startDate,
      endDate,
      department,
      transactionType,
      paymentMethod,
      status,
    } = filters;

    // Build where clause for date filtering
    const dateFilter = this.buildDateFilter(startDate, endDate);

    // Build additional filters
    const additionalFilters = this.buildAdditionalFilters(
      department,
      transactionType,
      paymentMethod,
      status,
    );

    const whereClause = {
      ...dateFilter,
      ...additionalFilters,
    };

    // Get all transactions within the date range
    const transactions = await this.prisma.cashTransaction.findMany({
      where: whereClause,
      include: {
        patient: true,
        cashier: {
          include: {
            user: true,
          },
        },
      },
    });

    // Calculate basic statistics
    const totalRevenue = transactions
      .filter(
        (t) => t.transactionType === 'CASH_IN' && t.status === 'COMPLETED',
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter(
        (t) => t.transactionType === 'CASH_OUT' && t.status === 'COMPLETED',
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netCashFlow = totalRevenue - totalExpenses;
    const totalTransactions = transactions.length;

    // Calculate status-based amounts
    const pendingAmount = transactions
      .filter((t) => t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const completedAmount = transactions
      .filter((t) => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const cancelledAmount = transactions
      .filter((t) => t.status === 'CANCELLED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate department statistics
    const departmentStats = await this.calculateDepartmentStats(whereClause);

    // Calculate payment method statistics
    const paymentMethodStats =
      await this.calculatePaymentMethodStats(whereClause);

    // Calculate time-based statistics
    const dailyStats = await this.calculateDailyStats(whereClause);
    const monthlyStats = await this.calculateMonthlyStats(whereClause);
    const yearlyStats = await this.calculateYearlyStats(whereClause);

    return {
      totalRevenue,
      totalExpenses,
      netCashFlow,
      totalTransactions,
      pendingAmount,
      completedAmount,
      cancelledAmount,
      departmentStats,
      paymentMethodStats,
      dailyStats,
      monthlyStats,
      yearlyStats,
    };
  }

  async generateInvoiceReport(filters: CashReportFilters) {
    const { startDate, endDate, department, status } = filters;

    const dateFilter = this.buildDateFilter(startDate, endDate);
    const additionalFilters = this.buildAdditionalFilters(
      department,
      undefined,
      undefined,
      status,
    );

    const whereClause = {
      ...dateFilter,
      ...additionalFilters,
    };

    // Convert date filter for invoices (they use createdAt instead of transactionDate)
    const invoiceDateFilter: any = {};
    if (dateFilter.transactionDate) {
      invoiceDateFilter.createdAt = dateFilter.transactionDate;
    }

    const invoiceWhereClause = {
      ...invoiceDateFilter,
      ...additionalFilters,
    };

    const invoices = await this.prisma.invoice.findMany({
      where: invoiceWhereClause,
      include: {
        patient: true,
        charges: true,
        payments: true,
      },
    });

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );
    const paidAmount = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const pendingAmount = invoices
      .filter((inv) => inv.status === 'PENDING')
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const overdueAmount = invoices
      .filter((inv) => inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    const departmentInvoiceStats =
      await this.calculateInvoiceDepartmentStats(invoiceWhereClause);

    return {
      totalInvoices,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      departmentStats: departmentInvoiceStats,
    };
  }

  async generatePaymentReport(filters: CashReportFilters) {
    const { startDate, endDate, department, paymentMethod, status } = filters;

    const dateFilter = this.buildDateFilter(startDate, endDate);
    const additionalFilters = this.buildAdditionalFilters(
      department,
      undefined,
      paymentMethod,
      status,
    );

    const whereClause = {
      ...dateFilter,
      ...additionalFilters,
    };

    // Convert date filter for payments (they use createdAt instead of transactionDate)
    const paymentDateFilter: any = {};
    if (dateFilter.transactionDate) {
      paymentDateFilter.createdAt = dateFilter.transactionDate;
    }

    const paymentWhereClause = {
      ...paymentDateFilter,
      ...additionalFilters,
    };

    const payments = await this.prisma.payment.findMany({
      where: paymentWhereClause,
      include: {
        invoice: {
          include: {
            patient: true,
          },
        },
        refunds: true,
      },
    });

    const totalPayments = payments.length;
    const totalAmount = payments.reduce(
      (sum, pay) => sum + Number(pay.amount),
      0,
    );
    const totalRefunds = payments.reduce(
      (sum, pay) =>
        sum +
        pay.refunds.reduce(
          (refundSum, refund) => refundSum + Number(refund.amount),
          0,
        ),
      0,
    );
    const netAmount = totalAmount - totalRefunds;

    const paymentMethodStats =
      await this.calculatePaymentMethodStats(paymentWhereClause);

    return {
      totalPayments,
      totalAmount,
      totalRefunds,
      netAmount,
      paymentMethodStats,
    };
  }

  private buildDateFilter(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) {
      // Default to current month if no dates provided
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return {
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      };
    }

    const filter: any = {};

    if (startDate) {
      filter.gte = new Date(startDate);
    }

    if (endDate) {
      filter.lte = new Date(endDate);
    }

    return filter.gte || filter.lte ? { transactionDate: filter } : {};
  }

  private buildAdditionalFilters(
    department?: string,
    transactionType?: string,
    paymentMethod?: string,
    status?: string,
  ) {
    const filters: any = {};

    if (department) {
      filters.department = department;
    }

    if (transactionType) {
      filters.transactionType = transactionType;
    }

    if (paymentMethod) {
      filters.paymentMethod = paymentMethod;
    }

    if (status) {
      filters.status = status;
    }

    return filters;
  }

  private async calculateDepartmentStats(
    whereClause: any,
  ): Promise<DepartmentStats[]> {
    const transactions = await this.prisma.cashTransaction.findMany({
      where: whereClause,
      include: {
        cashier: {
          include: {
            user: true,
          },
        },
      },
    });

    // Group by department manually
    const departmentMap = new Map<string, DepartmentStats>();

    transactions.forEach((t) => {
      const department = t.cashier.department || 'Unknown';
      const amount = Number(t.amount);

      if (!departmentMap.has(department)) {
        departmentMap.set(department, {
          department,
          totalAmount: 0,
          transactionCount: 0,
          revenue: 0,
          expenses: 0,
        });
      }

      const deptStats = departmentMap.get(department)!;
      deptStats.totalAmount += amount;
      deptStats.transactionCount += 1;

      if (t.transactionType === 'CASH_IN') {
        deptStats.revenue += amount;
      } else {
        deptStats.expenses += amount;
      }
    });

    return Array.from(departmentMap.values());
  }

  private async calculatePaymentMethodStats(
    whereClause: any,
  ): Promise<PaymentMethodStats[]> {
    // Since CashTransaction doesn't have paymentMethod, we'll return a default structure
    // This can be enhanced later when we have payment method information
    return [
      {
        method: 'Cash',
        totalAmount: 0,
        transactionCount: 0,
        percentage: 100,
      },
    ];
  }

  private async calculateDailyStats(whereClause: any): Promise<DailyStats[]> {
    const transactions = await this.prisma.cashTransaction.findMany({
      where: whereClause,
      select: {
        transactionDate: true,
        amount: true,
        transactionType: true,
      },
    });

    // Group by date manually
    const dailyMap = new Map<string, DailyStats>();

    transactions.forEach((t) => {
      const date = t.transactionDate.toISOString().split('T')[0];
      const amount = Number(t.amount);

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          revenue: 0,
          expenses: 0,
          netFlow: 0,
          transactionCount: 0,
        });
      }

      const dailyStats = dailyMap.get(date)!;
      dailyStats.transactionCount += 1;
      dailyStats.netFlow += amount;

      if (t.transactionType === 'CASH_IN') {
        dailyStats.revenue += amount;
      } else {
        dailyStats.expenses += amount;
      }
    });

    return Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  private async calculateMonthlyStats(
    whereClause: any,
  ): Promise<MonthlyStats[]> {
    const transactions = await this.prisma.cashTransaction.findMany({
      where: whereClause,
      select: {
        transactionDate: true,
        amount: true,
        transactionType: true,
      },
    });

    const monthlyData = new Map<string, MonthlyStats>();

    transactions.forEach((t) => {
      const monthKey = `${t.transactionDate.getFullYear()}-${String(t.transactionDate.getMonth() + 1).padStart(2, '0')}`;
      const amount = Number(t.amount);

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          revenue: 0,
          expenses: 0,
          netFlow: 0,
          transactionCount: 0,
        });
      }

      const monthData = monthlyData.get(monthKey)!;
      monthData.transactionCount++;
      monthData.netFlow += amount;

      if (t.transactionType === 'CASH_IN') {
        monthData.revenue += amount;
      } else {
        monthData.expenses += amount;
      }
    });

    return Array.from(monthlyData.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );
  }

  private async calculateYearlyStats(whereClause: any): Promise<YearlyStats[]> {
    const transactions = await this.prisma.cashTransaction.findMany({
      where: whereClause,
      select: {
        transactionDate: true,
        amount: true,
        transactionType: true,
      },
    });

    const yearlyData = new Map<string, YearlyStats>();

    transactions.forEach((t) => {
      const yearKey = String(t.transactionDate.getFullYear());
      const amount = Number(t.amount);

      if (!yearlyData.has(yearKey)) {
        yearlyData.set(yearKey, {
          year: yearKey,
          revenue: 0,
          expenses: 0,
          netFlow: 0,
          transactionCount: 0,
        });
      }

      const yearData = yearlyData.get(yearKey)!;
      yearData.transactionCount++;
      yearData.netFlow += amount;

      if (t.transactionType === 'CASH_IN') {
        yearData.revenue += amount;
      } else {
        yearData.expenses += amount;
      }
    });

    return Array.from(yearlyData.values()).sort((a, b) =>
      a.year.localeCompare(b.year),
    );
  }

  private async calculateInvoiceDepartmentStats(whereClause: any) {
    // Since Invoice doesn't have a department field, we'll return a default structure
    // This can be enhanced later when we have department information
    return [
      {
        department: 'General',
        totalAmount: 0,
        invoiceCount: 0,
      },
    ];
  }
}
