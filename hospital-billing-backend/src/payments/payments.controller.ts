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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';

@ApiTags('Payment Processing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Payment Management
  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({
    status: 201,
    description: 'Payment created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Payment amount exceeds remaining balance',
  })
  createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({
    status: 200,
    description: 'List of all payments',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    description: 'Filter by patient ID',
  })
  @ApiQuery({
    name: 'invoiceId',
    required: false,
    description: 'Filter by invoice ID',
  })
  @ApiQuery({
    name: 'paymentMethod',
    required: false,
    description: 'Filter by payment method',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by payment status',
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
    description: 'Search by patient name, patient ID, or invoice number',
  })
  findAllPayments(
    @Query('patientId') patientId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.paymentsService.findAllPayments({
      patientId,
      invoiceId,
      paymentMethod,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment found with complete details',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  findPaymentById(@Param('id') id: string) {
    return this.paymentsService.findPaymentById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  updatePayment(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.updatePayment(id, updatePaymentDto);
  }

  // Refund Management
  @Post('refunds')
  @ApiOperation({ summary: 'Create a new refund request' })
  @ApiResponse({
    status: 201,
    description: 'Refund request created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot refund this payment',
  })
  createRefund(@Body() createRefundDto: CreateRefundDto) {
    return this.paymentsService.createRefund(createRefundDto);
  }

  @Post('refunds/:refundId/approve')
  @ApiOperation({ summary: 'Approve a refund request' })
  @ApiResponse({
    status: 200,
    description: 'Refund approved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Refund not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Refund is not in pending status',
  })
  approveRefund(
    @Param('refundId') refundId: string,
    @Body() body: { approvedBy: string },
  ) {
    return this.paymentsService.approveRefund(refundId, body.approvedBy);
  }

  @Post('refunds/:refundId/reject')
  @ApiOperation({ summary: 'Reject a refund request' })
  @ApiResponse({
    status: 200,
    description: 'Refund rejected successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Refund not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Refund is not in pending status',
  })
  rejectRefund(
    @Param('refundId') refundId: string,
    @Body() body: { rejectedBy: string; rejectionReason: string },
  ) {
    return this.paymentsService.rejectRefund(
      refundId,
      body.rejectedBy,
      body.rejectionReason,
    );
  }

  // Payment Methods and Financial Management
  @Get('methods')
  @ApiOperation({ summary: 'Get available payment methods' })
  @ApiResponse({
    status: 200,
    description: 'List of available payment methods',
  })
  getPaymentMethods() {
    return this.paymentsService.getPaymentMethods();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get payment statistics for a date range' })
  @ApiResponse({
    status: 200,
    description: 'Payment statistics',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for statistics (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for statistics (YYYY-MM-DD)',
  })
  getPaymentStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.paymentsService.getPaymentStatistics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('patient/:patientId/history')
  @ApiOperation({ summary: 'Get patient payment history' })
  @ApiResponse({
    status: 200,
    description: 'Patient payment history',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  getPatientPaymentHistory(@Param('patientId') patientId: string) {
    return this.paymentsService.getPatientPaymentHistory(patientId);
  }

  @Get('invoice/:invoiceId/status')
  @ApiOperation({ summary: 'Get invoice payment status' })
  @ApiResponse({
    status: 200,
    description: 'Invoice payment status',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  getInvoicePaymentStatus(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.getInvoicePaymentStatus(invoiceId);
  }

  @Get('daily-summary/:date')
  @ApiOperation({ summary: 'Get daily payment summary' })
  @ApiResponse({
    status: 200,
    description: 'Daily payment summary',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date to get summary for (YYYY-MM-DD)',
  })
  getDailyPaymentSummary(@Query('date') date: string) {
    return this.paymentsService.getDailyPaymentSummary(new Date(date));
  }

  // Enhanced Payment Verification and Analytics Endpoints
  @Get('verify/:invoiceId')
  @ApiOperation({ summary: 'Verify payment status before service provision' })
  @ApiResponse({
    status: 200,
    description: 'Payment verification completed',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  verifyPaymentBeforeService(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.verifyPaymentBeforeService(invoiceId);
  }

  @Get('methods-breakdown')
  @ApiOperation({
    summary: 'Get payment methods breakdown with detailed analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment methods breakdown retrieved successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for analysis (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for analysis (YYYY-MM-DD)',
  })
  getPaymentMethodsBreakdown(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.paymentsService.getPaymentMethodsBreakdown(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('reconciliation-report')
  @ApiOperation({ summary: 'Get comprehensive payment reconciliation report' })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation report retrieved successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for reconciliation (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for reconciliation (YYYY-MM-DD)',
  })
  getPaymentReconciliationReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.paymentsService.getPaymentReconciliationReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get comprehensive payment analytics with service breakdown',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment analytics retrieved successfully',
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
  getPaymentAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.paymentsService.getPaymentAnalytics(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
