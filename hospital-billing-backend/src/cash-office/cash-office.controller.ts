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
import { CashOfficeService } from './cash-office.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto';
import { CreatePettyCashDto } from './dto/create-petty-cash.dto';

@ApiTags('Cash Office Integration')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('cash-office')
export class CashOfficeController {
  constructor(private readonly cashOfficeService: CashOfficeService) {}

  // Cash Transaction Management
  @Post('transactions')
  @ApiOperation({ summary: 'Create a new cash transaction' })
  @ApiResponse({
    status: 201,
    description: 'Cash transaction created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Cashier not found or not authorized',
  })
  createCashTransaction(
    @Body() createCashTransactionDto: CreateCashTransactionDto,
  ) {
    return this.cashOfficeService.createCashTransaction(
      createCashTransactionDto,
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get all cash transactions' })
  @ApiResponse({
    status: 200,
    description: 'List of all cash transactions',
  })
  @ApiQuery({
    name: 'cashierId',
    required: false,
    description: 'Filter by cashier ID',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    description: 'Filter by patient ID',
  })
  @ApiQuery({
    name: 'transactionType',
    required: false,
    description: 'Filter by transaction type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by transaction status',
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
    description: 'Search by patient name, patient ID, or cashier name',
  })
  findAllCashTransactions(
    @Query('cashierId') cashierId?: string,
    @Query('patientId') patientId?: string,
    @Query('transactionType') transactionType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.cashOfficeService.findAllCashTransactions({
      cashierId,
      patientId,
      transactionType,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    });
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get cash transaction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Cash transaction found with complete details',
  })
  @ApiResponse({
    status: 404,
    description: 'Cash transaction not found',
  })
  findCashTransactionById(@Param('id') id: string) {
    return this.cashOfficeService.findCashTransactionById(id);
  }

  @Patch('transactions/:id')
  @ApiOperation({ summary: 'Update cash transaction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Cash transaction updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Cash transaction not found',
  })
  updateCashTransaction(
    @Param('id') id: string,
    @Body() updateCashTransactionDto: UpdateCashTransactionDto,
  ) {
    return this.cashOfficeService.updateCashTransaction(
      id,
      updateCashTransactionDto,
    );
  }

  // Petty Cash Management
  @Post('petty-cash')
  @ApiOperation({ summary: 'Create a new petty cash request' })
  @ApiResponse({
    status: 201,
    description: 'Petty cash request created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Requester not found',
  })
  createPettyCashRequest(@Body() createPettyCashDto: CreatePettyCashDto) {
    return this.cashOfficeService.createPettyCashRequest(createPettyCashDto);
  }

  @Post('petty-cash/:id/approve')
  @ApiOperation({ summary: 'Approve a petty cash request' })
  @ApiResponse({
    status: 200,
    description: 'Petty cash request approved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Petty cash request or approver not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Petty cash request is not in pending status',
  })
  approvePettyCashRequest(
    @Param('id') id: string,
    @Body() body: { approverId: string },
  ) {
    return this.cashOfficeService.approvePettyCashRequest(id, body.approverId);
  }

  @Post('petty-cash/:id/reject')
  @ApiOperation({ summary: 'Reject a petty cash request' })
  @ApiResponse({
    status: 200,
    description: 'Petty cash request rejected successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Petty cash request or approver not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Petty cash request is not in pending status',
  })
  rejectPettyCashRequest(
    @Param('id') id: string,
    @Body() body: { approverId: string; rejectionReason: string },
  ) {
    return this.cashOfficeService.rejectPettyCashRequest(
      id,
      body.approverId,
      body.rejectionReason,
    );
  }

  @Get('petty-cash/pending')
  @ApiOperation({ summary: 'Get all pending petty cash requests' })
  @ApiResponse({
    status: 200,
    description: 'List of pending petty cash requests',
  })
  getPendingPettyCashRequests() {
    return this.cashOfficeService.getPendingPettyCashRequests();
  }

  @Get('petty-cash/history')
  @ApiOperation({ summary: 'Get petty cash history' })
  @ApiResponse({
    status: 200,
    description: 'Petty cash history',
  })
  @ApiQuery({
    name: 'requesterId',
    required: false,
    description: 'Filter by requester ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
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
  getPettyCashHistory(
    @Query('requesterId') requesterId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cashOfficeService.getPettyCashHistory({
      requesterId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  // Daily Cash Reconciliation
  @Get('reconciliation/daily/:date')
  @ApiOperation({ summary: 'Get daily cash reconciliation' })
  @ApiResponse({
    status: 200,
    description: 'Daily cash reconciliation report',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date to get reconciliation for (YYYY-MM-DD)',
  })
  getDailyCashReconciliation(@Query('date') date: string) {
    return this.cashOfficeService.getDailyCashReconciliation(new Date(date));
  }

  // Cash Office Reports
  @Get('statistics')
  @ApiOperation({ summary: 'Get cash office statistics for a date range' })
  @ApiResponse({
    status: 200,
    description: 'Cash office statistics',
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
  getCashOfficeStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.cashOfficeService.getCashOfficeStatistics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('cashier/:cashierId/shift-report/:date')
  @ApiOperation({ summary: 'Get cashier shift report for a specific date' })
  @ApiResponse({
    status: 200,
    description: 'Cashier shift report',
  })
  @ApiResponse({
    status: 404,
    description: 'Cashier not found',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date to get shift report for (YYYY-MM-DD)',
  })
  getCashierShiftReport(
    @Param('cashierId') cashierId: string,
    @Query('date') date: string,
  ) {
    return this.cashOfficeService.getCashierShiftReport(
      cashierId,
      new Date(date),
    );
  }

  // Payment Processing Integration Endpoints
  @Post('invoices/:id/payments')
  @ApiOperation({ summary: 'Process payment for an invoice via cash office' })
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
  processInvoicePayment(
    @Param('id') invoiceId: string,
    @Body()
    paymentData: {
      amount: number;
      cashierId: string;
      paymentMethod: string;
      reference?: string;
      notes?: string;
    },
  ) {
    return this.cashOfficeService.processInvoicePayment(invoiceId, paymentData);
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
  getPaymentStatusForService(@Param('id') invoiceId: string) {
    return this.cashOfficeService.getPaymentStatusForService(invoiceId);
  }

  @Get('invoices/:id/payment-history')
  @ApiOperation({ summary: 'Get comprehensive payment history for an invoice' })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  getInvoicePaymentHistory(@Param('id') invoiceId: string) {
    return this.cashOfficeService.getInvoicePaymentHistory(invoiceId);
  }

  @Get('reconciliation/enhanced/:date')
  @ApiOperation({
    summary: 'Get enhanced daily cash reconciliation with invoice payments',
  })
  @ApiResponse({
    status: 200,
    description: 'Enhanced reconciliation retrieved successfully',
  })
  getEnhancedDailyCashReconciliation(@Param('date') date: string) {
    return this.cashOfficeService.getEnhancedDailyCashReconciliation(
      new Date(date),
    );
  }

  @Get('financial-summary')
  @ApiOperation({
    summary:
      'Get comprehensive cash office financial summary with invoice integration',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial summary retrieved successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for summary (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for summary (YYYY-MM-DD)',
  })
  getCashOfficeFinancialSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.cashOfficeService.getCashOfficeFinancialSummary(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
