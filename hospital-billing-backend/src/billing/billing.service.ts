import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaystackService } from '../paystack/paystack.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreateChargeDto,
  UpdateChargeDto,
} from './dto';
import {
  InvoiceResponse,
  ChargeResponse,
  InvoiceSearchResult,
  ChargeSearchResult,
} from './interfaces';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
  ) {}

  // Invoice Management
  async createInvoice(createInvoiceDto: CreateInvoiceDto) {
    const { patientId, charges, ...invoiceData } = createInvoiceDto;

    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { account: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate total amount from charges
    let totalAmount = 0;
    if (charges && charges.length > 0) {
      for (const charge of charges) {
        const service = await this.prisma.service.findUnique({
          where: { id: charge.serviceId },
        });

        if (!service) {
          throw new NotFoundException(
            `Service with ID ${charge.serviceId} not found`,
          );
        }

        totalAmount += Number(service.currentPrice) * charge.quantity;
      }
    }

    // Create invoice with charges
    const invoice = await this.prisma.invoice.create({
      data: {
        ...invoiceData,
        patientId,
        invoiceNumber,
        totalAmount,
        balance: totalAmount,
        charges: {
          create:
            charges?.map((charge) => ({
              serviceId: charge.serviceId,
              description: charge.description,
              quantity: charge.quantity,
              unitPrice: charge.unitPrice,
              totalPrice: charge.unitPrice * charge.quantity,
            })) || [],
        },
      },
      include: {
        patient: true,
        charges: {
          include: {
            service: true,
          },
        },
      },
    });

    return invoice;
  }

  async findAllInvoices(query?: {
    patientId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    const where: any = {};

    if (query?.patientId) {
      where.patientId = query.patientId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.startDate || query?.endDate) {
      where.issuedDate = {};
      if (query.startDate) where.issuedDate.gte = query.startDate;
      if (query.endDate) where.issuedDate.lte = query.endDate;
    }

    if (query?.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
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

    return await this.prisma.invoice.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        charges: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
      orderBy: { issuedDate: 'desc' },
    });
  }

  async findInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            account: true,
          },
        },
        charges: {
          include: {
            service: true,
          },
        },
        payments: {
          orderBy: { processedAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async findInvoiceByNumber(invoiceNumber: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        patient: true,
        charges: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async updateInvoice(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    const invoice = await this.findInvoiceById(id);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Remove patientId and charges from update data since they cannot be changed
    const { patientId, charges, ...updateData } = updateInvoiceDto;

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            firstName: true,
            lastName: true,
          },
        },
        charges: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return updatedInvoice;
  }

  async addChargeToInvoice(
    invoiceId: string,
    createChargeDto: CreateChargeDto,
  ) {
    const invoice = await this.findInvoiceById(invoiceId);

    if (invoice.status !== 'DRAFT' && invoice.status !== 'PENDING') {
      throw new ConflictException('Cannot add charges to a finalized invoice');
    }

    // Check if service exists
    const service = await this.prisma.service.findUnique({
      where: { id: createChargeDto.serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Create charge
    const charge = await this.prisma.charge.create({
      data: {
        ...createChargeDto,
        invoiceId,
        unitPrice: createChargeDto.unitPrice,
        totalPrice: createChargeDto.unitPrice * createChargeDto.quantity,
      },
      include: {
        service: true,
      },
    });

    // Update invoice total and balance
    const newTotal = Number(invoice.totalAmount) + Number(charge.totalPrice);
    const newBalance = Number(invoice.balance) + Number(charge.totalPrice);

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        totalAmount: newTotal,
        balance: newBalance,
      },
    });

    return charge;
  }

  async removeChargeFromInvoice(invoiceId: string, chargeId: string) {
    const invoice = await this.findInvoiceById(invoiceId);
    const charge = await this.prisma.charge.findUnique({
      where: { id: chargeId, invoiceId },
    });

    if (!charge) {
      throw new NotFoundException('Charge not found');
    }

    if (invoice.status !== 'DRAFT' && invoice.status !== 'PENDING') {
      throw new ConflictException(
        'Cannot remove charges from a finalized invoice',
      );
    }

    // Update invoice total and balance
    const newTotal = Number(invoice.totalAmount) - Number(charge.totalPrice);
    const newBalance = Number(invoice.balance) - Number(charge.totalPrice);

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        totalAmount: newTotal,
        balance: newBalance,
      },
    });

    // Remove charge
    await this.prisma.charge.delete({
      where: { id: chargeId },
    });

    return { message: 'Charge removed successfully' };
  }

  async finalizeInvoice(id: string) {
    const invoice = await this.findInvoiceById(id);

    if (invoice.status !== 'DRAFT') {
      throw new ConflictException('Only draft invoices can be finalized');
    }

    if (invoice.charges.length === 0) {
      throw new ConflictException('Cannot finalize invoice without charges');
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'PENDING',
        issuedDate: new Date(),
      },
      include: {
        patient: true,
        charges: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
    });

    return updatedInvoice;
  }

  async cancelInvoice(id: string, reason?: string) {
    const invoice = await this.findInvoiceById(id);

    if (invoice.status === 'PAID') {
      throw new ConflictException('Cannot cancel a paid invoice');
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason
          ? `${invoice.notes || ''}\nCancelled: ${reason}`.trim()
          : invoice.notes,
      },
      include: {
        patient: true,
        charges: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
    });

    return updatedInvoice;
  }

  async getInvoiceSummary(patientId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { patientId },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        paidAmount: true,
        balance: true,
        status: true,
        issuedDate: true,
        dueDate: true,
      },
      orderBy: { issuedDate: 'desc' },
    });

    const totalOutstanding = invoices
      .filter((inv) => inv.status === 'PENDING' || inv.status === 'PARTIAL')
      .reduce((sum, inv) => sum + Number(inv.balance), 0);

    const totalPaid = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    return {
      invoices,
      summary: {
        totalInvoices: invoices.length,
        totalOutstanding,
        totalPaid,
        pendingInvoices: invoices.filter((inv) => inv.status === 'PENDING')
          .length,
        overdueInvoices: invoices.filter(
          (inv) =>
            inv.status === 'PENDING' && inv.dueDate && new Date() > inv.dueDate,
        ).length,
      },
    };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const prefix = 'INV';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Get count of invoices created this month
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const count = await this.prisma.invoice.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}${year}${month}${sequence}`;
  }

  // Payment Processing Methods
  async processPayment(
    invoiceId: string,
    paymentData: {
      amount: number;
      method: string;
      reference?: string;
      processedBy: string;
      notes?: string;
    },
  ) {
    const invoice = await this.findInvoiceById(invoiceId);

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

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        patientId: invoice.patientId,
        amount: paymentData.amount,
        method: paymentData.method as any, // Cast to PaymentMethod enum
        reference: paymentData.reference,
        processedBy: paymentData.processedBy,
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
      include: {
        patient: true,
        charges: {
          include: {
            service: true,
          },
        },
        payments: {
          orderBy: { processedAt: 'desc' },
        },
      },
    });

    return {
      payment,
      updatedInvoice,
      message: `Payment processed successfully. New balance: $${newBalance}`,
    };
  }

  // Check payment status for service verification
  async checkPaymentStatusForService(invoiceId: string) {
    const invoice = await this.findInvoiceById(invoiceId);

    if (invoice.status === 'PAID') {
      return {
        canProceed: true,
        message: 'Invoice fully paid. Service can proceed.',
        paymentStatus: 'PAID',
        balance: 0,
      };
    }

    if (invoice.status === 'PARTIAL') {
      return {
        canProceed: false,
        message: `Partial payment received. Outstanding balance: $${Number(invoice.balance)}. Full payment required before service.`,
        paymentStatus: 'PARTIAL',
        balance: Number(invoice.balance),
      };
    }

    if (invoice.status === 'PENDING') {
      return {
        canProceed: false,
        message: `Payment required before service. Total amount due: $${Number(invoice.totalAmount)}`,
        paymentStatus: 'PENDING',
        balance: Number(invoice.totalAmount),
      };
    }

    return {
      canProceed: false,
      message: `Invoice status: ${invoice.status}. Payment verification required.`,
      paymentStatus: invoice.status,
      balance: Number(invoice.balance),
    };
  }

  // Get payment history for an invoice
  async getPaymentHistory(invoiceId: string) {
    const invoice = await this.findInvoiceById(invoiceId);

    const payments = await this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { processedAt: 'desc' },
    });

    return {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        balance: Number(invoice.balance),
        status: invoice.status,
      },
      payments: payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.method,
        reference: payment.reference,
        status: payment.status,
        processedBy: payment.processedBy,
        processedAt: payment.processedAt,
        notes: payment.notes,
      })),
      summary: {
        totalPayments: payments.length,
        totalAmountPaid: Number(invoice.paidAmount),
        remainingBalance: Number(invoice.balance),
        paymentStatus: invoice.status,
      },
    };
  }

  // Refund processing
  async processRefund(
    paymentId: string,
    refundData: {
      amount: number;
      reason: string;
      processedBy: string;
      notes?: string;
    },
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new ConflictException('Can only refund completed payments');
    }

    if (refundData.amount > Number(payment.amount)) {
      throw new BadRequestException(
        `Refund amount ($${refundData.amount}) cannot exceed payment amount ($${Number(payment.amount)})`,
      );
    }

    // Create refund record
    const refund = await this.prisma.refund.create({
      data: {
        paymentId,
        patientId: payment.patientId,
        invoiceId: payment.invoiceId,
        amount: refundData.amount,
        reason: refundData.reason,
        notes: refundData.notes,
        status: 'APPROVED',
        approvedBy: refundData.processedBy,
        approvedAt: new Date(),
      },
    });

    // Update payment status if full refund
    if (refundData.amount === Number(payment.amount)) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      });
    }

    // Update invoice balance
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payment.invoiceId },
    });

    if (invoice) {
      const newPaidAmount = Number(invoice.paidAmount) - refundData.amount;
      const newBalance = Number(invoice.balance) + refundData.amount;
      const newStatus = newBalance > 0 ? 'PARTIAL' : 'PENDING';

      await this.prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus,
        },
      });
    }

    return {
      refund,
      message: `Refund processed successfully. Amount: $${refundData.amount}`,
    };
  }

  // Get billing analytics
  async getBillingAnalytics(startDate: Date, endDate: Date) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        issuedDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      include: {
        charges: true,
        payments: true,
      },
    });

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );
    const totalPaid = invoices.reduce(
      (sum, inv) => sum + Number(inv.paidAmount),
      0,
    );
    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + Number(inv.balance),
      0,
    );

    const statusBreakdown = {
      DRAFT: invoices.filter((inv) => inv.status === 'DRAFT').length,
      PENDING: invoices.filter((inv) => inv.status === 'PENDING').length,
      PARTIAL: invoices.filter((inv) => inv.status === 'PARTIAL').length,
      PAID: invoices.filter((inv) => inv.status === 'PAID').length,
      OVERDUE: invoices.filter((inv) => inv.status === 'OVERDUE').length,
    };

    return {
      period: { startDate, endDate },
      summary: {
        totalInvoices,
        totalAmount,
        totalPaid,
        totalOutstanding,
        collectionRate: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      },
      statusBreakdown,
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        balance: Number(invoice.balance),
        status: invoice.status,
        issuedDate: invoice.issuedDate,
      })),
    };
  }

  /**
   * Create invoice with Paystack integration
   */
  async createInvoiceWithPaystack(
    createInvoiceDto: CreateInvoiceDto,
    lineItems?: Array<{ name: string; amount: number; quantity: number }>,
  ) {
    try {
      // Create local invoice first
      const invoice = await this.createInvoice(createInvoiceDto);

      // Create Paystack invoice
      const paystackInvoice = await this.paystackService.createInvoice(
        invoice.patientId,
        Number(invoice.totalAmount),
        invoice.notes || 'Hospital services invoice',
        lineItems,
      );

      // Update local invoice with Paystack reference
      const updatedInvoice = await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paystackInvoiceId: paystackInvoice.paystackInvoiceId,
          paystackReference: paystackInvoice.requestCode,
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientId: true,
            },
          },
          charges: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  serviceCode: true,
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              method: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      return this.mapToInvoiceResponse(updatedInvoice);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create invoice with Paystack: ${error.message}`,
      );
    }
  }

  /**
   * Get Paystack invoice details
   */
  async getPaystackInvoiceDetails(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        paystackInvoice: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientId: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!invoice.paystackInvoice) {
      throw new BadRequestException('This invoice is not linked to Paystack');
    }

    return {
      localInvoice: this.mapToInvoiceResponse(invoice),
      paystackInvoice: invoice.paystackInvoice,
    };
  }

  /**
   * Get all Paystack invoices
   */
  async getPaystackInvoices(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          paystackInvoiceId: { not: null },
        },
        skip,
        take: limit,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientId: true,
            },
          },
          paystackInvoice: true,
          charges: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  serviceCode: true,
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              method: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({
        where: {
          paystackInvoiceId: { not: null },
        },
      }),
    ]);

    return {
      invoices: invoices.map((invoice) => this.mapToInvoiceResponse(invoice)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Paystack payment statistics
   */
  async getPaystackPaymentStats() {
    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      totalAmount,
      paidAmount,
    ] = await Promise.all([
      this.prisma.invoice.count({
        where: { paystackInvoiceId: { not: null } },
      }),
      this.prisma.invoice.count({
        where: {
          paystackInvoiceId: { not: null },
          status: 'PAID',
        },
      }),
      this.prisma.invoice.count({
        where: {
          paystackInvoiceId: { not: null },
          status: 'PENDING',
        },
      }),
      this.prisma.invoice.aggregate({
        where: { paystackInvoiceId: { not: null } },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          paystackInvoiceId: { not: null },
          status: 'PAID',
        },
        _sum: { paidAmount: true },
      }),
    ]);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      totalAmount: Number(totalAmount._sum.totalAmount || 0),
      paidAmount: Number(paidAmount._sum.paidAmount || 0),
      pendingAmount:
        Number(totalAmount._sum.totalAmount || 0) -
        Number(paidAmount._sum.paidAmount || 0),
    };
  }

  private mapToInvoiceResponse(invoice: any) {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      patient: {
        id: invoice.patient.id,
        patientId: invoice.patient.patientId,
        firstName: invoice.patient.firstName,
        lastName: invoice.patient.lastName,
      },
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      balance: Number(invoice.balance),
      status: invoice.status,
      issuedDate: invoice.issuedDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      charges: invoice.charges.map((charge: any) => ({
        id: charge.id,
        service: {
          id: charge.service.id,
          name: charge.service.name,
          serviceCode: charge.service.serviceCode,
        },
        description: charge.description,
        quantity: charge.quantity,
        unitPrice: Number(charge.unitPrice),
        totalPrice: Number(charge.totalPrice),
      })),
      payments: invoice.payments.map((payment: any) => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.method,
        status: payment.status,
        processedAt: payment.processedAt,
        notes: payment.notes,
      })),
      paystackInvoiceId: invoice.paystackInvoiceId,
      paystackReference: invoice.paystackReference,
    };
  }
}
