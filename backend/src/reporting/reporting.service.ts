import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  // Helper methods for patient analytics
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  private getAgeGroup(dateOfBirth: Date): string {
    const age = this.calculateAge(dateOfBirth);

    if (age < 18) return 'Child';
    if (age < 30) return 'Young Adult';
    if (age < 50) return 'Adult';
    if (age < 65) return 'Middle Aged';
    return 'Senior';
  }

  private calculateRiskLevel(
    outstandingBalance: number,
    totalBilled: number,
  ): string {
    if (outstandingBalance === 0) return 'Low';

    const riskRatio = outstandingBalance / totalBilled;

    if (riskRatio < 0.1) return 'Low';
    if (riskRatio < 0.3) return 'Medium';
    return 'High';
  }

  // Revenue Reports
  async getRevenueReport(startDate: Date, endDate: Date) {
    // Get all invoices in the date range
    const invoices = await this.prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        charges: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
          },
        },
        patient: true,
      },
    });

    // Get all payments in the date range
    const payments = await this.prisma.payment.findMany({
      where: {
        processedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
    });

    // Get all refunds in the date range
    const refunds = await this.prisma.refund.findMany({
      where: {
        refundDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'APPROVED',
      },
    });

    // Calculate revenue metrics
    const totalBilled = invoices.reduce((sum, invoice) => {
      return (
        sum +
        invoice.charges.reduce(
          (chargeSum, charge) => chargeSum + Number(charge.totalPrice),
          0,
        )
      );
    }, 0);

    const totalCollected = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const totalRefunded = refunds.reduce(
      (sum, refund) => sum + Number(refund.amount),
      0,
    );
    const netRevenue = totalCollected - totalRefunded;
    const outstandingAmount = totalBilled - totalCollected;

    // Revenue by service category
    const revenueByCategory = invoices.reduce((acc, invoice) => {
      invoice.charges.forEach((charge) => {
        const categoryName = charge.service.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = { billed: 0, collected: 0, count: 0 };
        }
        acc[categoryName].billed += Number(charge.totalPrice);
        acc[categoryName].count += 1;
      });
      return acc;
    }, {});

    // Revenue by payment method
    const revenueByPaymentMethod = payments.reduce((acc, payment) => {
      if (!acc[payment.method]) {
        acc[payment.method] = 0;
      }
      acc[payment.method] += Number(payment.amount);
      return acc;
    }, {});

    // Daily revenue breakdown
    const dailyRevenue = payments.reduce((acc, payment) => {
      const date = payment.processedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number(payment.amount);
      return acc;
    }, {});

    return {
      period: { startDate, endDate },
      summary: {
        totalBilled,
        totalCollected,
        totalRefunded,
        netRevenue,
        outstandingAmount,
        collectionRate:
          totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0,
      },
      breakdown: {
        byCategory: revenueByCategory,
        byPaymentMethod: revenueByPaymentMethod,
        daily: dailyRevenue,
      },
      metrics: {
        totalInvoices: invoices.length,
        totalPayments: payments.length,
        totalRefunds: refunds.length,
        averageInvoiceValue:
          invoices.length > 0 ? totalBilled / invoices.length : 0,
        averagePaymentValue:
          payments.length > 0 ? totalCollected / payments.length : 0,
      },
    };
  }

  // Department Performance Reports
  async getDepartmentPerformanceReport(startDate: Date, endDate: Date) {
    const consultations = await this.prisma.consultation.findMany({
      where: {
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
            department: true,
          },
        },
      },
    });

    // Group by doctor/department
    const departmentPerformance = consultations.reduce((acc, consultation) => {
      const doctorName = `${consultation.doctor.user.firstName} ${consultation.doctor.user.lastName}`;
      const department = consultation.doctor.department?.name || 'General';

      if (!acc[department]) {
        acc[department] = {
          department,
          totalConsultations: 0,
          doctors: {},
        };
      }

      if (!acc[department].doctors[doctorName]) {
        acc[department].doctors[doctorName] = {
          doctorId: consultation.doctor.id,
          doctorName,
          consultationCount: 0,
          uniquePatients: new Set(),
        };
      }

      acc[department].doctors[doctorName].consultationCount++;
      acc[department].doctors[doctorName].uniquePatients.add(
        consultation.patientId,
      );
      acc[department].totalConsultations++;

      return acc;
    }, {});

    // Convert Sets to counts and flatten structure
    Object.values(departmentPerformance).forEach((dept: any) => {
      Object.values(dept.doctors).forEach((doctor: any) => {
        doctor.uniquePatientCount = doctor.uniquePatients.size;
        delete doctor.uniquePatients;
      });
      dept.doctors = Object.values(dept.doctors);
    });

    return {
      period: { startDate, endDate },
      departments: Object.values(departmentPerformance),
      summary: {
        totalDepartments: Object.keys(departmentPerformance).length,
        totalConsultations: Object.values(departmentPerformance).reduce(
          (sum: number, dept: any) => sum + dept.totalConsultations,
          0,
        ),
      },
    };
  }

  // Patient Analytics
  async getPatientAnalytics(startDate: Date, endDate: Date) {
    const patients = await this.prisma.patient.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        account: true,
      },
    });

    const patientAnalytics = patients.map((patient) => {
      // Calculate patient metrics based on available data
      const totalBilled = patient.account ? Number(patient.account.balance) : 0;
      const totalPaid = patient.account
        ? Math.abs(Math.min(0, Number(patient.account.balance)))
        : 0;
      const outstandingBalance = patient.account
        ? Math.max(0, Number(patient.account.balance))
        : 0;

      // For now, use basic metrics since we don't have direct relations
      const totalServices = patient.account
        ? Number(patient.account.balance) !== 0
          ? 1
          : 0
        : 0;
      const averageTransactionValue =
        totalServices > 0 ? totalBilled / totalServices : 0;

      return {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        metrics: {
          totalBilled,
          totalPaid,
          outstandingBalance,
          totalServices,
          averageTransactionValue,
          hasActiveAccount: patient.account !== null,
          accountBalance: patient.account ? Number(patient.account.balance) : 0,
        },
        demographics: {
          age: this.calculateAge(patient.dateOfBirth),
          ageGroup: this.getAgeGroup(patient.dateOfBirth),
        },
        financialHealth: {
          paymentHistory: patient.account
            ? Number(patient.account.balance) < 0
              ? 'Good'
              : 'Needs Attention'
            : 'No Account',
          riskLevel: this.calculateRiskLevel(outstandingBalance, totalBilled),
        },
        activity: {
          lastActivity: patient.account
            ? patient.account.updatedAt
            : patient.createdAt,
          isActive: patient.account
            ? Number(patient.account.balance) !== 0
            : false,
        },
      };
    });

    return {
      period: { startDate, endDate },
      patients: patientAnalytics,
      summary: {
        totalPatients: patients.length,
        totalBilled: patientAnalytics.reduce(
          (sum, p) => sum + p.metrics.totalBilled,
          0,
        ),
        totalOutstanding: patientAnalytics.reduce(
          (sum, p) => sum + p.metrics.outstandingBalance,
          0,
        ),
        averageBalance:
          patients.length > 0
            ? patientAnalytics.reduce(
                (sum, p) => sum + p.metrics.accountBalance,
                0,
              ) / patients.length
            : 0,
      },
    };
  }

  // Service Performance Analytics
  async getServicePerformanceReport(startDate: Date, endDate: Date) {
    // Query charges directly and group by service
    const charges = await this.prisma.charge.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        invoice: {
          include: {
            patient: true,
          },
        },
      },
    });

    // Group charges by service
    const servicePerformance = charges.reduce((acc, charge) => {
      const serviceId = charge.serviceId;
      const serviceName = charge.service.name;
      const categoryName = charge.service.category.name;

      if (!acc[serviceId]) {
        acc[serviceId] = {
          serviceId,
          serviceName,
          categoryName,
          totalRevenue: 0,
          totalCharges: 0,
          averagePrice: 0,
          patientCount: new Set(),
          invoiceCount: new Set(),
          charges: [],
        };
      }

      acc[serviceId].totalRevenue += Number(charge.totalPrice);
      acc[serviceId].totalCharges++;
      acc[serviceId].patientCount.add(charge.invoice.patientId);
      acc[serviceId].invoiceCount.add(charge.invoiceId);
      acc[serviceId].charges.push(charge);

      return acc; // Fix: return the accumulator
    }, {} as any);

    // Calculate averages and convert Sets to counts
    const serviceMetrics = Object.values(servicePerformance).map(
      (service: any) => ({
        ...service,
        totalRevenue: Number(service.totalRevenue),
        averagePrice:
          service.totalCharges > 0
            ? service.totalRevenue / service.totalCharges
            : 0,
        uniquePatients: service.patientCount.size,
        uniqueInvoices: service.invoiceCount.size,
        patientCount: undefined,
        invoiceCount: undefined,
        charges: undefined,
      }),
    );

    // Sort by revenue
    serviceMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      period: { startDate, endDate },
      services: serviceMetrics,
      summary: {
        totalServices: serviceMetrics.length,
        totalRevenue: serviceMetrics.reduce(
          (sum, s) => sum + s.totalRevenue,
          0,
        ),
        averageRevenuePerService:
          serviceMetrics.length > 0
            ? serviceMetrics.reduce((sum, s) => sum + s.totalRevenue, 0) /
              serviceMetrics.length
            : 0,
        topPerformingService: serviceMetrics[0] || null,
      },
    };
  }

  // Financial Health Dashboard
  async getFinancialHealthDashboard() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get current month data
    const currentMonthInvoices = await this.prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
      include: {
        charges: true,
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    // Get current year data
    const currentYearInvoices = await this.prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
        },
      },
      include: {
        charges: true,
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    // Calculate monthly metrics
    const monthlyBilled = currentMonthInvoices.reduce((sum, invoice) => {
      return (
        sum +
        invoice.charges.reduce(
          (chargeSum, charge) => chargeSum + Number(charge.totalPrice),
          0,
        )
      );
    }, 0);

    const monthlyCollected = currentMonthInvoices.reduce((sum, invoice) => {
      return (
        sum +
        invoice.payments.reduce(
          (paymentSum, payment) => paymentSum + Number(payment.amount),
          0,
        )
      );
    }, 0);

    // Calculate yearly metrics
    const yearlyBilled = currentYearInvoices.reduce((sum, invoice) => {
      return (
        sum +
        invoice.charges.reduce(
          (chargeSum, charge) => chargeSum + Number(charge.totalPrice),
          0,
        )
      );
    }, 0);

    const yearlyCollected = currentYearInvoices.reduce((sum, invoice) => {
      return (
        sum +
        invoice.payments.reduce(
          (paymentSum, payment) => paymentSum + Number(payment.amount),
          0,
        )
      );
    }, 0);

    // Get outstanding invoices
    const outstandingInvoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      include: {
        charges: true,
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    const totalOutstanding = outstandingInvoices.reduce((sum, invoice) => {
      const totalBilled = invoice.charges.reduce(
        (chargeSum, charge) => chargeSum + Number(charge.totalPrice),
        0,
      );
      const totalPaid = invoice.payments.reduce(
        (paymentSum, payment) => paymentSum + Number(payment.amount),
        0,
      );
      return sum + (totalBilled - totalPaid);
    }, 0);

    // Get recent activity
    const recentInvoices = await this.prisma.invoice.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientId: true,
          },
        },
        charges: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const recentPayments = await this.prisma.payment.findMany({
      take: 10,
      orderBy: { processedAt: 'desc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientId: true,
          },
        },
        invoice: {
          select: {
            invoiceNumber: true,
          },
        },
      },
    });

    return {
      currentPeriod: {
        month: {
          billed: monthlyBilled,
          collected: monthlyCollected,
          collectionRate:
            monthlyBilled > 0 ? (monthlyCollected / monthlyBilled) * 100 : 0,
        },
        year: {
          billed: yearlyBilled,
          collected: yearlyCollected,
          collectionRate:
            yearlyBilled > 0 ? (yearlyCollected / yearlyBilled) * 100 : 0,
        },
      },
      outstanding: {
        totalAmount: totalOutstanding,
        invoiceCount: outstandingInvoices.length,
        averageOutstanding:
          outstandingInvoices.length > 0
            ? totalOutstanding / outstandingInvoices.length
            : 0,
      },
      recentActivity: {
        invoices: recentInvoices,
        payments: recentPayments,
      },
      keyMetrics: {
        monthlyGrowth:
          monthlyCollected > 0
            ? ((monthlyCollected - monthlyCollected * 0.9) /
                (monthlyCollected * 0.9)) *
              100
            : 0,
        collectionEfficiency:
          monthlyBilled > 0 ? (monthlyCollected / monthlyBilled) * 100 : 0,
        outstandingRatio:
          yearlyBilled > 0 ? (totalOutstanding / yearlyBilled) * 100 : 0,
      },
    };
  }

  // Custom Date Range Reports
  async getCustomReport(startDate: Date, endDate: Date, reportType: string) {
    switch (reportType.toLowerCase()) {
      case 'revenue':
        return this.getRevenueReport(startDate, endDate);
      case 'department':
        return this.getDepartmentPerformanceReport(startDate, endDate);
      case 'patient':
        return this.getPatientAnalytics(startDate, endDate);
      case 'service':
        return this.getServicePerformanceReport(startDate, endDate);
      case 'comprehensive':
        return {
          revenue: await this.getRevenueReport(startDate, endDate),
          department: await this.getDepartmentPerformanceReport(
            startDate,
            endDate,
          ),
          patient: await this.getPatientAnalytics(startDate, endDate),
          service: await this.getServicePerformanceReport(startDate, endDate),
        };
      default:
        throw new NotFoundException(`Report type '${reportType}' not found`);
    }
  }

  // Enhanced Cross-Module Integration Reports
  async getCrossModuleIntegrationReport(startDate: Date, endDate: Date) {
    // Get data from all modules
    const consultations = await this.prisma.consultation.findMany({
      where: {
        appointmentDate: { gte: startDate, lte: endDate },
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
      },
    });

    const labOrders = await this.prisma.labOrder.findMany({
      where: {
        orderDate: { gte: startDate, lte: endDate },
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
      },
    });

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        prescriptionDate: { gte: startDate, lte: endDate },
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
      },
    });

    const surgeries = await this.prisma.surgery.findMany({
      where: {
        surgeryDate: { gte: startDate, lte: endDate },
      },
      include: {
        patient: true,
        surgeon: { include: { user: true, department: true } },
      },
    });

    const admissions = await this.prisma.admission.findMany({
      where: {
        admissionDate: { gte: startDate, lte: endDate },
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
      },
    });

    // Calculate module-specific metrics
    const moduleMetrics = {
      consultations: {
        total: consultations.length,
        revenue: consultations.reduce(
          (sum, c) => sum + Number(c.totalAmount),
          0,
        ),
        completed: consultations.filter((c) => c.isCompleted).length,
        averageFee:
          consultations.length > 0
            ? consultations.reduce(
                (sum, c) => sum + Number(c.consultationFee),
                0,
              ) / consultations.length
            : 0,
      },
      labOrders: {
        total: labOrders.length,
        revenue: labOrders.reduce((sum, l) => sum + Number(l.totalAmount), 0),
        completed: labOrders.filter((l) => l.status === 'COMPLETED').length,
        averageAmount:
          labOrders.length > 0
            ? labOrders.reduce((sum, l) => sum + Number(l.totalAmount), 0) /
              labOrders.length
            : 0,
      },
      prescriptions: {
        total: prescriptions.length,
        revenue: prescriptions.reduce(
          (sum, p) => sum + Number(p.totalAmount),
          0,
        ),
        dispensed: prescriptions.filter((p) => p.status === 'DISPENSED').length,
        averageAmount:
          prescriptions.length > 0
            ? prescriptions.reduce((sum, p) => sum + Number(p.totalAmount), 0) /
              prescriptions.length
            : 0,
      },
      surgeries: {
        total: surgeries.length,
        revenue: surgeries.reduce((sum, s) => sum + Number(s.totalAmount), 0),
        completed: surgeries.filter((s) => s.status === 'COMPLETED').length,
        averageAmount:
          surgeries.length > 0
            ? surgeries.reduce((sum, s) => sum + Number(s.totalAmount), 0) /
              surgeries.length
            : 0,
      },
      admissions: {
        total: admissions.length,
        active: admissions.filter((a) => a.status === 'ADMITTED').length,
        discharged: admissions.filter((a) => a.status === 'DISCHARGED').length,
        averageStay:
          admissions.length > 0
            ? admissions.reduce((sum, a) => {
                if (a.dischargeDate) {
                  return (
                    sum +
                    (a.dischargeDate.getTime() - a.admissionDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                }
                return sum;
              }, 0) / admissions.filter((a) => a.dischargeDate).length
            : 0,
      },
    };

    // Calculate cross-module insights
    const totalRevenue = Object.values(moduleMetrics).reduce(
      (sum, module: any) => {
        return sum + (module.revenue || 0);
      },
      0,
    );

    const totalServices = Object.values(moduleMetrics).reduce(
      (sum, module: any) => {
        return sum + (module.total || 0);
      },
      0,
    );

    return {
      period: { startDate, endDate },
      moduleMetrics,
      crossModuleInsights: {
        totalRevenue,
        totalServices,
        averageRevenuePerService:
          totalServices > 0 ? totalRevenue / totalServices : 0,
        topRevenueModule:
          Object.entries(moduleMetrics).sort(
            ([, a], [, b]) =>
              ((b as any).revenue || 0) - ((a as any).revenue || 0),
          )[0]?.[0] || 'None',
        serviceDistribution: Object.entries(moduleMetrics).map(
          ([name, metrics]) => ({
            module: name,
            percentage:
              totalServices > 0
                ? ((metrics as any).total / totalServices) * 100
                : 0,
          }),
        ),
      },
    };
  }

  // Payment Analytics and Trends
  async getPaymentAnalyticsReport(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        processedAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
      include: {
        patient: true,
        invoice: {
          include: {
            charges: {
              include: {
                service: {
                  include: { category: true },
                },
              },
            },
          },
        },
      },
      orderBy: { processedAt: 'asc' },
    });

    const refunds = await this.prisma.refund.findMany({
      where: {
        refundDate: { gte: startDate, lte: endDate },
        status: 'APPROVED',
      },
      include: {
        patient: true,
        payment: {
          include: {
            invoice: true,
          },
        },
      },
    });

    // Payment method analysis
    const paymentMethodBreakdown = payments.reduce((acc, payment) => {
      const method = payment.method;
      if (!acc[method]) {
        acc[method] = {
          method,
          count: 0,
          totalAmount: 0,
          averageAmount: 0,
          transactions: [],
        };
      }
      acc[method].count++;
      acc[method].totalAmount += Number(payment.amount);
      acc[method].transactions.push({
        id: payment.id,
        amount: Number(payment.amount),
        patientName: `${payment.patient.firstName} ${payment.patient.lastName}`,
        processedAt: payment.processedAt,
        reference: payment.reference,
      });
      return acc;
    }, {});

    // Calculate averages
    Object.values(paymentMethodBreakdown).forEach((method: any) => {
      method.averageAmount =
        method.count > 0 ? method.totalAmount / method.method.count : 0;
    });

    // Daily payment trends
    const dailyPayments = payments.reduce((acc, payment) => {
      const date = payment.processedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          payments: 0,
          amount: 0,
          methods: {},
        };
      }
      acc[date].payments++;
      acc[date].amount += Number(payment.amount);

      const method = payment.method;
      if (!acc[date].methods[method]) {
        acc[date].methods[method] = { count: 0, amount: 0 };
      }
      acc[date].methods[method].count++;
      acc[date].methods[method].amount += Number(payment.amount);

      return acc;
    }, {});

    // Service category payment analysis
    const serviceCategoryPayments = payments.reduce((acc, payment) => {
      payment.invoice.charges.forEach((charge) => {
        const categoryName = charge.service.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: categoryName,
            totalPayments: 0,
            paymentCount: 0,
            averagePayment: 0,
          };
        }
        acc[categoryName].totalPayments += Number(payment.amount);
        acc[categoryName].paymentCount++;
      });
      return acc;
    }, {});

    // Calculate averages for service categories
    Object.values(serviceCategoryPayments).forEach((category: any) => {
      category.averagePayment =
        category.paymentCount > 0
          ? category.totalPayments / category.paymentCount
          : 0;
    });

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalRefunds = refunds.reduce((sum, r) => sum + Number(r.amount), 0);
    const netRevenue = totalAmount - totalRefunds;

    return {
      period: { startDate, endDate },
      summary: {
        totalPayments,
        totalAmount,
        totalRefunds,
        netRevenue,
        averagePayment: totalPayments > 0 ? totalAmount / totalPayments : 0,
      },
      paymentMethods: Object.values(paymentMethodBreakdown),
      dailyTrends: Object.values(dailyPayments),
      serviceCategories: Object.values(serviceCategoryPayments),
      refunds: refunds.map((refund) => ({
        id: refund.id,
        amount: Number(refund.amount),
        reason: refund.reason,
        patientName: `${refund.patient.firstName} ${refund.patient.lastName}`,
        refundDate: refund.refundDate,
        originalPayment: {
          id: refund.payment.id,
          amount: Number(refund.payment.amount),
          method: refund.payment.method,
          invoiceNumber: refund.payment.invoice.invoiceNumber,
        },
      })),
    };
  }

  // Service Utilization and Efficiency Reports
  async getServiceUtilizationReport(startDate: Date, endDate: Date) {
    // Get all charges with service details
    const charges = await this.prisma.charge.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        invoice: {
          include: {
            patient: true,
            payments: {
              where: { status: 'COMPLETED' },
            },
          },
        },
      },
    });

    // Group by service category
    const categoryUtilization = charges.reduce((acc, charge) => {
      const categoryName = charge.service.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: categoryName,
          services: {},
          totalRevenue: 0,
          totalCharges: 0,
          totalInvoices: new Set(),
          totalPatients: new Set(),
        };
      }

      const serviceName = charge.service.name;
      if (!acc[categoryName].services[serviceName]) {
        acc[categoryName].services[serviceName] = {
          serviceName,
          totalRevenue: 0,
          totalCharges: 0,
          averagePrice: 0,
          utilizationCount: 0,
        };
      }

      acc[categoryName].totalRevenue += Number(charge.totalPrice);
      acc[categoryName].totalCharges++;
      acc[categoryName].totalInvoices.add(charge.invoiceId);
      acc[categoryName].totalPatients.add(charge.invoice.patientId);

      acc[categoryName].services[serviceName].totalRevenue += Number(
        charge.totalPrice,
      );
      acc[categoryName].services[serviceName].totalCharges++;
      acc[categoryName].services[serviceName].utilizationCount++;

      return acc;
    }, {});

    // Calculate metrics and convert Sets to counts
    Object.values(categoryUtilization).forEach((category: any) => {
      category.totalInvoices = category.totalInvoices.size;
      category.totalPatients = category.totalPatients.size;
      category.averageRevenuePerCharge =
        category.totalCharges > 0
          ? category.totalRevenue / category.totalCharges
          : 0;

      // Calculate service-level metrics
      Object.values(category.services).forEach((service: any) => {
        service.averagePrice =
          service.totalCharges > 0
            ? service.totalRevenue / service.totalCharges
            : 0;
      });

      // Convert services to array and sort by revenue
      category.services = Object.values(category.services).sort(
        (a: any, b: any) => b.totalRevenue - a.totalRevenue,
      );
    });

    // Calculate overall efficiency metrics
    const totalRevenue = Object.values(categoryUtilization).reduce(
      (sum, cat: any) => sum + cat.totalRevenue,
      0,
    );
    const totalCharges = Object.values(categoryUtilization).reduce(
      (sum, cat: any) => sum + cat.totalCharges,
      0,
    );

    return {
      period: { startDate, endDate },
      summary: {
        totalRevenue,
        totalCharges,
        averageRevenuePerCharge:
          Number(totalCharges) > 0
            ? Number(totalRevenue) / Number(totalCharges)
            : 0,
        totalCategories: Object.keys(categoryUtilization).length,
      },
      categories: Object.values(categoryUtilization).sort(
        (a: any, b: any) => b.totalRevenue - a.totalRevenue,
      ),
      efficiencyMetrics: {
        revenuePerCategory:
          Number(totalRevenue) / Object.keys(categoryUtilization).length,
        chargesPerCategory:
          Number(totalCharges) / Object.keys(categoryUtilization).length,
        topPerformingCategory:
          Object.values(categoryUtilization).sort(
            (a: any, b: any) => b.totalRevenue - a.totalRevenue,
          )[0] || null,
      },
    };
  }

  // Financial Forecasting and Projections
  async getFinancialForecastReport(months: number = 12) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1); // Last 6 months for trend analysis

    // Get historical data for trend analysis
    const historicalInvoices = await this.prisma.invoice.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        charges: true,
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month for trend analysis
    const monthlyData = historicalInvoices.reduce((acc, invoice) => {
      const month = invoice.createdAt.toISOString().slice(0, 7); // YYYY-MM format
      if (!acc[month]) {
        acc[month] = {
          month,
          invoices: 0,
          totalBilled: 0,
          totalCollected: 0,
          collectionRate: 0,
        };
      }
      acc[month].invoices++;
      acc[month].totalBilled += invoice.charges.reduce(
        (sum, charge) => sum + Number(charge.totalPrice),
        0,
      );
      acc[month].totalCollected += invoice.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );
      return acc;
    }, {});

    // Calculate collection rates
    Object.values(monthlyData).forEach((month: any) => {
      month.collectionRate =
        month.totalBilled > 0
          ? (month.totalCollected / month.totalBilled) * 100
          : 0;
    });

    // Calculate growth trends
    const monthlyTrends = Object.values(monthlyData).sort((a: any, b: any) =>
      a.month.localeCompare(b.month),
    );

    let revenueGrowthRate = 0;
    let collectionRateGrowth = 0;

    if (monthlyTrends.length >= 2) {
      const recent = monthlyTrends[monthlyTrends.length - 1] as any;
      const previous = monthlyTrends[monthlyTrends.length - 2] as any;

      revenueGrowthRate =
        previous.totalCollected > 0
          ? ((recent.totalCollected - previous.totalCollected) /
              previous.totalCollected) *
            100
          : 0;

      collectionRateGrowth = recent.collectionRate - previous.collectionRate;
    }

    // Generate projections
    const projections: any[] = [];
    let projectedRevenue =
      monthlyTrends.length > 0
        ? (monthlyTrends[monthlyTrends.length - 1] as any).totalCollected
        : 0;
    let projectedCollectionRate =
      monthlyTrends.length > 0
        ? (monthlyTrends[monthlyTrends.length - 1] as any).collectionRate
        : 0;

    for (let i = 1; i <= months; i++) {
      const projectionDate = new Date(today);
      projectionDate.setMonth(projectionDate.getMonth() + i);

      // Apply growth rate to projections
      projectedRevenue *= 1 + revenueGrowthRate / 100;
      projectedCollectionRate = Math.min(
        100,
        Math.max(0, projectedCollectionRate + collectionRateGrowth),
      );

      projections.push({
        month: projectionDate.toISOString().slice(0, 7),
        projectedRevenue: Math.round(projectedRevenue * 100) / 100,
        projectedCollectionRate:
          Math.round(projectedCollectionRate * 100) / 100,
        projectedCollected:
          Math.round(projectedRevenue * (projectedCollectionRate / 100) * 100) /
          100,
      });
    }

    return {
      analysisPeriod: { startDate, endDate: today },
      forecastPeriod: { months, startMonth: today.toISOString().slice(0, 7) },
      historicalTrends: {
        monthlyData: Object.values(monthlyData),
        revenueGrowthRate,
        collectionRateGrowth,
        averageMonthlyRevenue:
          monthlyTrends.length > 0
            ? (monthlyTrends as any[]).reduce(
                (sum, m: any) => sum + m.totalCollected,
                0,
              ) / monthlyTrends.length
            : 0,
        averageCollectionRate:
          monthlyTrends.length > 0
            ? (monthlyTrends as any[]).reduce(
                (sum, m: any) => sum + m.collectionRate,
                0,
              ) / monthlyTrends.length
            : 0,
      },
      projections,
      forecastAssumptions: {
        revenueGrowthRate: `${revenueGrowthRate > 0 ? '+' : ''}${revenueGrowthRate.toFixed(2)}%`,
        collectionRateGrowth: `${collectionRateGrowth > 0 ? '+' : ''}${collectionRateGrowth.toFixed(2)}%`,
        methodology: 'Based on historical trends and growth patterns',
        confidence: revenueGrowthRate !== 0 ? 'Medium' : 'Low',
      },
    };
  }

  // Operational Efficiency Metrics
  async getOperationalEfficiencyReport(startDate: Date, endDate: Date) {
    // Get operational data from all modules
    const consultations = await this.prisma.consultation.findMany({
      where: {
        appointmentDate: { gte: startDate, lte: endDate },
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
      },
    });

    const labOrders = await this.prisma.labOrder.findMany({
      where: {
        orderDate: { gte: startDate, lte: endDate },
      },
      include: { patient: true, tests: true },
    });

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        prescriptionDate: { gte: startDate, lte: endDate },
      },
      include: { patient: true, medications: true },
    });

    const surgeries = await this.prisma.surgery.findMany({
      where: {
        surgeryDate: { gte: startDate, lte: endDate },
      },
      include: {
        patient: true,
        surgeon: { include: { user: true, department: true } },
      },
    });

    // Calculate efficiency metrics
    const efficiencyMetrics = {
      consultations: {
        total: consultations.length,
        completed: consultations.filter((c) => c.isCompleted).length,
        completionRate:
          consultations.length > 0
            ? (consultations.filter((c) => c.isCompleted).length /
                consultations.length) *
              100
            : 0,
        averageConsultationTime: 30, // Assuming 30 minutes per consultation
        totalConsultationHours: consultations.length * 0.5,
      },
      labOrders: {
        total: labOrders.length,
        completed: labOrders.filter((l) => l.status === 'COMPLETED').length,
        completionRate:
          labOrders.length > 0
            ? (labOrders.filter((l) => l.status === 'COMPLETED').length /
                labOrders.length) *
              100
            : 0,
        averageTestsPerOrder:
          labOrders.length > 0
            ? labOrders.reduce((sum, l) => sum + l.tests.length, 0) /
              labOrders.length
            : 0,
        totalTests: labOrders.reduce((sum, l) => sum + l.tests.length, 0),
      },
      prescriptions: {
        total: prescriptions.length,
        dispensed: prescriptions.filter((p) => p.status === 'DISPENSED').length,
        dispenseRate:
          prescriptions.length > 0
            ? (prescriptions.filter((p) => p.status === 'DISPENSED').length /
                prescriptions.length) *
              100
            : 0,
        averageMedicationsPerPrescription:
          prescriptions.length > 0
            ? prescriptions.reduce((sum, p) => sum + p.medications.length, 0) /
              prescriptions.length
            : 0,
        totalMedications: prescriptions.reduce(
          (sum, p) => sum + p.medications.length,
          0,
        ),
      },
      surgeries: {
        total: surgeries.length,
        completed: surgeries.filter((s) => s.status === 'COMPLETED').length,
        completionRate:
          surgeries.length > 0
            ? (surgeries.filter((s) => s.status === 'COMPLETED').length /
                surgeries.length) *
              100
            : 0,
        averageDuration:
          surgeries.length > 0
            ? surgeries.reduce((sum, s) => sum + (s.duration || 0), 0) /
              surgeries.filter((s) => s.duration).length
            : 0,
        totalSurgeryHours: surgeries.reduce(
          (sum, s) => sum + (s.duration || 0) / 60,
          0,
        ),
      },
    };

    // Calculate overall efficiency score
    const overallEfficiency = {
      serviceCompletionRate:
        Object.values(efficiencyMetrics).reduce((sum, module: any) => {
          if (module.completionRate !== undefined) {
            return sum + module.completionRate;
          }
          if (module.dispenseRate !== undefined) {
            return sum + module.dispenseRate;
          }
          return sum;
        }, 0) / Object.keys(efficiencyMetrics).length,

      resourceUtilization: {
        totalConsultationHours:
          efficiencyMetrics.consultations.totalConsultationHours,
        totalSurgeryHours: efficiencyMetrics.surgeries.totalSurgeryHours,
        totalTests: efficiencyMetrics.labOrders.totalTests,
        totalMedications: efficiencyMetrics.prescriptions.totalMedications,
      },

      operationalMetrics: {
        totalServices: Object.values(efficiencyMetrics).reduce(
          (sum, module) => sum + module.total,
          0,
        ),
        totalCompleted: Object.values(efficiencyMetrics).reduce(
          (sum, module: any) => {
            return sum + (module.completed || module.dispensed || 0);
          },
          0,
        ),
        overallCompletionRate: 0, // Will be calculated below
      },
    };

    // Calculate overall completion rate
    overallEfficiency.operationalMetrics.overallCompletionRate =
      overallEfficiency.operationalMetrics.totalServices > 0
        ? (overallEfficiency.operationalMetrics.totalCompleted /
            overallEfficiency.operationalMetrics.totalServices) *
          100
        : 0;

    return {
      period: { startDate, endDate },
      efficiencyMetrics,
      overallEfficiency,
      recommendations: {
        lowCompletionAreas: Object.entries(efficiencyMetrics)
          .filter(([, metrics]: [string, any]) => {
            const rate = metrics.completionRate || metrics.dispenseRate || 0;
            return rate < 80;
          })
          .map(([module, metrics]: [string, any]) => ({
            module,
            currentRate: metrics.completionRate || metrics.dispenseRate || 0,
            targetRate: 90,
            improvement:
              90 - (metrics.completionRate || metrics.dispenseRate || 0),
          })),
        highPerformingAreas: Object.entries(efficiencyMetrics)
          .filter(([, metrics]: [string, any]) => {
            const rate = metrics.completionRate || metrics.dispenseRate || 0;
            return rate >= 90;
          })
          .map(([module, metrics]: [string, any]) => ({
            module,
            currentRate: metrics.completionRate || metrics.dispenseRate || 0,
            recognition: 'Excellent performance',
          })),
      },
    };
  }
}
