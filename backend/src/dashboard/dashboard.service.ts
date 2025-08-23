import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  DashboardDataDto,
  DashboardStatsDto,
  RecentActivityDto,
  ChartDataDto,
  TopServiceDto,
  UpcomingAppointmentDto,
  OverdueInvoiceDto,
} from './dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(): Promise<DashboardDataDto> {
    const [
      stats,
      recentActivities,
      revenueChart,
      appointmentChart,
      topServices,
      upcomingAppointments,
      overdueInvoices,
    ] = await Promise.all([
      this.getDashboardStats(),
      this.getRecentActivities(10),
      this.getRevenueChart('month'),
      this.getAppointmentChart('month'),
      this.getTopServices(5, 'month'),
      this.getUpcomingAppointments(5),
      this.getOverdueInvoices(5),
    ]);

    return {
      stats,
      recentActivities,
      revenueChart,
      appointmentChart,
      topServices,
      upcomingAppointments,
      overdueInvoices,
    };
  }

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get patient stats
    const [totalPatients, newThisMonth, activeToday] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.patient.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.patient.count({
        where: {
          consultations: {
            some: {
              appointmentDate: {
                gte: new Date(now.setHours(0, 0, 0, 0)),
              },
            },
          },
        },
      }),
    ]);

    // Get appointment stats
    const [
      totalAppointments,
      todayCount,
      weekCount,
      monthCount,
      upcomingCount,
    ] = await Promise.all([
      this.prisma.consultation.count(),
      this.prisma.consultation.count({
        where: {
          appointmentDate: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.consultation.count({
        where: {
          appointmentDate: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.consultation.count({
        where: {
          appointmentDate: { gte: startOfMonth },
        },
      }),
      this.prisma.consultation.count({
        where: {
          appointmentDate: { gt: now },
          isCompleted: false,
        },
      }),
    ]);

    // Get revenue stats
    const [thisMonthRevenue, lastMonthRevenue, yearToDateRevenue] =
      await Promise.all([
        this.prisma.invoice.aggregate({
          where: {
            createdAt: { gte: startOfMonth },
            status: 'PAID',
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            createdAt: { gte: startOfLastMonth, lt: startOfMonth },
            status: 'PAID',
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            createdAt: { gte: startOfYear },
            status: 'PAID',
          },
          _sum: { totalAmount: true },
        }),
      ]);

    // Get invoice stats
    const [totalInvoices, pendingInvoices, overdueInvoices, paidThisMonth] =
      await Promise.all([
        this.prisma.invoice.count(),
        this.prisma.invoice.count({
          where: { status: 'PENDING' },
        }),
        this.prisma.invoice.count({
          where: {
            dueDate: { lt: now },
            status: { not: 'PAID' },
          },
        }),
        this.prisma.invoice.count({
          where: {
            createdAt: { gte: startOfMonth },
            status: 'PAID',
          },
        }),
      ]);

    // Calculate growth percentages
    const patientGrowth =
      totalPatients > 0 ? (newThisMonth / totalPatients) * 100 : 0;
    const revenueGrowth = lastMonthRevenue._sum.totalAmount
      ? ((Number(thisMonthRevenue._sum.totalAmount) -
          Number(lastMonthRevenue._sum.totalAmount)) /
          Number(lastMonthRevenue._sum.totalAmount)) *
        100
      : 0;

    return {
      patients: {
        total: totalPatients,
        newThisMonth,
        activeToday,
        growth: Math.round(patientGrowth * 100) / 100,
      },
      appointments: {
        total: totalAppointments,
        todayCount,
        weekCount,
        monthCount,
        upcomingCount,
      },
      revenue: {
        thisMonth: Number(thisMonthRevenue._sum.totalAmount) || 0,
        lastMonth: Number(lastMonthRevenue._sum.totalAmount) || 0,
        growth: Math.round(revenueGrowth * 100) / 100,
        yearToDate: Number(yearToDateRevenue._sum.totalAmount) || 0,
      },
      invoices: {
        total: totalInvoices,
        pending: pendingInvoices,
        overdue: overdueInvoices,
        paidThisMonth,
      },
    };
  }

  async getRecentActivities(limit: number = 10): Promise<RecentActivityDto[]> {
    const activities: RecentActivityDto[] = [];

    // Get recent patient activities
    const recentPatients = await this.prisma.patient.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    recentPatients.forEach((patient) => {
      activities.push({
        id: patient.id,
        type: 'patient',
        title: 'New Patient Added',
        description: `${patient.firstName} ${patient.lastName} was added to the system`,
        timestamp: patient.createdAt.toISOString(),
        user: 'System',
        metadata: { patientId: patient.patientId },
      });
    });

    // Get recent appointment activities
    const recentAppointments = await this.prisma.consultation.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    recentAppointments.forEach((appointment) => {
      activities.push({
        id: appointment.id,
        type: 'appointment',
        title: 'Appointment Created',
        description: `Appointment scheduled for ${appointment.patient.firstName} ${appointment.patient.lastName}`,
        timestamp: appointment.createdAt.toISOString(),
        user: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        metadata: { appointmentDate: appointment.appointmentDate },
      });
    });

    // Get recent invoice activities
    const recentInvoices = await this.prisma.invoice.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    recentInvoices.forEach((invoice) => {
      activities.push({
        id: invoice.id,
        type: 'invoice',
        title: 'Invoice Created',
        description: `Invoice #${invoice.invoiceNumber} created for ${invoice.patient.firstName} ${invoice.patient.lastName}`,
        timestamp: invoice.createdAt.toISOString(),
        user: 'System',
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(invoice.totalAmount),
        },
      });
    });

    // Sort by timestamp and return limited results
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);
  }

  async getRevenueChart(
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ): Promise<ChartDataDto> {
    const now = new Date();
    let startDate: Date;
    let labels: string[];

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        labels = Array.from({ length: 30 }, (_, i) => (i + 1).toString());
        break;
      case 'quarter':
        startDate = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        labels = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        labels = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        break;
    }

    // Get revenue data for the period
    const revenueData = await this.prisma.invoice.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: 'PAID',
      },
      _sum: { totalAmount: true },
    });

    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: [Number(revenueData._sum.totalAmount) || 0],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
        },
      ],
    };
  }

  async getAppointmentChart(
    period: 'week' | 'month' | 'quarter' = 'month',
  ): Promise<ChartDataDto> {
    const now = new Date();
    let startDate: Date;
    let labels: string[];

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        labels = Array.from({ length: 30 }, (_, i) => (i + 1).toString());
        break;
      case 'quarter':
        startDate = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        labels = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];
        break;
    }

    // Get appointment data for the period
    const appointmentCount = await this.prisma.consultation.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    return {
      labels,
      datasets: [
        {
          label: 'Appointments',
          data: [appointmentCount],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
        },
      ],
    };
  }

  async getTopServices(
    limit: number = 5,
    period: 'week' | 'month' | 'quarter' = 'month',
  ): Promise<TopServiceDto[]> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        break;
    }

    // Get top services by usage count (simplified for now)
    const topServices = await this.prisma.service.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
      },
    });

    return topServices.map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category.name,
      count: 0, // Placeholder - would need to count actual usage
      revenue: Number(service.currentPrice),
    }));
  }

  async getUpcomingAppointments(
    limit: number = 5,
  ): Promise<UpcomingAppointmentDto[]> {
    const now = new Date();

    const appointments = await this.prisma.consultation.findMany({
      take: limit,
      where: {
        appointmentDate: { gt: now },
        isCompleted: false,
      },
      orderBy: { appointmentDate: 'asc' },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    return appointments.map((appointment) => ({
      id: appointment.id,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      serviceName: 'Consultation', // Default service name
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0],
      appointmentTime: appointment.appointmentDate
        .toTimeString()
        .split(' ')[0]
        .substring(0, 5),
      status: appointment.isCompleted ? 'COMPLETED' : 'SCHEDULED',
    }));
  }

  async getOverdueInvoices(limit: number = 5): Promise<OverdueInvoiceDto[]> {
    const now = new Date();

    const invoices = await this.prisma.invoice.findMany({
      take: limit,
      where: {
        dueDate: { lt: now },
        status: { not: 'PAID' },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.invoiceNumber,
      patientName: `${invoice.patient.firstName} ${invoice.patient.lastName}`,
      dueDate: invoice.dueDate?.toISOString().split('T')[0] || 'N/A',
      totalAmount: Number(invoice.totalAmount),
    }));
  }

  async getPatientDemographics(): Promise<any> {
    const [totalPatients, maleCount, femaleCount, otherCount] =
      await Promise.all([
        this.prisma.patient.count(),
        this.prisma.patient.count({ where: { gender: 'MALE' } }),
        this.prisma.patient.count({ where: { gender: 'FEMALE' } }),
        this.prisma.patient.count({ where: { gender: 'OTHER' } }),
      ]);

    return {
      total: totalPatients,
      male: maleCount,
      female: femaleCount,
      other: otherCount,
      malePercentage: totalPatients > 0 ? (maleCount / totalPatients) * 100 : 0,
      femalePercentage:
        totalPatients > 0 ? (femaleCount / totalPatients) * 100 : 0,
      otherPercentage:
        totalPatients > 0 ? (otherCount / totalPatients) * 100 : 0,
    };
  }

  async getFinancialSummary(
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const [totalRevenue, totalInvoices, paidInvoices, pendingInvoices] =
      await Promise.all([
        this.prisma.invoice.aggregate({
          where: {
            createdAt: { gte: startDate },
            status: 'PAID',
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.invoice.count({
          where: { createdAt: { gte: startDate } },
        }),
        this.prisma.invoice.count({
          where: {
            createdAt: { gte: startDate },
            status: 'PAID',
          },
        }),
        this.prisma.invoice.count({
          where: {
            createdAt: { gte: startDate },
            status: 'PENDING',
          },
        }),
      ]);

    return {
      period,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
    };
  }

  async getAppointmentSummary(
    period: 'week' | 'month' | 'quarter' = 'month',
  ): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        break;
    }

    const [
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
    ] = await Promise.all([
      this.prisma.consultation.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.consultation.count({
        where: {
          createdAt: { gte: startDate },
          isCompleted: true,
        },
      }),
      this.prisma.consultation.count({
        where: {
          createdAt: { gte: startDate },
          isCompleted: false,
        },
      }),
      this.prisma.consultation.count({
        where: {
          createdAt: { gte: startDate },
          isCompleted: false,
        },
      }),
    ]);

    return {
      period,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      completionRate:
        totalAppointments > 0
          ? (completedAppointments / totalAppointments) * 100
          : 0,
    };
  }

  async getAlerts(): Promise<any[]> {
    const alerts: any[] = [];

    // Check for overdue invoices
    const overdueInvoices = await this.prisma.invoice.count({
      where: {
        dueDate: { lt: new Date() },
        status: { not: 'PAID' },
      },
    });

    if (overdueInvoices > 0) {
      alerts.push({
        id: 'overdue-invoices',
        type: 'warning',
        title: 'Overdue Invoices',
        message: `${overdueInvoices} invoices are overdue`,
        severity: 'high',
      });
    }

    // Check for low stock medications
    const lowStockMedications = await this.prisma.medicationInventory.count({
      where: {
        quantity: { lte: 10 },
      },
    });

    if (lowStockMedications > 0) {
      alerts.push({
        id: 'low-stock',
        type: 'info',
        title: 'Low Stock Alert',
        message: `${lowStockMedications} medications are running low`,
        severity: 'medium',
      });
    }

    return alerts;
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    // In a real implementation, you would mark alerts as read in the database
    // For now, we'll just return successfully
    return;
  }

  async getSystemHealth(): Promise<any> {
    // Check database connectivity
    const dbHealth = await this.prisma.$queryRaw`SELECT 1`
      .then(() => 'healthy')
      .catch(() => 'unhealthy');

    return {
      database: dbHealth,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  async exportDashboardReport(format: 'pdf' | 'excel'): Promise<Buffer> {
    // In a real implementation, you would generate and return the actual report
    // For now, we'll return a simple text representation
    const dashboardData = await this.getDashboardData();
    const reportContent = JSON.stringify(dashboardData, null, 2);

    return Buffer.from(reportContent, 'utf-8');
  }
}
