import { http } from './api';

export interface DashboardStats {
  patients: {
    total: number;
    newThisMonth: number;
    activeToday: number;
    growth: number;
  };
  appointments: {
    total: number;
    todayCount: number;
    weekCount: number;
    monthCount: number;
    upcomingCount: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
    yearToDate: number;
  };
  invoices: {
    total: number;
    pending: number;
    overdue: number;
    paidThisMonth: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'patient' | 'appointment' | 'invoice' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  metadata?: any;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }>;
}

export interface TopServices {
  id: string;
  name: string;
  category: string;
  count: number;
  revenue: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  revenueChart: ChartData;
  appointmentChart: ChartData;
  topServices: TopServices[];
  upcomingAppointments: any[];
  overdueInvoices: any[];
}

class DashboardService {
  // Get complete dashboard data
  async getDashboardData(): Promise<DashboardData> {
    const response = await http.get<DashboardData>('/dashboard');
    return response;
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await http.get<DashboardStats>('/dashboard/stats');
    return response;
  }

  // Get recent activities
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    const response = await http.get<RecentActivity[]>(
      `/dashboard/activities?limit=${limit}`
    );
    return response;
  }

  // Get revenue chart data
  async getRevenueChart(
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<ChartData> {
    const response = await http.get<ChartData>(
      `/dashboard/revenue-chart?period=${period}`
    );
    return response;
  }

  // Get appointment chart data
  async getAppointmentChart(
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<ChartData> {
    const response = await http.get<ChartData>(
      `/dashboard/appointment-chart?period=${period}`
    );
    return response;
  }

  // Get top services
  async getTopServices(
    limit: number = 5,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<TopServices[]> {
    const response = await http.get<TopServices[]>(
      `/dashboard/top-services?limit=${limit}&period=${period}`
    );
    return response;
  }

  // Get upcoming appointments
  async getUpcomingAppointments(limit: number = 5): Promise<any[]> {
    const response = await http.get<any[]>(
      `/dashboard/upcoming-appointments?limit=${limit}`
    );
    return response;
  }

  // Get overdue invoices
  async getOverdueInvoices(limit: number = 5): Promise<any[]> {
    const response = await http.get<any[]>(
      `/dashboard/overdue-invoices?limit=${limit}`
    );
    return response;
  }

  // Get patient demographics
  async getPatientDemographics(): Promise<any> {
    const response = await http.get<any>('/dashboard/patient-demographics');
    return response;
  }

  // Get financial summary
  async getFinancialSummary(
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<any> {
    const response = await http.get<any>(
      `/dashboard/financial-summary?period=${period}`
    );
    return response;
  }

  // Get appointment summary
  async getAppointmentSummary(
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<any> {
    const response = await http.get<any>(
      `/dashboard/appointment-summary?period=${period}`
    );
    return response;
  }

  // Get alerts and notifications
  async getAlerts(): Promise<any[]> {
    const response = await http.get<any[]>('/dashboard/alerts');
    return response;
  }

  // Mark alert as read
  async markAlertAsRead(alertId: string): Promise<void> {
    await http.post(`/dashboard/alerts/${alertId}/read`);
  }

  // Get system health status
  async getSystemHealth(): Promise<any> {
    const response = await http.get<any>('/dashboard/system-health');
    return response;
  }

  // Export dashboard report
  async exportDashboardReport(format: 'pdf' | 'excel'): Promise<Blob> {
    const response = await http.get(`/dashboard/export?format=${format}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
