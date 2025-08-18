import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto';
import { CreatePettyCashDto } from './dto/create-petty-cash.dto';

@Injectable()
export class CashOfficeService {
  constructor(private prisma: PrismaService) {}

  // Cash Transaction Management
  async createCashTransaction(
    createCashTransactionDto: CreateCashTransactionDto,
  ) {
    const { cashierId, ...transactionData } = createCashTransactionDto;

    // Check if cashier exists and is authorized
    const cashier = await this.prisma.staffMember.findUnique({
      where: { id: cashierId },
      include: { user: true },
    });

    if (
      !cashier ||
      !['CASHIER', 'ADMIN', 'MANAGER'].includes(cashier.user.role)
    ) {
      throw new NotFoundException(
        'Cashier not found or not authorized for cash transactions',
      );
    }

    // Create cash transaction
    const transaction = await this.prisma.cashTransaction.create({
      data: {
        ...transactionData,
        cashierId,
        transactionDate: new Date(),
        status: 'COMPLETED',
      },
      include: {
        cashier: {
          include: {
            user: {
              select: {
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
    });

    return transaction;
  }

  async findAllCashTransactions(query?: {
    cashierId?: string;
    patientId?: string;
    transactionType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    const where: any = {};

    if (query?.cashierId) {
      where.cashierId = query.cashierId;
    }

    if (query?.patientId) {
      where.patientId = query.patientId;
    }

    if (query?.transactionType) {
      where.transactionType = query.transactionType;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.startDate || query?.endDate) {
      where.transactionDate = {};
      if (query.startDate) where.transactionDate.gte = query.startDate;
      if (query.endDate) where.transactionDate.lte = query.endDate;
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
        {
          cashier: {
            user: {
              firstName: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
        {
          cashier: {
            user: { lastName: { contains: query.search, mode: 'insensitive' } },
          },
        },
      ];
    }

    return this.prisma.cashTransaction.findMany({
      where,
      include: {
        cashier: {
          include: {
            user: {
              select: {
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
      orderBy: { transactionDate: 'desc' },
    });
  }

  async findCashTransactionById(id: string) {
    const transaction = await this.prisma.cashTransaction.findUnique({
      where: { id },
      include: {
        cashier: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
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
    });

    if (!transaction) {
      throw new NotFoundException('Cash transaction not found');
    }

    return transaction;
  }

  async updateCashTransaction(
    id: string,
    updateCashTransactionDto: UpdateCashTransactionDto,
  ) {
    await this.findCashTransactionById(id);

    const transaction = await this.prisma.cashTransaction.update({
      where: { id },
      data: updateCashTransactionDto,
      include: {
        cashier: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        patient: true,
      },
    });

    return transaction;
  }

  // Petty Cash Management
  async createPettyCashRequest(createPettyCashDto: CreatePettyCashDto) {
    const { requesterId, ...pettyCashData } = createPettyCashDto;

    // Check if requester exists and is authorized
    const requester = await this.prisma.staffMember.findUnique({
      where: { id: requesterId },
      include: { user: true },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    // Create petty cash request
    const pettyCash = await this.prisma.pettyCash.create({
      data: {
        ...pettyCashData,
        requesterId,
        requestDate: new Date(),
        status: 'PENDING',
      },
      include: {
        requester: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        approver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return pettyCash;
  }

  async approvePettyCashRequest(pettyCashId: string, approverId: string) {
    const pettyCash = await this.prisma.pettyCash.findUnique({
      where: { id: pettyCashId },
      include: {
        requester: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!pettyCash) {
      throw new NotFoundException('Petty cash request not found');
    }

    if (pettyCash.status !== 'PENDING') {
      throw new ConflictException(
        'Petty cash request is not in pending status',
      );
    }

    // Check if approver exists and is authorized
    const approver = await this.prisma.staffMember.findUnique({
      where: { id: approverId },
      include: { user: true },
    });

    if (
      !approver ||
      !['ADMIN', 'MANAGER', 'FINANCE_MANAGER'].includes(approver.user.role)
    ) {
      throw new NotFoundException('Approver not found or not authorized');
    }

    // Approve petty cash request
    const approvedPettyCash = await this.prisma.pettyCash.update({
      where: { id: pettyCashId },
      data: {
        status: 'APPROVED',
        approverId,
        approvedAt: new Date(),
      },
      include: {
        requester: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        approver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return approvedPettyCash;
  }

  async rejectPettyCashRequest(
    pettyCashId: string,
    approverId: string,
    rejectionReason: string,
  ) {
    const pettyCash = await this.prisma.pettyCash.findUnique({
      where: { id: pettyCashId },
    });

    if (!pettyCash) {
      throw new NotFoundException('Petty cash request not found');
    }

    if (pettyCash.status !== 'PENDING') {
      throw new ConflictException(
        'Petty cash request is not in pending status',
      );
    }

    // Check if approver exists and is authorized
    const approver = await this.prisma.staffMember.findUnique({
      where: { id: approverId },
      include: { user: true },
    });

    if (
      !approver ||
      !['ADMIN', 'MANAGER', 'FINANCE_MANAGER'].includes(approver.user.role)
    ) {
      throw new NotFoundException('Approver not found or not authorized');
    }

    // Reject petty cash request
    const rejectedPettyCash = await this.prisma.pettyCash.update({
      where: { id: pettyCashId },
      data: {
        status: 'REJECTED',
        approverId,
        rejectedAt: new Date(),
        rejectionReason,
      },
      include: {
        requester: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        approver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return rejectedPettyCash;
  }

  // Daily Cash Reconciliation
  async getDailyCashReconciliation(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.prisma.cashTransaction.findMany({
      where: {
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      include: {
        cashier: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        patient: true,
      },
    });

    const cashInTransactions = transactions.filter(
      (t) => t.transactionType === 'CASH_IN',
    );
    const cashOutTransactions = transactions.filter(
      (t) => t.transactionType === 'CASH_OUT',
    );

    const totalCashIn = cashInTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const totalCashOut = cashOutTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const netCash =
      cashInTransactions.reduce((sum, t) => sum + Number(t.amount), 0) -
      cashOutTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      date,
      summary: {
        totalCashIn,
        totalCashOut,
        netCash,
        transactionCount: transactions.length,
      },
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.transactionType,
        amount: Number(transaction.amount),
        description: transaction.description,
        cashierName: `${transaction.cashier.user.firstName} ${transaction.cashier.user.lastName}`,
        patientName: transaction.patient
          ? `${transaction.patient.firstName} ${transaction.patient.lastName}`
          : 'N/A',
        timestamp: transaction.transactionDate,
      })),
    };
  }

  // Cash Office Reports
  async getCashOfficeStatistics(startDate: Date, endDate: Date) {
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const cashTransactions = await this.prisma.cashTransaction.findMany({
      where: {
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      include: {
        cashier: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        patient: true,
      },
    });

    const pettyCashRequests = await this.prisma.pettyCash.findMany({
      where: {
        requestDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        requester: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        approver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const totalCashIn = cashTransactions
      .filter((t) => t.transactionType === 'CASH_IN')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalCashOut = cashTransactions
      .filter((t) => t.transactionType === 'CASH_OUT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPettyCash = pettyCashRequests
      .filter((t) => t.status === 'APPROVED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pendingPettyCash = pettyCashRequests
      .filter((t) => t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netCashFlow = totalCashIn - totalCashOut - totalPettyCash;

    // Group by cashier
    const cashierBreakdown = cashTransactions.reduce((acc, transaction) => {
      const cashierName = `${transaction.cashier.user.firstName} ${transaction.cashier.user.lastName}`;

      if (!acc[cashierName]) {
        acc[cashierName] = {
          cashierId: transaction.cashierId,
          cashierName,
          cashIn: 0,
          cashOut: 0,
          transactionCount: 0,
        };
      }

      if (transaction.transactionType === 'CASH_IN') {
        acc[cashierName].cashIn += Number(transaction.amount);
      } else {
        acc[cashierName].cashOut += Number(transaction.amount);
      }
      acc[cashierName].transactionCount++;
      return acc;
    }, {});

    return {
      period: { startDate, endDate },
      summary: {
        totalCashIn,
        totalCashOut,
        totalPettyCash,
        pendingPettyCash,
        netCashFlow,
        transactionCount: cashTransactions.length,
        pettyCashCount: pettyCashRequests.length,
      },
      breakdown: {
        byCashier: Object.values(cashierBreakdown),
      },
    };
  }

  async getCashierShiftReport(cashierId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.prisma.cashTransaction.findMany({
      where: {
        cashierId,
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      include: {
        cashier: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        patient: true,
      },
    });

    const cashInTransactions = transactions.filter(
      (t) => t.transactionType === 'CASH_IN',
    );
    const cashOutTransactions = transactions.filter(
      (t) => t.transactionType === 'CASH_OUT',
    );

    const totalCashIn = cashInTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const totalCashOut = cashOutTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const netCashFlow = totalCashIn - totalCashOut;

    return {
      cashierId,
      date,
      summary: {
        totalCashIn,
        totalCashOut,
        netCashFlow,
        transactionCount: transactions.length,
        cashInCount: cashInTransactions.length,
        cashOutCount: cashOutTransactions.length,
      },
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.transactionType,
        amount: Number(transaction.amount),
        description: transaction.description,
        patientName: transaction.patient
          ? `${transaction.patient.firstName} ${transaction.patient.lastName}`
          : 'N/A',
        timestamp: transaction.transactionDate,
      })),
    };
  }

  async getPendingPettyCashRequests() {
    return this.prisma.pettyCash.findMany({
      where: { status: 'PENDING' },
      include: {
        requester: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { requestDate: 'asc' },
    });
  }

  async getPettyCashHistory(query?: {
    requesterId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (query?.requesterId) {
      where.requesterId = query.requesterId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.startDate || query?.endDate) {
      where.requestDate = {};
      if (query.startDate) where.requestDate.gte = query.startDate;
      if (query.endDate) where.requestDate.lte = query.endDate;
    }

    return this.prisma.pettyCash.findMany({
      where,
      include: {
        requester: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        approver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { requestDate: 'desc' },
    });
  }

  // Payment Processing Integration with Unified Billing System
  async processInvoicePayment(
    invoiceId: string,
    paymentData: {
      amount: number;
      cashierId: string;
      paymentMethod: string;
      reference?: string;
      notes?: string;
    },
  ) {
    // Check if invoice exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: true,
        charges: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new ConflictException('Invoice is already fully paid');
    }

    if (invoice.status === 'CANCELLED') {
      throw new ConflictException(
        'Cannot process payment for cancelled invoice',
      );
    }

    // Validate payment amount
    const remainingBalance = Number(invoice.balance);
    if (paymentData.amount > remainingBalance) {
      throw new BadRequestException(
        `Payment amount ($${paymentData.amount}) exceeds remaining balance ($${remainingBalance})`,
      );
    }

    // Check if cashier exists and is authorized
    const cashier = await this.prisma.staffMember.findUnique({
      where: { id: paymentData.cashierId },
      include: { user: true },
    });

    if (
      !cashier ||
      !['CASHIER', 'ADMIN', 'MANAGER'].includes(cashier.user.role)
    ) {
      throw new NotFoundException(
        'Cashier not found or not authorized for payment processing',
      );
    }

    // Create payment record in the unified billing system
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        patientId: invoice.patientId,
        amount: paymentData.amount,
        method: paymentData.paymentMethod as any, // Cast to PaymentMethod enum
        reference: paymentData.reference,
        processedBy: paymentData.cashierId,
        notes: paymentData.notes,
        status: 'COMPLETED',
      },
    });

    // Update invoice payment status
    const newPaidAmount = Number(invoice.paidAmount) + paymentData.amount;
    const newBalance = remainingBalance - paymentData.amount;
    const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
        paidDate: newStatus === 'PAID' ? new Date() : null,
      },
    });

    // Create cash transaction record for audit trail
    const cashTransaction = await this.prisma.cashTransaction.create({
      data: {
        cashierId: paymentData.cashierId,
        patientId: invoice.patientId,
        transactionType: 'CASH_IN',
        amount: paymentData.amount,
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        referenceNumber: paymentData.reference,
        notes: `Payment processed via unified billing system. Payment ID: ${payment.id}`,
        status: 'COMPLETED',
      },
    });

    return {
      payment,
      updatedInvoice,
      cashTransaction,
      message: `Payment processed successfully. New balance: $${newBalance}`,
    };
  }

  // Get payment status for service verification
  async getPaymentStatusForService(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: true,
        payments: {
          orderBy: { processedAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      return {
        canProceed: true,
        message: 'Invoice fully paid. Service can proceed.',
        paymentStatus: 'PAID',
        balance: 0,
        totalPaid: Number(invoice.paidAmount),
      };
    }

    if (invoice.status === 'PARTIAL') {
      return {
        canProceed: false,
        message: `Partial payment received. Outstanding balance: $${Number(invoice.balance)}. Full payment required before service.`,
        paymentStatus: 'PARTIAL',
        balance: Number(invoice.balance),
        totalPaid: Number(invoice.paidAmount),
      };
    }

    if (invoice.status === 'PENDING') {
      return {
        canProceed: false,
        message: `Payment required before service. Total amount due: $${Number(invoice.totalAmount)}`,
        paymentStatus: 'PENDING',
        balance: Number(invoice.totalAmount),
        totalPaid: 0,
      };
    }

    return {
      canProceed: false,
      message: `Invoice status: ${invoice.status}. Payment verification required.`,
      paymentStatus: invoice.status,
      balance: Number(invoice.balance),
      totalPaid: Number(invoice.paidAmount),
    };
  }

  // Get comprehensive payment history for an invoice
  async getInvoicePaymentHistory(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: true,
        charges: true,
        payments: {
          orderBy: { processedAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Get related cash transactions
    const cashTransactions = await this.prisma.cashTransaction.findMany({
      where: {
        patientId: invoice.patientId,
        description: {
          contains: `Invoice ${invoice.invoiceNumber}`,
        },
      },
      include: {
        cashier: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });

    return {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        balance: Number(invoice.balance),
        status: invoice.status,
        issuedDate: invoice.issuedDate,
        dueDate: invoice.dueDate,
      },
      payments: invoice.payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.method,
        reference: payment.reference,
        status: payment.status,
        processedBy: payment.processedBy,
        processedAt: payment.processedAt,
        notes: payment.notes,
      })),
      cashTransactions: cashTransactions.map((transaction) => ({
        id: transaction.id,
        amount: Number(transaction.amount),
        type: transaction.transactionType,
        description: transaction.description,
        referenceNumber: transaction.referenceNumber,
        cashierName: `${transaction.cashier?.user?.firstName} ${transaction.cashier?.user?.lastName}`,
        timestamp: transaction.transactionDate,
        notes: transaction.notes,
      })),
      summary: {
        totalPayments: invoice.payments.length,
        totalAmountPaid: Number(invoice.paidAmount),
        remainingBalance: Number(invoice.balance),
        paymentStatus: invoice.status,
        cashTransactionsCount: cashTransactions.length,
      },
    };
  }

  // Enhanced daily cash reconciliation with invoice payments
  async getEnhancedDailyCashReconciliation(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get cash transactions
    const cashTransactions = await this.prisma.cashTransaction.findMany({
      where: {
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      include: {
        cashier: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        patient: true,
      },
    });

    // Get invoice payments processed on this date
    const invoicePayments = await this.prisma.payment.findMany({
      where: {
        processedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      include: {
        invoice: {
          include: {
            patient: true,
          },
        },
      },
    });

    const cashInTransactions = cashTransactions.filter(
      (t) => t.transactionType === 'CASH_IN',
    );
    const cashOutTransactions = cashTransactions.filter(
      (t) => t.transactionType === 'CASH_OUT',
    );

    const totalCashIn = cashInTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const totalCashOut = cashOutTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const totalInvoicePayments = invoicePayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    const netCash = totalCashIn - totalCashOut;

    return {
      date,
      summary: {
        totalCashIn,
        totalCashOut,
        totalInvoicePayments,
        netCash,
        transactionCount: cashTransactions.length,
        paymentCount: invoicePayments.length,
      },
      cashTransactions: cashTransactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.transactionType,
        amount: Number(transaction.amount),
        description: transaction.description,
        cashierName: `${transaction.cashier.user.firstName} ${transaction.cashier.user.lastName}`,
        patientName: transaction.patient
          ? `${transaction.patient.firstName} ${transaction.patient.lastName}`
          : 'N/A',
        timestamp: transaction.transactionDate,
      })),
      invoicePayments: invoicePayments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.method,
        invoiceNumber: payment.invoice.invoiceNumber,
        patientName: `${payment.invoice.patient.firstName} ${payment.invoice.patient.lastName}`,
        timestamp: payment.processedAt,
        reference: payment.reference,
      })),
    };
  }

  // Get cash office financial summary with invoice integration
  async getCashOfficeFinancialSummary(startDate: Date, endDate: Date) {
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get cash transactions
    const cashTransactions = await this.prisma.cashTransaction.findMany({
      where: {
        transactionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      include: {
        cashier: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        patient: true,
      },
    });

    // Get invoice payments
    const invoicePayments = await this.prisma.payment.findMany({
      where: {
        processedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      include: {
        invoice: {
          include: {
            patient: true,
          },
        },
      },
    });

    // Get petty cash requests
    const pettyCashRequests = await this.prisma.pettyCash.findMany({
      where: {
        requestDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        requester: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        approver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const totalCashIn = cashTransactions
      .filter((t) => t.transactionType === 'CASH_IN')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalCashOut = cashTransactions
      .filter((t) => t.transactionType === 'CASH_OUT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalInvoicePayments = invoicePayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    const totalPettyCash = pettyCashRequests
      .filter((t) => t.status === 'APPROVED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pendingPettyCash = pettyCashRequests
      .filter((t) => t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netCashFlow =
      totalCashIn + totalInvoicePayments - totalCashOut - totalPettyCash;

    // Group by cashier
    const cashierBreakdown = cashTransactions.reduce((acc, transaction) => {
      const cashierName = `${transaction.cashier.user.firstName} ${transaction.cashier.user.lastName}`;

      if (!acc[cashierName]) {
        acc[cashierName] = {
          cashierId: transaction.cashierId,
          cashierName,
          cashIn: 0,
          cashOut: 0,
          transactionCount: 0,
        };
      }

      if (transaction.transactionType === 'CASH_IN') {
        acc[cashierName].cashIn += Number(transaction.amount);
      } else {
        acc[cashierName].cashOut += Number(transaction.amount);
      }
      acc[cashierName].transactionCount++;
      return acc;
    }, {});

    return {
      period: { startDate, endDate },
      summary: {
        totalCashIn,
        totalCashOut,
        totalInvoicePayments,
        totalPettyCash,
        pendingPettyCash,
        netCashFlow,
        transactionCount: cashTransactions.length,
        paymentCount: invoicePayments.length,
        pettyCashCount: pettyCashRequests.length,
      },
      breakdown: {
        byCashier: Object.values(cashierBreakdown),
        byPaymentMethod: this.groupPaymentsByMethod(invoicePayments),
      },
    };
  }

  // Helper method to group payments by method
  private groupPaymentsByMethod(payments: any[]) {
    const methodGroups = {};

    payments.forEach((payment) => {
      const method = payment.method;
      if (!methodGroups[method]) {
        methodGroups[method] = {
          method,
          count: 0,
          totalAmount: 0,
        };
      }
      methodGroups[method].count++;
      methodGroups[method].totalAmount += Number(payment.amount);
    });

    return Object.values(methodGroups);
  }
}
