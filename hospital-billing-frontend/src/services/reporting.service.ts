import { http } from './api';

export interface RevenueReport {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  outstandingInvoices: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    invoiceCount: number;
  }>;
  revenueByDepartment: Array<{
    department: string;
    revenue: number;
    percentage: number;
  }>;
  revenueByService: Array<{
    service: string;
    revenue: number;
    count: number;
  }>;
  topRevenueSources: Array<{
    source: string;
    revenue: number;
    percentage: number;
  }>;
}

export interface DepartmentPerformanceReport {
  departments: Array<{
    name: string;
    totalRevenue: number;
    totalPatients: number;
    totalServices: number;
    averageRevenuePerPatient: number;
    averageRevenuePerService: number;
    growthRate: number;
    efficiency: number;
  }>;
  summary: {
    totalRevenue: number;
    totalPatients: number;
    totalServices: number;
    averageRevenuePerPatient: number;
    averageRevenuePerService: number;
    overallGrowthRate: number;
    overallEfficiency: number;
  };
}

export interface PatientAnalyticsReport {
  totalPatients: number;
  newPatients: number;
  returningPatients: number;
  patientRetentionRate: number;
  averagePatientLifetimeValue: number;
  patientsByAge: Array<{
    ageGroup: string;
    count: number;
    percentage: number;
  }>;
  patientsByGender: Array<{
    gender: string;
    count: number;
    percentage: number;
  }>;
  patientsByLocation: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
  patientSatisfaction: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Array<{
      rating: number;
      count: number;
      percentage: number;
    }>;
  };
  patientTrends: Array<{
    month: string;
    newPatients: number;
    returningPatients: number;
    totalPatients: number;
  }>;
}

export interface ServicePerformanceReport {
  totalServices: number;
  totalRevenue: number;
  averageServicePrice: number;
  servicesByCategory: Array<{
    category: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  topPerformingServices: Array<{
    service: string;
    revenue: number;
    count: number;
    averageRating: number;
  }>;
  serviceUtilization: Array<{
    service: string;
    utilizationRate: number;
    capacity: number;
    actual: number;
  }>;
  serviceTrends: Array<{
    month: string;
    serviceCount: number;
    revenue: number;
    growthRate: number;
  }>;
}

export interface QuickReport {
  period: string;
  totalRevenue: number;
  totalPatients: number;
  totalServices: number;
  totalInvoices: number;
  paidInvoices: number;
  outstandingInvoices: number;
  averageRevenuePerPatient: number;
  averageRevenuePerService: number;
  topRevenueSources: Array<{
    source: string;
    revenue: number;
    percentage: number;
  }>;
  revenueTrend: Array<{
    date: string;
    revenue: number;
    growthRate: number;
  }>;
}

export interface CrossModuleIntegrationReport {
  totalRevenue: number;
  moduleBreakdown: Array<{
    module: string;
    revenue: number;
    percentage: number;
    patientCount: number;
    serviceCount: number;
  }>;
  crossModuleReferrals: Array<{
    fromModule: string;
    toModule: string;
    count: number;
    revenue: number;
  }>;
  integrationEfficiency: {
    overallEfficiency: number;
    moduleEfficiency: Record<string, number>;
    bottlenecks: Array<{
      module: string;
      issue: string;
      impact: string;
    }>;
  };
}

export interface PaymentAnalyticsReport {
  totalPayments: number;
  totalRevenue: number;
  paymentSuccessRate: number;
  averagePaymentAmount: number;
  paymentsByMethod: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
    successRate: number;
  }>;
  paymentTrends: Array<{
    month: string;
    payments: number;
    revenue: number;
    successRate: number;
  }>;
  refundAnalysis: {
    totalRefunds: number;
    refundRate: number;
    refundsByReason: Array<{
      reason: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
  };
  paymentProcessing: {
    averageProcessingTime: number;
    processingTimeByMethod: Record<string, number>;
    failedPayments: number;
    failureReasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
  };
}

export interface FinancialForecastReport {
  forecastPeriod: string;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedProfit: number;
  revenueForecast: Array<{
    month: string;
    projectedRevenue: number;
    confidenceLevel: number;
    factors: string[];
  }>;
  expenseForecast: Array<{
    month: string;
    projectedExpenses: number;
    confidenceLevel: number;
    categories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  }>;
  profitForecast: Array<{
    month: string;
    projectedProfit: number;
    profitMargin: number;
    confidenceLevel: number;
  }>;
  riskFactors: Array<{
    factor: string;
    impact: string;
    probability: string;
    mitigation: string;
  }>;
}

export interface ReportingQueryParams {
  startDate: string;
  endDate: string;
  department?: string;
  service?: string;
  patientId?: string;
  doctorId?: string;
  format?: 'json' | 'pdf' | 'csv' | 'excel';
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

class ReportingService {
  // ===== CORE REPORTS =====

  // Get revenue report
  async getRevenueReport(
    startDate: string,
    endDate: string,
    department?: string
  ): Promise<RevenueReport> {
    const params = new URLSearchParams({ startDate, endDate });
    if (department) params.append('department', department);

    const response = await http.get<RevenueReport>(
      `/reporting/revenue?${params.toString()}`
    );
    return response;
  }

  // Get department performance report
  async getDepartmentPerformanceReport(
    startDate: string,
    endDate: string
  ): Promise<DepartmentPerformanceReport> {
    const response = await http.get<DepartmentPerformanceReport>(
      `/reporting/department-performance?startDate=${startDate}&endDate=${endDate}`
    );
    return response;
  }

  // Get patient analytics report
  async getPatientAnalyticsReport(
    startDate: string,
    endDate: string
  ): Promise<PatientAnalyticsReport> {
    const response = await http.get<PatientAnalyticsReport>(
      `/reporting/patient-analytics?startDate=${startDate}&endDate=${endDate}`
    );
    return response;
  }

  // Get service performance report
  async getServicePerformanceReport(
    startDate: string,
    endDate: string
  ): Promise<ServicePerformanceReport> {
    const response = await http.get<ServicePerformanceReport>(
      `/reporting/service-performance?startDate=${startDate}&endDate=${endDate}`
    );
    return response;
  }

  // ===== QUICK REPORTS =====

  // Get last 30 days report
  async getLast30DaysReport(): Promise<QuickReport> {
    const response = await http.get<QuickReport>(
      '/reporting/quick/last-30-days'
    );
    return response;
  }

  // Get last 90 days report
  async getLast90DaysReport(): Promise<QuickReport> {
    const response = await http.get<QuickReport>(
      '/reporting/quick/last-90-days'
    );
    return response;
  }

  // Get last year report
  async getLastYearReport(): Promise<QuickReport> {
    const response = await http.get<QuickReport>('/reporting/quick/last-year');
    return response;
  }

  // ===== ENHANCED ANALYTICS =====

  // Get cross-module integration report
  async getCrossModuleIntegrationReport(
    startDate: string,
    endDate: string
  ): Promise<CrossModuleIntegrationReport> {
    const response = await http.get<CrossModuleIntegrationReport>(
      `/reporting/cross-module-integration?startDate=${startDate}&endDate=${endDate}`
    );
    return response;
  }

  // Get payment analytics report
  async getPaymentAnalyticsReport(
    startDate: string,
    endDate: string
  ): Promise<PaymentAnalyticsReport> {
    const response = await http.get<PaymentAnalyticsReport>(
      `/reporting/payment-analytics?startDate=${startDate}&endDate=${endDate}`
    );
    return response;
  }

  // Get financial forecast report
  async getFinancialForecastReport(
    months: number = 12
  ): Promise<FinancialForecastReport> {
    const response = await http.get<FinancialForecastReport>(
      `/reporting/financial-forecast?months=${months}`
    );
    return response;
  }

  // ===== ADDITIONAL FEATURES =====

  // Get comprehensive dashboard report
  async getDashboardReport(): Promise<{
    revenue: RevenueReport;
    patients: PatientAnalyticsReport;
    services: ServicePerformanceReport;
    payments: PaymentAnalyticsReport;
    quickStats: {
      todayRevenue: number;
      todayPatients: number;
      todayServices: number;
      weekRevenue: number;
      monthRevenue: number;
      outstandingInvoices: number;
      pendingPayments: number;
    };
  }> {
    const response = await http.get('/reporting/dashboard');
    return response as {
      revenue: RevenueReport;
      patients: PatientAnalyticsReport;
      services: ServicePerformanceReport;
      payments: PaymentAnalyticsReport;
      quickStats: {
        todayRevenue: number;
        todayPatients: number;
        todayServices: number;
        weekRevenue: number;
        monthRevenue: number;
        outstandingInvoices: number;
        pendingPayments: number;
      };
    };
  }

  // Get custom date range report
  async getCustomDateRangeReport(
    startDate: string,
    endDate: string,
    modules: string[] = ['revenue', 'patients', 'services', 'payments']
  ): Promise<any> {
    const params = new URLSearchParams({ startDate, endDate });
    modules.forEach((module) => params.append('modules', module));

    const response = await http.get(`/reporting/custom?${params.toString()}`);
    return response;
  }

  // Get comparative report
  async getComparativeReport(
    period1: { startDate: string; endDate: string },
    period2: { startDate: string; endDate: string }
  ): Promise<{
    period1: any;
    period2: any;
    comparison: {
      revenueChange: number;
      patientChange: number;
      serviceChange: number;
      growthRates: Record<string, number>;
    };
  }> {
    const params = new URLSearchParams({
      period1Start: period1.startDate,
      period1End: period1.endDate,
      period2Start: period2.startDate,
      period2End: period2.endDate,
    });

    const response = await http.get(
      `/reporting/comparative?${params.toString()}`
    );
    return response as {
      period1: any;
      period2: any;
      comparison: {
        revenueChange: number;
        patientChange: number;
        serviceChange: number;
        growthRates: Record<string, number>;
      };
    };
  }

  // Export report
  async exportReport(
    reportType: string,
    params: ReportingQueryParams,
    format: 'pdf' | 'csv' | 'excel'
  ): Promise<Blob> {
    const queryParams = new URLSearchParams({
      ...params,
      format,
    });

    const response = await http.get(
      `/reporting/${reportType}/export?${queryParams.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response as unknown as Blob;
  }

  // Get report templates
  async getReportTemplates(): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      parameters: Array<{
        name: string;
        type: string;
        required: boolean;
        defaultValue?: any;
      }>;
    }>
  > {
    const response = await http.get('/reporting/templates');
    return response as Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      parameters: Array<{
        name: string;
        type: string;
        required: boolean;
        defaultValue?: any;
      }>;
    }>;
  }

  // Generate report from template
  async generateReportFromTemplate(
    templateId: string,
    parameters: Record<string, any>
  ): Promise<any> {
    const response = await http.post(
      `/reporting/templates/${templateId}/generate`,
      {
        parameters,
      }
    );
    return response;
  }

  // Schedule recurring report
  async scheduleRecurringReport(
    reportType: string,
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
      dayOfWeek?: number;
      dayOfMonth?: number;
      time: string;
      recipients: string[];
      format: 'pdf' | 'csv' | 'excel';
    }
  ): Promise<{
    id: string;
    status: string;
    nextRun: string;
  }> {
    const response = await http.post(
      `/reporting/${reportType}/schedule`,
      schedule
    );
    return response as {
      id: string;
      status: string;
      nextRun: string;
    };
  }

  // Get scheduled reports
  async getScheduledReports(): Promise<
    Array<{
      id: string;
      reportType: string;
      schedule: any;
      status: string;
      nextRun: string;
      lastRun?: string;
      recipients: string[];
    }>
  > {
    const response = await http.get('/reporting/scheduled');
    return response as Array<{
      id: string;
      reportType: string;
      schedule: any;
      status: string;
      nextRun: string;
      lastRun?: string;
      recipients: string[];
    }>;
  }

  // Cancel scheduled report
  async cancelScheduledReport(scheduleId: string): Promise<void> {
    await http.delete(`/reporting/scheduled/${scheduleId}`);
  }

  // Get report history
  async getReportHistory(
    reportType?: string,
    params: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<
    PaginatedResponse<{
      id: string;
      reportType: string;
      generatedAt: string;
      generatedBy: string;
      parameters: any;
      format: string;
      size: number;
      downloadUrl?: string;
    }>
  > {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    if (reportType) queryParams.append('reportType', reportType);

    const response = await http.get(
      `/reporting/history?${queryParams.toString()}`
    );
    return response as PaginatedResponse<{
      id: string;
      reportType: string;
      generatedAt: string;
      generatedBy: string;
      parameters: any;
      format: string;
      size: number;
      downloadUrl?: string;
    }>;
  }

  // Get real-time analytics
  async getRealTimeAnalytics(): Promise<{
    currentPatients: number;
    todayRevenue: number;
    todayAppointments: number;
    pendingInvoices: number;
    activeSurgeries: number;
    labOrdersInProgress: number;
    pharmacyPrescriptions: number;
    recentActivities: Array<{
      type: string;
      description: string;
      timestamp: string;
      user: string;
    }>;
  }> {
    const response = await http.get('/reporting/real-time');
    return response as {
      currentPatients: number;
      todayRevenue: number;
      todayAppointments: number;
      pendingInvoices: number;
      activeSurgeries: number;
      labOrdersInProgress: number;
      pharmacyPrescriptions: number;
      recentActivities: Array<{
        type: string;
        description: string;
        timestamp: string;
        user: string;
      }>;
    };
  }
}

export const reportingService = new ReportingService();
export default reportingService;
