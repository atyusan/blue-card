import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // Payment Management
  async createPayment(createPaymentDto: CreatePaymentDto) {
    const {
      invoiceId,
      patientId,
      amount,
      paymentMethod,
      referenceNumber,
      notes,
    } = createPaymentDto;

    // Check if invoice exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { charges: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Calculate total invoice amount
    const totalInvoiceAmount = invoice.charges.reduce(
      (sum, charge) => sum + Number(charge.totalPrice),
      0,
    );

    // Check if payment amount exceeds invoice amount
    if (amount > totalInvoiceAmount) {
      throw new ConflictException(
        'Payment amount cannot exceed invoice amount',
      );
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        patientId,
        amount,
        method: paymentMethod,
        reference: referenceNumber,
        notes,
        processedBy: 'system', // TODO: Get from authenticated user
        processedAt: new Date(),
      },
      include: {
        invoice: true,
        patient: true,
      },
    });

    // Update invoice status
    const totalPaid = await this.getTotalPaidForInvoice(invoiceId);
    const newStatus = totalPaid >= totalInvoiceAmount ? 'PAID' : 'PARTIAL';

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        paidAmount: totalPaid,
        balance: totalInvoiceAmount - totalPaid,
        paidDate: newStatus === 'PAID' ? new Date() : null,
      },
    });

    // Update patient account balance
    await this.updatePatientAccountBalance(patientId, amount);

    return payment;
  }

  async findAllPayments(query?: {
    invoiceId?: string;
    patientId?: string;
    paymentMethod?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    const where: any = {};

    if (query?.invoiceId) {
      where.invoiceId = query.invoiceId;
    }

    if (query?.patientId) {
      where.patientId = query.patientId;
    }

    if (query?.paymentMethod) {
      where.method = query.paymentMethod;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.startDate || query?.endDate) {
      where.processedAt = {};
      if (query.startDate) where.processedAt.gte = query.startDate;
      if (query.endDate) where.processedAt.lte = query.endDate;
    }

    if (query?.search) {
      where.OR = [
        {
          patient: {
            firstName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          patient: {
            lastName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          patient: {
            patientId: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        invoice: {
          include: {
            patient: {
              select: {
                id: true,
                patientId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        patient: {
          select: {
            id: true,
            patientId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { processedAt: 'desc' },
    });

    return payments;
  }

  async findPaymentById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            account: true,
          },
        },
        invoice: {
          include: {
            patient: true,
            charges: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async updatePayment(id: string, updatePaymentDto: UpdatePaymentDto) {
    await this.findPaymentById(id);

    const payment = await this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
      include: {
        patient: true,
        invoice: true,
      },
    });

    return payment;
  }

  // Refund Management
  async createRefund(refundData: CreateRefundDto) {
    const { paymentId, amount, reason, notes, referenceNumber } = refundData;

    // Check if payment exists
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check if payment is completed
    if (payment.status !== 'COMPLETED') {
      throw new ConflictException('Can only refund completed payments');
    }

    // Check if refund amount is valid
    if (Number(amount) > Number(payment.amount)) {
      throw new ConflictException('Refund amount cannot exceed payment amount');
    }

    // Create refund
    const refund = await this.prisma.refund.create({
      data: {
        paymentId,
        patientId: payment.patientId,
        invoiceId: payment.invoiceId,
        amount,
        reason,
        notes,
        referenceNumber,
        status: 'PENDING',
      },
    });

    // Update payment status if fully refunded
    if (Number(amount) === Number(payment.amount)) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      });
    }

    // Update invoice status
    const totalPaid = await this.getTotalPaidForInvoice(payment.invoiceId);
    const totalRefunded = await this.getTotalRefundedForInvoice(
      payment.invoiceId,
    );
    const netPaid = totalPaid - totalRefunded;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payment.invoiceId },
      include: { charges: true },
    });

    if (invoice) {
      const totalAmount = invoice.charges.reduce(
        (sum, charge) => sum + Number(charge.totalPrice),
        0,
      );

      const newStatus =
        netPaid >= totalAmount ? 'PAID' : netPaid > 0 ? 'PARTIAL' : 'PENDING';

      await this.prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: newStatus,
          paidAmount: netPaid,
          balance: totalAmount - netPaid,
        },
      });
    }

    return refund;
  }

  async approveRefund(refundId: string, approvedBy: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        payment: true,
        patient: true,
      },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status !== 'PENDING') {
      throw new ConflictException('Refund is not in pending status');
    }

    // Approve refund
    const approvedRefund = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        payment: {
          include: {
            invoice: true,
            patient: true,
          },
        },
        patient: true,
      },
    });

    // Update patient account balance (add back the refunded amount)
    await this.prisma.patientAccount.update({
      where: { patientId: refund.patientId },
      data: {
        balance: {
          increment: refund.amount,
        },
      },
    });

    return approvedRefund;
  }

  async rejectRefund(
    refundId: string,
    rejectedBy: string,
    rejectionReason: string,
  ) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status !== 'PENDING') {
      throw new ConflictException('Refund is not in pending status');
    }

    const rejectedRefund = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'REJECTED',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason,
      },
      include: {
        payment: {
          include: {
            invoice: true,
            patient: true,
          },
        },
        patient: true,
      },
    });

    return rejectedRefund;
  }

  // Payment Methods and Financial Management
  async getPaymentMethods() {
    const methods = await this.prisma.payment.groupBy({
      by: ['method'],
      _count: {
        method: true,
      },
    });

    return methods.map((method) => ({
      method: method.method,
      count: method._count.method,
    }));
  }

  async getPaymentStatistics(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        processedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
    });

    const refunds = await this.prisma.refund.findMany({
      where: {
        refundDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'APPROVED',
      },
    });

    const totalPayments = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const totalRefunds = refunds.reduce(
      (sum, refund) => sum + Number(refund.amount),
      0,
    );

    // Group by payment method
    const paymentMethodBreakdown = payments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + Number(payment.amount);
      return acc;
    }, {});

    return {
      period: { startDate, endDate },
      summary: {
        totalPayments,
        totalRefunds,
        netRevenue: totalPayments - totalRefunds,
        paymentCount: payments.length,
        refundCount: refunds.length,
      },
      breakdown: {
        byPaymentMethod: paymentMethodBreakdown,
      },
    };
  }

  async getPatientPaymentHistory(patientId: string) {
    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const payments = await this.prisma.payment.findMany({
      where: { patientId },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
          },
        },
      },
      orderBy: { processedAt: 'desc' },
    });

    const refunds = await this.prisma.refund.findMany({
      where: { patientId },
      include: {
        payment: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
              },
            },
          },
        },
      },
      orderBy: { refundDate: 'desc' },
    });

    const totalPaid = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const totalRefunded = refunds.reduce(
      (sum, refund) => sum + Number(refund.amount),
      0,
    );
    const netPaid = totalPaid - totalRefunded;

    return {
      payments,
      refunds,
      summary: {
        totalPayments: payments.length,
        totalRefunds: refunds.length,
        totalPaid,
        totalRefunded,
        netPaid,
      },
    };
  }

  async getInvoicePaymentStatus(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        charges: {
          include: {
            service: true,
          },
        },
        payments: {
          where: { status: { in: ['COMPLETED', 'REFUNDED'] } },
        },
        refunds: {
          where: { status: 'APPROVED' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const totalAmount = invoice.charges.reduce(
      (sum, charge) => sum + Number(charge.totalPrice),
      0,
    );
    const totalPaid = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const totalRefunded = invoice.refunds.reduce(
      (sum, refund) => sum + Number(refund.amount),
      0,
    );
    const netPaid = totalPaid - totalRefunded;
    const remainingBalance = totalAmount - netPaid;

    return {
      invoice,
      paymentStatus: {
        totalAmount,
        totalPaid,
        totalRefunded,
        netPaid,
        remainingBalance,
        isFullyPaid: remainingBalance <= 0,
        paymentPercentage: totalAmount > 0 ? (netPaid / totalAmount) * 100 : 0,
      },
    };
  }

  async getDailyPaymentSummary(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const payments = await this.prisma.payment.findMany({
      where: {
        processedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
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

    const refunds = await this.prisma.refund.findMany({
      where: {
        refundDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'APPROVED',
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientId: true,
          },
        },
      },
    });

    const totalPayments = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const totalRefunds = refunds.reduce(
      (sum, refund) => sum + Number(refund.amount),
      0,
    );
    const netRevenue = totalPayments - totalRefunds;

    return {
      date,
      summary: {
        totalPayments: payments.length,
        totalRefunds: refunds.length,
        totalPaymentsAmount: totalPayments,
        totalRefundsAmount: totalRefunds,
        netRevenue,
      },
      payments,
      refunds,
    };
  }

  private async getTotalPaidForInvoice(invoiceId: string): Promise<number> {
    const payments = await this.prisma.payment.findMany({
      where: { invoiceId, status: 'COMPLETED' },
    });
    return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  }

  private async getTotalRefundedForInvoice(invoiceId: string): Promise<number> {
    const refunds = await this.prisma.refund.findMany({
      where: { invoiceId, status: 'APPROVED' },
    });
    return refunds.reduce((sum, refund) => sum + Number(refund.amount), 0);
  }

  private async updatePatientAccountBalance(patientId: string, amount: number) {
    const patientAccount = await this.prisma.patientAccount.findUnique({
      where: { patientId },
    });

    if (patientAccount) {
      await this.prisma.patientAccount.update({
        where: { patientId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });
    } else {
      // Generate unique account number
      const accountNumber = `ACC${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      await this.prisma.patientAccount.create({
        data: {
          patientId,
          accountNumber,
          balance: -amount, // Initial balance is negative for payments
        },
      });
    }
  }

  // Enhanced Payment Verification and Integration Methods
  async verifyPaymentBeforeService(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        charges: {
          include: {
            service: true,
          },
        },
        payments: {
          where: { status: 'COMPLETED' },
        },
        refunds: {
          where: { status: 'APPROVED' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const totalAmount = invoice.charges.reduce(
      (sum, charge) => sum + Number(charge.totalPrice),
      0,
    );
    const totalPaid = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const totalRefunded = invoice.refunds.reduce(
      (sum, refund) => sum + Number(refund.amount),
      0,
    );
    const netPaid = totalPaid - totalRefunded;
    const remainingBalance = totalAmount - netPaid;

    return {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount,
        status: invoice.status,
      },
      paymentStatus: {
        totalPaid,
        totalRefunded,
        netPaid,
        remainingBalance,
        isFullyPaid: remainingBalance <= 0,
        paymentPercentage: totalAmount > 0 ? (netPaid / totalAmount) * 100 : 0,
      },
      canProceed: remainingBalance <= 0,
      message:
        remainingBalance <= 0
          ? 'Payment verified. Service can proceed.'
          : `Payment required. Outstanding balance: $${remainingBalance}`,
    };
  }

  async getPaymentMethodsBreakdown(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        processedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
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

    // Group by payment method
    const methodBreakdown = payments.reduce((acc, payment) => {
      const method = payment.method;
      if (!acc[method]) {
        acc[method] = {
          method,
          count: 0,
          totalAmount: 0,
          averageAmount: 0,
          payments: [],
        };
      }
      acc[method].count++;
      acc[method].totalAmount += Number(payment.amount);
      acc[method].payments.push({
        id: payment.id,
        amount: Number(payment.amount),
        patientName: `${payment.patient.firstName} ${payment.patient.lastName}`,
        patientId: payment.patient.patientId,
        invoiceNumber: payment.invoice.invoiceNumber,
        processedAt: payment.processedAt,
        reference: payment.reference,
      });
      return acc;
    }, {});

    // Calculate averages
    Object.values(methodBreakdown).forEach((method: any) => {
      method.averageAmount =
        method.count > 0 ? method.totalAmount / method.count : 0;
    });

    const totalPayments = payments.length;
    const totalAmount = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    return {
      period: { startDate, endDate },
      summary: {
        totalPayments,
        totalAmount,
        averagePayment: totalPayments > 0 ? totalAmount / totalPayments : 0,
      },
      methodBreakdown: Object.values(methodBreakdown),
    };
  }

  async getPaymentReconciliationReport(startDate: Date, endDate: Date) {
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all payments in the period
    const payments = await this.prisma.payment.findMany({
      where: {
        processedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
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
            totalAmount: true,
            status: true,
          },
        },
      },
      orderBy: { processedAt: 'asc' },
    });

    // Get all refunds in the period
    const refunds = await this.prisma.refund.findMany({
      where: {
        refundDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientId: true,
          },
        },
        payment: {
          include: {
            invoice: {
              select: {
                invoiceNumber: true,
              },
            },
          },
        },
      },
      orderBy: { refundDate: 'asc' },
    });

    // Calculate daily breakdown
    const dailyBreakdown = {};
    const daysInPeriod = Math.ceil(
      (endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24),
    );

    for (let i = 0; i < daysInPeriod; i++) {
      const date = new Date(startOfDay);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];

      dailyBreakdown[dateKey] = {
        date: dateKey,
        payments: 0,
        paymentAmount: 0,
        refunds: 0,
        refundAmount: 0,
        netAmount: 0,
      };
    }

    // Populate daily breakdown
    payments.forEach((payment) => {
      const dateKey = payment.processedAt.toISOString().split('T')[0];
      if (dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey].payments++;
        dailyBreakdown[dateKey].paymentAmount += Number(payment.amount);
        dailyBreakdown[dateKey].netAmount += Number(payment.amount);
      }
    });

    refunds.forEach((refund) => {
      const dateKey = refund.refundDate.toISOString().split('T')[0];
      if (dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey].refunds++;
        dailyBreakdown[dateKey].refundAmount += Number(refund.amount);
        dailyBreakdown[dateKey].netAmount -= Number(refund.amount);
      }
    });

    const totalPayments = payments.length;
    const totalPaymentAmount = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const totalRefunds = refunds.length;
    const totalRefundAmount = refunds.reduce(
      (sum, refund) => sum + Number(refund.amount),
      0,
    );
    const netRevenue = totalPaymentAmount - totalRefundAmount;

    return {
      period: { startDate: startOfDay, endDate: endOfDay },
      summary: {
        totalPayments,
        totalPaymentAmount,
        totalRefunds,
        totalRefundAmount,
        netRevenue,
        averageDailyRevenue: daysInPeriod > 0 ? netRevenue / daysInPeriod : 0,
      },
      dailyBreakdown: Object.values(dailyBreakdown),
      payments: payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.method,
        patientName: `${payment.patient.firstName} ${payment.patient.lastName}`,
        patientId: payment.patient.patientId,
        invoiceNumber: payment.invoice.invoiceNumber,
        processedAt: payment.processedAt,
        reference: payment.reference,
      })),
      refunds: refunds.map((refund) => ({
        id: refund.id,
        amount: Number(refund.amount),
        reason: refund.reason,
        patientName: `${refund.patient.firstName} ${refund.patient.lastName}`,
        patientId: refund.patient.patientId,
        originalInvoiceNumber: refund.payment.invoice.invoiceNumber,
        refundDate: refund.refundDate,
        status: refund.status,
      })),
    };
  }

  async getPaymentAnalytics(startDate: Date, endDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        processedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      include: {
        invoice: {
          include: {
            charges: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    // Group by service category
    const serviceBreakdown = payments.reduce((acc, payment) => {
      payment.invoice.charges.forEach((charge) => {
        const serviceName = charge.service?.name || 'Unknown Service';
        if (!acc[serviceName]) {
          acc[serviceName] = {
            serviceName,
            count: 0,
            totalAmount: 0,
            averageAmount: 0,
          };
        }
        acc[serviceName].count++;
        acc[serviceName].totalAmount += Number(charge.totalPrice);
      });
      return acc;
    }, {});

    // Calculate averages
    Object.values(serviceBreakdown).forEach((service: any) => {
      service.averageAmount =
        service.count > 0 ? service.totalAmount / service.count : 0;
    });

    // Payment method analysis
    const methodAnalysis = payments.reduce((acc, payment) => {
      const method = payment.method;
      if (!acc[method]) {
        acc[method] = {
          method,
          count: 0,
          totalAmount: 0,
          averageAmount: 0,
        };
      }
      acc[method].count++;
      acc[method].totalAmount += Number(payment.amount);
      return acc;
    }, {});

    Object.values(methodAnalysis).forEach((method: any) => {
      method.averageAmount =
        method.count > 0 ? method.totalAmount / method.count : 0;
    });

    // Time-based analysis (hourly distribution)
    const hourlyDistribution = new Array(24).fill(0).map((_, hour) => ({
      hour,
      count: 0,
      amount: 0,
    }));

    payments.forEach((payment) => {
      const hour = payment.processedAt.getHours();
      hourlyDistribution[hour].count++;
      hourlyDistribution[hour].amount += Number(payment.amount);
    });

    const totalPayments = payments.length;
    const totalAmount = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    return {
      period: { startDate, endDate },
      summary: {
        totalPayments,
        totalAmount,
        averagePayment: totalPayments > 0 ? totalAmount / totalPayments : 0,
      },
      serviceBreakdown: Object.values(serviceBreakdown).sort(
        (a: any, b: any) => b.totalAmount - a.totalAmount,
      ),
      methodAnalysis: Object.values(methodAnalysis).sort(
        (a: any, b: any) => b.totalAmount - a.totalAmount,
      ),
      hourlyDistribution,
    };
  }
}
