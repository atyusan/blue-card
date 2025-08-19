import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { PaystackCustomer, PaystackInvoice } from '@prisma/client';
import axios, { AxiosResponse } from 'axios';
import * as crypto from 'crypto';

export interface PaystackCustomerData {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface PaystackInvoiceData {
  customer: string;
  amount: number;
  description?: string;
  due_date?: string;
  line_items?: Array<{
    name: string;
    amount: number;
    quantity: number;
  }>;
}

export interface PaystackWebhookEvent {
  event: string;
  data: any;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly baseUrl: string;
  private readonly webhookTimeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('paystack.secretKey');
    const publicKey = this.configService.get<string>('paystack.publicKey');
    const baseUrl = this.configService.get<string>('paystack.baseUrl');
    const webhookTimeout = this.configService.get<number>('webhook.timeout');
    const maxRetries = this.configService.get<number>('webhook.maxRetries');
    const retryDelay = this.configService.get<number>('webhook.retryDelay');

    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is required');
    }

    this.secretKey = secretKey;
    this.publicKey = publicKey || '';
    this.baseUrl = baseUrl || 'https://api.paystack.co';
    this.webhookTimeout = webhookTimeout || 30000;
    this.maxRetries = maxRetries || 3;
    this.retryDelay = retryDelay || 5000;
  }

  /**
   * Create a Paystack customer
   */
  async createCustomer(
    customerData: PaystackCustomerData,
  ): Promise<PaystackCustomer> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/customer`,
        customerData,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.webhookTimeout,
        },
      );

      if (response.data.status) {
        const paystackCustomer = response.data.data;

        return await this.prisma.paystackCustomer.create({
          data: {
            paystackCustomerId: paystackCustomer.id.toString(),
            customerCode: paystackCustomer.customer_code,
            email: paystackCustomer.email,
            firstName: paystackCustomer.first_name,
            lastName: paystackCustomer.last_name,
            phone: paystackCustomer.phone,
            metadata: paystackCustomer,
            patientId: '', // This will be set by the caller
          },
        });
      } else {
        throw new BadRequestException('Failed to create Paystack customer');
      }
    } catch (error) {
      this.logger.error('Error creating Paystack customer:', error);
      throw new BadRequestException('Failed to create Paystack customer');
    }
  }

  /**
   * Get or create a Paystack customer for a patient
   */
  async getOrCreateCustomer(patientId: string): Promise<PaystackCustomer> {
    // Check if customer already exists
    const existingCustomer = await this.prisma.paystackCustomer.findUnique({
      where: { patientId },
    });

    if (existingCustomer) {
      return existingCustomer;
    }

    // Get patient data
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new BadRequestException('Patient not found');
    }

    // Create customer data
    const customerData: PaystackCustomerData = {
      email: patient.email || `${patient.patientId}@hospital.local`,
      first_name: patient.firstName,
      last_name: patient.lastName,
      phone: patient.phoneNumber || undefined,
    };

    // Create Paystack customer
    const paystackCustomer = await this.createCustomer(customerData);

    // Update with patient ID
    return await this.prisma.paystackCustomer.update({
      where: { id: paystackCustomer.id },
      data: { patientId },
    });
  }

  /**
   * Create a Paystack invoice
   */
  async createInvoice(
    patientId: string,
    amount: number,
    description: string,
    lineItems?: Array<{ name: string; amount: number; quantity: number }>,
  ): Promise<PaystackInvoice> {
    try {
      // Get or create customer
      const customer = await this.getOrCreateCustomer(patientId);

      // Create local invoice first
      const localInvoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          patientId,
          totalAmount: amount,
          balance: amount,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          notes: description,
        },
      });

      // Prepare invoice data for Paystack
      const invoiceData: PaystackInvoiceData = {
        customer: customer.customerCode,
        amount: Math.round(amount * 100), // Convert to kobo (smallest currency unit)
        description,
        line_items: lineItems,
      };

      // Create Paystack invoice
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/paymentrequest`,
        invoiceData,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.webhookTimeout,
        },
      );

      if (response.data.status) {
        const paystackInvoice = response.data.data;

        // Create Paystack invoice record
        return await this.prisma.paystackInvoice.create({
          data: {
            localInvoiceId: localInvoice.id,
            paystackCustomerId: customer.id,
            paystackInvoiceId: paystackInvoice.id.toString(),
            requestCode: paystackInvoice.request_code,
            offlineReference: paystackInvoice.offline_reference,
            status: 'PENDING',
            amount: amount,
            currency: paystackInvoice.currency,
            description: paystackInvoice.description,
            dueDate: paystackInvoice.due_date
              ? new Date(paystackInvoice.due_date)
              : null,
            hasInvoice: paystackInvoice.has_invoice,
            invoiceNumber: paystackInvoice.invoice_number?.toString(),
            pdfUrl: paystackInvoice.pdf_url,
            lineItems: paystackInvoice.line_items,
            tax: paystackInvoice.tax,
            discount: paystackInvoice.discount,
            metadata: paystackInvoice,
          },
        });
      } else {
        throw new BadRequestException('Failed to create Paystack invoice');
      }
    } catch (error) {
      this.logger.error('Error creating Paystack invoice:', error);
      throw new BadRequestException('Failed to create Paystack invoice');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload, 'utf8')
      .digest('hex');

    return hash === signature;
  }

  /**
   * Process webhook events
   */
  async processWebhook(event: PaystackWebhookEvent): Promise<void> {
    try {
      this.logger.log(`Processing webhook event: ${event.event}`);

      switch (event.event) {
        case 'charge.success':
          await this.handleChargeSuccess(event.data);
          break;

        case 'paymentrequest.success':
          await this.handlePaymentRequestSuccess(event.data);
          break;

        case 'paymentrequest.pending':
          await this.handlePaymentRequestPending(event.data);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data);
          break;

        default:
          this.logger.warn(`Unhandled webhook event: ${event.event}`);
      }
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful charge
   */
  private async handleChargeSuccess(data: any): Promise<void> {
    this.logger.log(`Charge successful: ${data.reference}`);

    // Update payment status and create payment record
    // This will be implemented based on your payment flow
  }

  /**
   * Handle successful payment request
   */
  private async handlePaymentRequestSuccess(data: any): Promise<void> {
    this.logger.log(`Payment request successful: ${data.request_code}`);

    // Find and update Paystack invoice
    const paystackInvoice = await this.prisma.paystackInvoice.findUnique({
      where: { requestCode: data.request_code },
      include: { localInvoice: true },
    });

    if (paystackInvoice) {
      // Update Paystack invoice status
      await this.prisma.paystackInvoice.update({
        where: { id: paystackInvoice.id },
        data: {
          status: 'SUCCESS',
          paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
        },
      });

      // Update local invoice status
      await this.prisma.invoice.update({
        where: { id: paystackInvoice.localInvoice.id },
        data: {
          status: 'PAID',
          paidAmount: data.amount / 100, // Convert from kobo
          balance: 0,
        },
      });

      // Create payment record
      await this.prisma.payment.create({
        data: {
          invoiceId: paystackInvoice.localInvoice.id,
          patientId: paystackInvoice.localInvoice.patientId,
          amount: data.amount / 100,
          method: 'PAYSTACK_TERMINAL',
          reference: data.offline_reference,
          status: 'COMPLETED',
          processedBy: 'system',
          notes: 'Payment via Paystack Terminal',
        },
      });
    }
  }

  /**
   * Handle pending payment request
   */
  private async handlePaymentRequestPending(data: any): Promise<void> {
    this.logger.log(`Payment request pending: ${data.request_code}`);

    // Update Paystack invoice status
    await this.prisma.paystackInvoice.updateMany({
      where: { requestCode: data.request_code },
      data: { status: 'PENDING' },
    });
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(data: any): Promise<void> {
    this.logger.log(`Invoice payment failed: ${data.invoice_code}`);

    // Update Paystack invoice status
    await this.prisma.paystackInvoice.updateMany({
      where: { paystackInvoiceId: data.invoice_code },
      data: { status: 'FAILED' },
    });
  }

  /**
   * Get Paystack invoice by local invoice ID
   */
  async getPaystackInvoice(
    localInvoiceId: string,
  ): Promise<PaystackInvoice | null> {
    return await this.prisma.paystackInvoice.findUnique({
      where: { localInvoiceId },
    });
  }

  /**
   * Get Paystack customer by patient ID
   */
  async getPaystackCustomer(
    patientId: string,
  ): Promise<PaystackCustomer | null> {
    return await this.prisma.paystackCustomer.findUnique({
      where: { patientId },
    });
  }
}
