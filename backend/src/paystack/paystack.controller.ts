import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { PaystackService, PaystackWebhookEvent } from './paystack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('paystack')
export class PaystackController {
  private readonly logger = new Logger(PaystackController.name);

  constructor(private readonly paystackService: PaystackService) {}

  /**
   * Webhook endpoint for Paystack events
   * This endpoint receives all Paystack webhook events
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ): Promise<{ status: string }> {
    try {
      // Verify webhook signature for security
      if (!signature) {
        this.logger.warn('Missing Paystack signature');
        throw new BadRequestException('Missing signature');
      }

      const payloadString = JSON.stringify(payload);
      const isValidSignature = this.paystackService.verifyWebhookSignature(
        payloadString,
        signature,
      );

      if (!isValidSignature) {
        this.logger.warn('Invalid Paystack signature');
        throw new BadRequestException('Invalid signature');
      }

      // Process the webhook event
      await this.paystackService.processWebhook(
        payload as PaystackWebhookEvent,
      );

      this.logger.log('Webhook processed successfully');
      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  /**
   * Create a Paystack invoice for a patient
   * Protected endpoint for creating invoices
   */
  @Post('invoices')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(
    @Body()
    createInvoiceDto: {
      patientId: string;
      amount: number;
      description: string;
      lineItems?: Array<{ name: string; amount: number; quantity: number }>;
    },
  ) {
    try {
      const { patientId, amount, description, lineItems } = createInvoiceDto;

      const paystackInvoice = await this.paystackService.createInvoice(
        patientId,
        amount,
        description,
        lineItems,
      );

      return {
        status: 'success',
        message: 'Paystack invoice created successfully',
        data: {
          localInvoiceId: paystackInvoice.localInvoiceId,
          paystackInvoiceId: paystackInvoice.paystackInvoiceId,
          requestCode: paystackInvoice.requestCode,
          offlineReference: paystackInvoice.offlineReference,
          amount: paystackInvoice.amount,
          status: paystackInvoice.status,
        },
      };
    } catch (error) {
      this.logger.error('Error creating Paystack invoice:', error);
      throw new BadRequestException('Failed to create Paystack invoice');
    }
  }

  /**
   * Get Paystack invoice details
   */
  @Post('invoices/:invoiceId')
  @UseGuards(JwtAuthGuard)
  async getInvoice(@Body() body: { localInvoiceId: string }) {
    try {
      const paystackInvoice = await this.paystackService.getPaystackInvoice(
        body.localInvoiceId,
      );

      if (!paystackInvoice) {
        throw new BadRequestException('Paystack invoice not found');
      }

      return {
        status: 'success',
        data: paystackInvoice,
      };
    } catch (error) {
      this.logger.error('Error retrieving Paystack invoice:', error);
      throw new BadRequestException('Failed to retrieve Paystack invoice');
    }
  }

  /**
   * Get Paystack customer details
   */
  @Post('customers/:patientId')
  @UseGuards(JwtAuthGuard)
  async getCustomer(@Body() body: { patientId: string }) {
    try {
      const paystackCustomer = await this.paystackService.getPaystackCustomer(
        body.patientId,
      );

      if (!paystackCustomer) {
        throw new BadRequestException('Paystack customer not found');
      }

      return {
        status: 'success',
        data: paystackCustomer,
      };
    } catch (error) {
      this.logger.error('Error retrieving Paystack customer:', error);
      throw new BadRequestException('Failed to retrieve Paystack customer');
    }
  }
}
