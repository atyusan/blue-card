import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CashReportsService } from './cash-reports.service';
import {
  CashReportFiltersDto,
  CashReportResponseDto,
} from './dto/cash-report-filters.dto';

@ApiTags('Cash Reports')
@Controller('cash-reports')
@UseGuards(JwtAuthGuard)
export class CashReportsController {
  constructor(private readonly cashReportsService: CashReportsService) {}

  @Get('cash-flow')
  @ApiOperation({ summary: 'Generate cash flow report' })
  @ApiResponse({
    status: 200,
    description: 'Cash flow report generated successfully',
    type: CashReportResponseDto,
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'department', required: false, type: String })
  @ApiQuery({ name: 'transactionType', required: false, type: String })
  @ApiQuery({ name: 'paymentMethod', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async generateCashFlowReport(
    @Query() filters: CashReportFiltersDto,
  ): Promise<CashReportResponseDto> {
    return this.cashReportsService.generateCashReport(filters);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Generate invoice report' })
  @ApiResponse({
    status: 200,
    description: 'Invoice report generated successfully',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'department', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async generateInvoiceReport(@Query() filters: CashReportFiltersDto) {
    return this.cashReportsService.generateInvoiceReport(filters);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Generate payment report' })
  @ApiResponse({
    status: 200,
    description: 'Payment report generated successfully',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'department', required: false, type: String })
  @ApiQuery({ name: 'paymentMethod', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async generatePaymentReport(@Query() filters: CashReportFiltersDto) {
    return this.cashReportsService.generatePaymentReport(filters);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Generate financial summary report' })
  @ApiResponse({
    status: 200,
    description: 'Financial summary report generated successfully',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'department', required: false, type: String })
  async generateSummaryReport(@Query() filters: CashReportFiltersDto) {
    const [cashReport, invoiceReport, paymentReport] = await Promise.all([
      this.cashReportsService.generateCashReport(filters),
      this.cashReportsService.generateInvoiceReport(filters),
      this.cashReportsService.generatePaymentReport(filters),
    ]);

    return {
      cashFlow: cashReport,
      invoices: invoiceReport,
      payments: paymentReport,
      summary: {
        totalRevenue: cashReport.totalRevenue,
        totalExpenses: cashReport.totalExpenses,
        netCashFlow: cashReport.netCashFlow,
        totalInvoices: invoiceReport.totalInvoices,
        totalPayments: paymentReport.totalPayments,
        totalRefunds: paymentReport.totalRefunds,
      },
    };
  }
}
