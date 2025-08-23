import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import * as puppeteer from 'puppeteer';

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

    // Determine payment status based on payment method
    // Cash payments are immediately completed, others start as pending
    const paymentStatus = paymentMethod === 'CASH' ? 'COMPLETED' : 'PENDING';

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        patientId,
        amount,
        method: paymentMethod,
        reference: referenceNumber,
        notes,
        status: paymentStatus, // Set status based on payment method
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

    console.log(
      '🔍 [PaymentsService.createRefund] Starting refund creation for payment:',
      paymentId,
    );

    // Check if payment exists
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    console.log(
      '🔍 [PaymentsService.createRefund] Payment found with status:',
      payment.status,
    );

    // Check if payment can be refunded
    if (
      payment.status !== 'COMPLETED' &&
      payment.status !== 'REFUND_REQUESTED'
    ) {
      throw new ConflictException(
        'Can only refund completed payments or payments with pending refunds',
      );
    }

    // Check if refund amount is valid
    if (Number(amount) > Number(payment.amount)) {
      throw new ConflictException('Refund amount cannot exceed payment amount');
    }

    console.log('🔍 [PaymentsService.createRefund] Creating refund record...');

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

    console.log(
      '🔍 [PaymentsService.createRefund] Refund created with ID:',
      refund.id,
    );

    console.log(
      '🔍 [PaymentsService.createRefund] Updating payment status to REFUND_REQUESTED...',
    );

    // Update payment status to REFUND_REQUESTED
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUND_REQUESTED' },
    });

    console.log(
      '🔍 [PaymentsService.createRefund] Payment status updated to REFUND_REQUESTED',
    );

    // Verify the update
    const updatedPayment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    console.log(
      '🔍 [PaymentsService.createRefund] Payment status after update:',
      updatedPayment?.status,
    );

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

    // Update payment status to REFUNDED
    await this.prisma.payment.update({
      where: { id: refund.paymentId },
      data: { status: 'REFUNDED' },
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

    // Update invoice status
    await this.updateInvoiceStatusAfterRefund(refund.payment.invoiceId);

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

    // Update payment status back to COMPLETED
    await this.prisma.payment.update({
      where: { id: refund.paymentId },
      data: { status: 'COMPLETED' },
    });

    return rejectedRefund;
  }

  // Helper method to update invoice status after refund operations
  private async updateInvoiceStatusAfterRefund(invoiceId: string) {
    const totalPaid = await this.getTotalPaidForInvoice(invoiceId);
    const totalRefunded = await this.getTotalRefundedForInvoice(invoiceId);
    const netPaid = totalPaid - totalRefunded;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
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
        where: { id: invoiceId },
        data: {
          status: newStatus,
          paidAmount: netPaid,
          balance: totalAmount - netPaid,
        },
      });
    }
  }

  async findRefundById(refundId: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
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

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    return refund;
  }

  async findAllRefunds(params: {
    patientId?: string;
    invoiceId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      patientId,
      invoiceId,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.refundDate = {};
      if (startDate) {
        where.refundDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.refundDate.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        {
          patient: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { patientId: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await this.prisma.refund.count({ where });

    // Get refunds with pagination
    const refunds = await this.prisma.refund.findMany({
      where,
      include: {
        payment: {
          include: {
            invoice: true,
            patient: true,
          },
        },
        patient: true,
      },
      orderBy: { refundDate: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: refunds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  // PDF Generation Methods
  async generatePaymentReceiptPDF(paymentId: string): Promise<Buffer> {
    const payment = await this.findPaymentById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Generate HTML content for the payment receipt
    const htmlContent = this.generatePaymentReceiptHTML(payment);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  async generateRefundReceiptPDF(refundId: string): Promise<Buffer> {
    const refund = await this.findRefundById(refundId);

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    // Only generate receipt for approved refunds
    if (refund.status !== 'APPROVED') {
      throw new BadRequestException(
        `Cannot generate receipt for refund with status: ${refund.status}. Only approved refunds can generate receipts.`,
      );
    }

    // Generate HTML content for the refund receipt
    const htmlContent = this.generateRefundReceiptHTML(refund);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private generatePaymentReceiptHTML(payment: any): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - ${payment.reference}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: white;
            }
            
            .receipt-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            .header .subtitle {
                color: #666;
                font-size: 14px;
            }
            
            .receipt-title {
                text-align: center;
                margin: 30px 0;
            }
            
            .receipt-title h2 {
                font-size: 24px;
                margin-bottom: 5px;
            }
            
            .receipt-title .reference {
                color: #666;
                font-size: 16px;
            }
            
            .info-section {
                margin-bottom: 25px;
            }
            
            .info-section h3 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #2c3e50;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 20px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .info-row .label {
                color: #666;
                font-weight: normal;
            }
            
            .info-row .value {
                font-weight: 600;
                text-align: right;
            }
            
            .payment-summary {
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                background-color: #f8f9fa;
            }
            
            .payment-summary h3 {
                text-align: center;
                margin-bottom: 20px;
                color: #2c3e50;
            }
            
            .amount-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            
            .amount-row.total {
                font-size: 18px;
                font-weight: bold;
                border-top: 1px solid #ddd;
                padding-top: 15px;
                margin-top: 15px;
            }
            
            .amount-row.total .value {
                color: #27ae60;
            }
            
            .notes {
                margin: 25px 0;
            }
            
            .notes-content {
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                padding: 15px;
                background-color: #f9f9f9;
                font-style: italic;
            }
            
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            
            .footer .thank-you {
                font-size: 16px;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            .divider {
                border: none;
                height: 1px;
                background-color: #ddd;
                margin: 20px 0;
            }
            
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                }
                
                .receipt-container {
                    margin: 0;
                    padding: 15px;
                }
                
                .info-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }
            
            @page {
                margin: 0.5in;
                size: auto;
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="header">
                <h1>HealthCare Medical Center</h1>
                <div class="subtitle">123 Medical Drive, Health City, HC 12345</div>
                <div class="subtitle">Phone: +1 (555) 123-4567 | Email: billing@healthcare.com</div>
            </div>
            
            <div class="receipt-title">
                <h2>PAYMENT RECEIPT</h2>
                <div class="reference">Receipt #${payment.reference}</div>
            </div>
            
            <div class="info-grid">
                <div class="info-section">
                    <h3>Payment Details</h3>
                    <div class="info-row">
                        <span class="label">Payment ID:</span>
                        <span class="value">${payment.id?.slice(-12) || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Reference:</span>
                        <span class="value">${payment.reference}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Payment Method:</span>
                        <span class="value">${payment.method}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Status:</span>
                        <span class="value">${payment.status}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Date Processed:</span>
                        <span class="value">${payment.processedAt ? formatDate(payment.processedAt) : 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Processed By:</span>
                        <span class="value">${payment.processedBy || 'System'}</span>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3>Patient Information</h3>
                    <div class="info-row">
                        <span class="label">Patient Name:</span>
                        <span class="value">${payment.patient?.firstName || ''} ${payment.patient?.lastName || ''}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Patient ID:</span>
                        <span class="value">${payment.patient?.patientId || 'N/A'}</span>
                    </div>
                    ${
                      payment.patient?.phoneNumber
                        ? `
                    <div class="info-row">
                        <span class="label">Phone:</span>
                        <span class="value">${payment.patient.phoneNumber}</span>
                    </div>
                    `
                        : ''
                    }
                    ${
                      payment.patient?.email
                        ? `
                    <div class="info-row">
                        <span class="label">Email:</span>
                        <span class="value">${payment.patient.email}</span>
                    </div>
                    `
                        : ''
                    }
                </div>
            </div>
            
            ${
              payment.invoice
                ? `
            <hr class="divider">
            
            <div class="info-section">
                <h3>Invoice Information</h3>
                <div class="info-grid">
                    <div>
                        <div class="info-row">
                            <span class="label">Invoice Number:</span>
                            <span class="value">${payment.invoice.invoiceNumber || payment.invoice.number || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Invoice Total:</span>
                            <span class="value">${payment.invoice.totalAmount ? formatCurrency(payment.invoice.totalAmount) : 'N/A'}</span>
                        </div>
                    </div>
                    <div>
                        <div class="info-row">
                            <span class="label">Due Date:</span>
                            <span class="value">${payment.invoice.dueDate ? formatDate(payment.invoice.dueDate) : 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Remaining Balance:</span>
                            <span class="value">${payment.invoice.balance ? formatCurrency(payment.invoice.balance) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
            `
                : ''
            }
            
            <div class="payment-summary">
                <h3>Payment Summary</h3>
                <div class="amount-row">
                    <span>Payment Amount:</span>
                    <span class="value">${formatCurrency(payment.amount)}</span>
                </div>
                ${
                  payment.fee && payment.fee > 0
                    ? `
                <div class="amount-row">
                    <span>Processing Fee:</span>
                    <span class="value">${formatCurrency(payment.fee)}</span>
                </div>
                `
                    : ''
                }
                <div class="amount-row total">
                    <span>Total Paid:</span>
                    <span class="value">${formatCurrency(payment.amount + (payment.fee || 0))}</span>
                </div>
            </div>
            
            ${
              payment.notes
                ? `
            <div class="notes">
                <h3>Notes</h3>
                <div class="notes-content">${payment.notes}</div>
            </div>
            `
                : ''
            }
            
            <div class="footer">
                <div class="thank-you">Thank you for your payment!</div>
                <div>Please keep this receipt for your records.</div>
                <br>
                <div style="font-size: 12px;">
                    Receipt generated on ${formatDate(new Date())} | 
                    This is an automatically generated receipt.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateRefundReceiptHTML(refund: any): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Refund Receipt - ${refund.referenceNumber || refund.id}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: white;
            }
            
            .receipt-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            .header .subtitle {
                color: #666;
                font-size: 14px;
            }
            
            .receipt-title {
                text-align: center;
                margin: 30px 0;
            }
            
            .receipt-title h2 {
                font-size: 24px;
                margin-bottom: 5px;
            }
            
            .receipt-title .reference {
                color: #666;
                font-size: 16px;
            }
            
            .info-section {
                margin-bottom: 25px;
            }
            
            .info-section h3 {
                font-size: 18px;
                margin-bottom: 15px;
                color: #2c3e50;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 20px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .info-row .label {
                color: #666;
                font-weight: normal;
                color: #666;
            }
            
            .info-row .value {
                font-weight: 600;
                text-align: right;
            }
            
            .refund-summary {
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                background-color: #f8f9fa;
            }
            
            .refund-summary h3 {
                text-align: center;
                margin-bottom: 20px;
                color: #2c3e50;
            }
            
            .amount-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            
            .amount-row.total {
                font-size: 18px;
                font-weight: bold;
                border-top: 1px solid #ddd;
                padding-top: 15px;
                margin-top: 15px;
            }
            
            .amount-row.total .value {
                color: #e74c3c;
            }
            
            .notes {
                margin: 25px 0;
            }
            
            .notes-content {
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                padding: 15px;
                background-color: #f9f9f9;
                font-style: italic;
            }
            
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            
            .footer .thank-you {
                font-size: 16px;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            .divider {
                border: none;
                height: 1px;
                background-color: #ddd;
                margin: 20px 0;
            }
            
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                }
                
                .receipt-container {
                    margin: 0;
                    padding: 15px;
                }
                
                .info-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }
            
            @page {
                margin: 0.5in;
                size: auto;
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="header">
                <h1>HealthCare Medical Center</h1>
                <div class="subtitle">123 Medical Drive, Health City, HC 12345</div>
                <div class="subtitle">Phone: +1 (555) 123-4567 | Email: billing@healthcare.com</div>
            </div>
            
            <div class="receipt-title">
                <h2>REFUND RECEIPT</h2>
                <div class="reference">Refund #${refund.referenceNumber || refund.id}</div>
            </div>
            
            <div class="info-grid">
                <div class="info-section">
                    <h3>Refund Details</h3>
                    <div class="info-row">
                        <span class="label">Refund ID:</span>
                        <span class="value">${refund.id?.slice(-12) || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Reference:</span>
                        <span class="value">${refund.referenceNumber || refund.id}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Status:</span>
                        <span class="value">${refund.status}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Date Processed:</span>
                        <span class="value">${refund.processedAt ? formatDate(refund.processedAt) : 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Processed By:</span>
                        <span class="value">${refund.processedBy || 'System'}</span>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3>Patient Information</h3>
                    <div class="info-row">
                        <span class="label">Patient Name:</span>
                        <span class="value">${refund.patient?.firstName || ''} ${refund.patient?.lastName || ''}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Patient ID:</span>
                        <span class="value">${refund.patient?.patientId || 'N/A'}</span>
                    </div>
                    ${
                      refund.patient?.phoneNumber
                        ? `
                    <div class="info-row">
                        <span class="label">Phone:</span>
                        <span class="value">${refund.patient.phoneNumber}</span>
                    </div>
                    `
                        : ''
                    }
                    ${
                      refund.patient?.email
                        ? `
                    <div class="info-row">
                        <span class="label">Email:</span>
                        <span class="value">${refund.patient.email}</span>
                    </div>
                    `
                        : ''
                    }
                </div>
            </div>
            
            <hr class="divider">
            
            <div class="info-section">
                <h3>Original Payment Information</h3>
                <div class="info-grid">
                    <div>
                        <div class="info-row">
                            <span class="label">Payment Reference:</span>
                            <span class="value">${refund.payment?.reference || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Payment Amount:</span>
                            <span class="value">${refund.payment?.amount ? formatCurrency(refund.payment.amount) : 'N/A'}</span>
                        </div>
                    </div>
                    <div>
                        <div class="info-row">
                            <span class="label">Payment Method:</span>
                            <span class="value">${refund.payment?.method || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Payment Date:</span>
                            <span class="value">${refund.payment?.processedAt ? formatDate(refund.payment.processedAt) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="refund-summary">
                <h3>Refund Summary</h3>
                <div class="amount-row">
                    <span>Refund Amount:</span>
                    <span class="value">-${formatCurrency(refund.amount)}</span>
                </div>
                <div class="amount-row total">
                    <span>Total Refunded:</span>
                    <span class="value">-${formatCurrency(refund.amount)}</span>
                </div>
            </div>
            
            ${
              refund.reason
                ? `
            <div class="notes">
                <h3>Refund Reason</h3>
                <div class="notes-content">${refund.reason}</div>
            </div>
            `
                : ''
            }
            
            ${
              refund.notes
                ? `
            <div class="notes">
                <h3>Notes</h3>
                <div class="notes-content">${refund.notes}</div>
            </div>
            `
                : ''
            }
            
            <div class="footer">
                <div class="thank-you">Refund processed successfully!</div>
                <div>Please keep this receipt for your records.</div>
                <br>
                <div style="font-size: 12px;">
                    Refund receipt generated on ${formatDate(new Date())} | 
                    This is an automatically generated receipt.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}
