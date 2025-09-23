import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@ApiTags('Billing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Invoice Management
  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.billingService.createInvoice(createInvoiceDto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({
    status: 200,
    description: 'List of all invoices',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    description: 'Filter by patient ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by invoice status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by start date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by end date',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by invoice number, patient name, or patient ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  findAllInvoices(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.billingService.findAllInvoices({
      patientId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      page,
      limit,
    });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({
    status: 200,
    description: 'Invoice found with complete details',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  findInvoiceById(@Param('id') id: string) {
    return this.billingService.findInvoiceById(id);
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Generate PDF for invoice' })
  @ApiResponse({
    status: 200,
    description: 'PDF generated successfully',
    headers: {
      'Content-Type': {
        description: 'application/pdf',
      },
      'Content-Disposition': {
        description: 'attachment; filename="invoice-{invoiceNumber}.pdf"',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async generateInvoicePDF(@Param('id') id: string, @Res() response: Response) {
    const pdfBuffer = await this.billingService.generateInvoicePDF(id);
    const invoice = await this.billingService.findInvoiceById(id);

    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    response.send(pdfBuffer);
  }

  @Get('invoices/by-number/:invoiceNumber')
  @ApiOperation({ summary: 'Get invoice by invoice number' })
  @ApiResponse({
    status: 200,
    description: 'Invoice found',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  findInvoiceByNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.billingService.findInvoiceByNumber(invoiceNumber);
  }

  @Patch('invoices/:id')
  @ApiOperation({ summary: 'Update invoice by ID' })
  @ApiResponse({
    status: 200,
    description: 'Invoice updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  updateInvoice(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.billingService.updateInvoice(id, updateInvoiceDto);
  }

  @Post('invoices/:id/finalize')
  @ApiOperation({ summary: 'Finalize a draft invoice' })
  @ApiResponse({
    status: 200,
    description: 'Invoice finalized successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Invoice cannot be finalized',
  })
  finalizeInvoice(@Param('id') id: string) {
    return this.billingService.finalizeInvoice(id);
  }

  @Post('invoices/:id/cancel')
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiResponse({
    status: 200,
    description: 'Invoice cancelled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Invoice cannot be cancelled',
  })
  cancelInvoice(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.billingService.cancelInvoice(id, body.reason);
  }

  @Delete('invoices/:id')
  @ApiOperation({ summary: 'Delete an invoice' })
  @ApiResponse({
    status: 200,
    description: 'Invoice deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Invoice cannot be deleted',
  })
  deleteInvoice(@Param('id') id: string) {
    return this.billingService.deleteInvoice(id);
  }

  // Charge Management
  @Post('invoices/:id/charges')
  @ApiOperation({ summary: 'Add a charge to an invoice' })
  @ApiResponse({
    status: 201,
    description: 'Charge added successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice or service not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot add charges to this invoice',
  })
  addChargeToInvoice(
    @Param('id') invoiceId: string,
    @Body() createChargeDto: CreateChargeDto,
  ) {
    return this.billingService.addChargeToInvoice(invoiceId, createChargeDto);
  }

  @Delete('invoices/:invoiceId/charges/:chargeId')
  @ApiOperation({ summary: 'Remove a charge from an invoice' })
  @ApiResponse({
    status: 200,
    description: 'Charge removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice or charge not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot remove charges from this invoice',
  })
  removeChargeFromInvoice(
    @Param('invoiceId') invoiceId: string,
    @Param('chargeId') chargeId: string,
  ) {
    return this.billingService.removeChargeFromInvoice(invoiceId, chargeId);
  }

  // Patient Billing Summary
  @Get('patients/:patientId/summary')
  @ApiOperation({ summary: 'Get billing summary for a patient' })
  @ApiResponse({
    status: 200,
    description: 'Patient billing summary',
  })
  getPatientBillingSummary(@Param('patientId') patientId: string) {
    return this.billingService.getInvoiceSummary(patientId);
  }

  // Payment Processing Endpoints
  @Post('invoices/:id/payments')
  @ApiOperation({ summary: 'Process payment for an invoice' })
  @ApiResponse({
    status: 201,
    description: 'Payment processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payment amount',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Invoice already paid or cancelled',
  })
  processPayment(
    @Param('id') invoiceId: string,
    @Body()
    paymentData: {
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
    },
    @Request() req: any,
  ) {
    // Get the authenticated user from the JWT token
    const user = req.user;
    const processedBy = user?.id || user?.sub || 'system';

    return this.billingService.processPayment(invoiceId, {
      ...paymentData,
      processedBy,
    });
  }

  @Get('invoices/:id/payment-status')
  @ApiOperation({ summary: 'Check payment status for service verification' })
  @ApiResponse({
    status: 200,
    description: 'Payment status checked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  checkPaymentStatus(@Param('id') invoiceId: string) {
    return this.billingService.checkPaymentStatusForService(invoiceId);
  }

  @Get('invoices/:id/payment-history')
  @ApiOperation({ summary: 'Get payment history for an invoice' })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  getPaymentHistory(@Param('id') invoiceId: string) {
    return this.billingService.getPaymentHistory(invoiceId);
  }

  @Post('payments/:id/refunds')
  @ApiOperation({ summary: 'Process refund for a payment' })
  @ApiResponse({
    status: 201,
    description: 'Refund processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid refund amount',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot refund this payment',
  })
  processRefund(
    @Param('id') paymentId: string,
    @Body()
    refundData: {
      amount: number;
      reason: string;
      notes?: string;
    },
    @Request() req: any,
  ) {
    // Get the authenticated user from the JWT token
    const user = req.user;
    const processedBy = user?.id || user?.sub || 'system';

    return this.billingService.processRefund(paymentId, {
      ...refundData,
      processedBy,
    });
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get billing analytics for a date range' })
  @ApiResponse({
    status: 200,
    description: 'Billing analytics retrieved successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for analytics (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for analytics (YYYY-MM-DD)',
  })
  getBillingAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.billingService.getBillingAnalytics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  // ===== PAYSTACK INTEGRATION ENDPOINTS =====

  @Post('paystack/invoices')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createInvoiceWithPaystack(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Body('lineItems')
    lineItems?: Array<{ name: string; amount: number; quantity: number }>,
  ) {
    return await this.billingService.createInvoiceWithPaystack(
      createInvoiceDto,
      lineItems,
    );
  }

  @Get('paystack/invoices')
  @UseGuards(JwtAuthGuard)
  async getPaystackInvoices(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return await this.billingService.getPaystackInvoices(
      Number(page),
      Number(limit),
    );
  }

  @Get('paystack/invoices/:id')
  @UseGuards(JwtAuthGuard)
  async getPaystackInvoiceDetails(@Param('id') id: string) {
    return await this.billingService.getPaystackInvoiceDetails(id);
  }

  @Get('paystack/stats')
  @UseGuards(JwtAuthGuard)
  async getPaystackPaymentStats() {
    return await this.billingService.getPaystackPaymentStats();
  }
}
