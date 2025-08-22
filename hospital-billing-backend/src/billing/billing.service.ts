import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaystackService } from '../paystack/paystack.service';
import * as puppeteer from 'puppeteer';
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

  // Helper function to convert unitPrice to number
  private parseUnitPrice(unitPrice: string | number): number {
    return typeof unitPrice === 'string' ? parseFloat(unitPrice) : unitPrice;
  }

  // Invoice Management
  async createInvoice(createInvoiceDto: CreateInvoiceDto) {
    const { patientId, items, charges, ...invoiceData } = createInvoiceDto;

    // Use items if provided, otherwise fall back to charges for backward compatibility
    const invoiceItems = items || charges || [];

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

    // Calculate total amount from invoice items
    let totalAmount = 0;
    if (invoiceItems && invoiceItems.length > 0) {
      for (const item of invoiceItems) {
        const service = await this.prisma.service.findUnique({
          where: { id: item.serviceId },
        });

        if (!service) {
          throw new NotFoundException(
            `Service with ID ${item.serviceId} not found`,
          );
        }

        // Handle both string and number unitPrice
        const unitPrice = this.parseUnitPrice(item.unitPrice);
        totalAmount += Number(service.currentPrice) * item.quantity;
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
            invoiceItems?.map((item) => ({
              serviceId: item.serviceId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: this.parseUnitPrice(item.unitPrice),
              totalPrice: this.parseUnitPrice(item.unitPrice) * item.quantity,
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

  async deleteInvoice(id: string) {
    const invoice = await this.findInvoiceById(id);

    // Check if invoice can be deleted
    if (invoice.status === 'PAID') {
      throw new ConflictException('Cannot delete a paid invoice');
    }

    if (invoice.status === 'PARTIAL') {
      throw new ConflictException(
        'Cannot delete an invoice with partial payments',
      );
    }

    if (invoice.payments && invoice.payments.length > 0) {
      throw new ConflictException(
        'Cannot delete an invoice with payment history',
      );
    }

    // Delete charges first (due to foreign key constraints)
    await this.prisma.charge.deleteMany({
      where: { invoiceId: id },
    });

    // Delete the invoice
    await this.prisma.invoice.delete({
      where: { id },
    });

    return { message: 'Invoice deleted successfully' };
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

  // PDF Generation
  async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    const invoice = await this.findInvoiceById(invoiceId);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Generate HTML content for the invoice
    const htmlContent = this.generateInvoiceHTML(invoice);

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

  private generateInvoiceHTML(invoice: any): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    const formatDate = (date: Date | string | null) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const subtotal = invoice.charges.reduce(
      (sum: number, charge: any) => sum + Number(charge.totalPrice),
      0,
    );

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                line-height: 1.6;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 20px;
            }
            .hospital-info h1 {
                margin: 0;
                color: #2563eb;
                font-size: 24px;
            }
            .hospital-info p {
                margin: 5px 0;
                color: #666;
            }
            .invoice-info {
                text-align: right;
            }
            .invoice-info h2 {
                margin: 0;
                color: #2563eb;
                font-size: 28px;
            }
            .invoice-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            .patient-info, .invoice-meta {
                width: 45%;
            }
            .patient-info h3, .invoice-meta h3 {
                margin-bottom: 10px;
                color: #2563eb;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
            }
            .info-row {
                display: flex;
                margin-bottom: 5px;
            }
            .info-label {
                font-weight: bold;
                width: 120px;
                color: #374151;
            }
            .info-value {
                color: #6b7280;
            }
            .charges-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .charges-table th {
                background-color: #2563eb;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: bold;
            }
            .charges-table td {
                padding: 12px;
                border-bottom: 1px solid #e5e7eb;
            }
            .charges-table tr:nth-child(even) {
                background-color: #f9fafb;
            }
            .text-right {
                text-align: right;
            }
            .text-center {
                text-align: center;
            }
            .summary {
                margin-left: auto;
                width: 300px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                overflow: hidden;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 16px;
                border-bottom: 1px solid #e5e7eb;
            }
            .summary-row:last-child {
                border-bottom: none;
                background-color: #2563eb;
                color: white;
                font-weight: bold;
                font-size: 18px;
            }
            .summary-label {
                font-weight: bold;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-paid {
                background-color: #dcfce7;
                color: #166534;
            }
            .status-pending {
                background-color: #fef3c7;
                color: #92400e;
            }
            .status-partial {
                background-color: #fef3c7;
                color: #92400e;
            }
            .status-overdue {
                background-color: #fee2e2;
                color: #991b1b;
            }
            .status-cancelled {
                background-color: #f3f4f6;
                color: #374151;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
            .notes {
                margin-top: 30px;
                padding: 16px;
                background-color: #f9fafb;
                border-left: 4px solid #2563eb;
                border-radius: 4px;
            }
            .notes h4 {
                margin: 0 0 10px 0;
                color: #2563eb;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="hospital-info">
                <h1>Hospital Billing System</h1>
                <p>123 Medical Center Drive</p>
                <p>Healthcare City, HC 12345</p>
                <p>Phone: (555) 123-4567</p>
                <p>Email: billing@hospital.com</p>
            </div>
            <div class="invoice-info">
                <h2>INVOICE</h2>
                <p><strong>${invoice.invoiceNumber}</strong></p>
            </div>
        </div>

        <div class="invoice-details">
            <div class="patient-info">
                <h3>Bill To:</h3>
                <div class="info-row">
                    <span class="info-label">Patient ID:</span>
                    <span class="info-value">${invoice.patient.patientId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${invoice.patient.firstName} ${invoice.patient.lastName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${invoice.patient.phoneNumber || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${invoice.patient.email || 'N/A'}</span>
                </div>
            </div>
            
            <div class="invoice-meta">
                <h3>Invoice Details:</h3>
                <div class="info-row">
                    <span class="info-label">Issue Date:</span>
                    <span class="info-value">${formatDate(invoice.issuedDate)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Due Date:</span>
                    <span class="info-value">${formatDate(invoice.dueDate)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">
                        <span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span>
                    </span>
                </div>
                ${
                  invoice.paidDate
                    ? `
                <div class="info-row">
                    <span class="info-label">Paid Date:</span>
                    <span class="info-value">${formatDate(invoice.paidDate)}</span>
                </div>
                `
                    : ''
                }
            </div>
        </div>

        <table class="charges-table">
            <thead>
                <tr>
                    <th>Service</th>
                    <th>Description</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.charges
                  .map(
                    (charge: any) => `
                <tr>
                    <td>${charge.service?.name || 'Service'}</td>
                    <td>${charge.description || 'N/A'}</td>
                    <td class="text-center">${charge.quantity}</td>
                    <td class="text-right">${formatCurrency(Number(charge.unitPrice))}</td>
                    <td class="text-right">${formatCurrency(Number(charge.totalPrice))}</td>
                </tr>
                `,
                  )
                  .join('')}
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-row">
                <span class="summary-label">Subtotal:</span>
                <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Total Amount:</span>
                <span>${formatCurrency(Number(invoice.totalAmount))}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Paid Amount:</span>
                <span>${formatCurrency(Number(invoice.paidAmount))}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Balance Due:</span>
                <span>${formatCurrency(Number(invoice.balance))}</span>
            </div>
        </div>

        ${
          invoice.notes
            ? `
        <div class="notes">
            <h4>Notes:</h4>
            <p>${invoice.notes}</p>
        </div>
        `
            : ''
        }

        <div class="footer">
            <p>Thank you for choosing our healthcare services.</p>
            <p>For questions about this invoice, please contact our billing department.</p>
            <p>Generated on ${formatDate(new Date())}</p>
        </div>
    </body>
    </html>
    `;
  }
}
