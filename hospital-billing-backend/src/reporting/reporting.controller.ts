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
import { ReportingService } from './reporting.service';

@ApiTags('Reporting & Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  // Revenue Reports
  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report for a date range' })
  @ApiResponse({
    status: 200,
    description: 'Revenue report with detailed breakdown',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for report (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for report (YYYY-MM-DD)',
  })
  getRevenueReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getRevenueReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Department Performance Reports
  @Get('department-performance')
  @ApiOperation({
    summary: 'Get department performance report for a date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Department performance report with rankings',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for report (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for report (YYYY-MM-DD)',
  })
  getDepartmentPerformanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getDepartmentPerformanceReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Patient Analytics
  @Get('patient-analytics')
  @ApiOperation({ summary: 'Get patient analytics for a date range' })
  @ApiResponse({
    status: 200,
    description: 'Patient analytics with metrics and rankings',
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
  getPatientAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getPatientAnalytics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Service Performance Reports
  @Get('service-performance')
  @ApiOperation({ summary: 'Get service performance report for a date range' })
  @ApiResponse({
    status: 200,
    description: 'Service performance report with utilization metrics',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for report (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for report (YYYY-MM-DD)',
  })
  getServicePerformanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getServicePerformanceReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Financial Health Dashboard
  @Get('financial-health')
  @ApiOperation({ summary: 'Get financial health dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Financial health dashboard with current metrics',
  })
  getFinancialHealthDashboard() {
    return this.reportingService.getFinancialHealthDashboard();
  }

  // Custom Reports
  @Get('custom/:reportType')
  @ApiOperation({ summary: 'Get custom report by type for a date range' })
  @ApiResponse({
    status: 200,
    description: 'Custom report based on specified type',
  })
  @ApiResponse({
    status: 404,
    description: 'Report type not found',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for report (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for report (YYYY-MM-DD)',
  })
  getCustomReport(
    @Param('reportType') reportType: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getCustomReport(
      new Date(startDate),
      new Date(endDate),
      reportType,
    );
  }

  // Quick Reports (Last 30 days, 90 days, 1 year)
  @Get('quick/last-30-days')
  @ApiOperation({ summary: 'Get comprehensive report for last 30 days' })
  @ApiResponse({
    status: 200,
    description: '30-day comprehensive report',
  })
  getLast30DaysReport() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return this.reportingService.getCustomReport(
      startDate,
      endDate,
      'comprehensive',
    );
  }

  @Get('quick/last-90-days')
  @ApiOperation({ summary: 'Get comprehensive report for last 90 days' })
  @ApiResponse({
    status: 200,
    description: '90-day comprehensive report',
  })
  getLast90DaysReport() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    return this.reportingService.getCustomReport(
      startDate,
      endDate,
      'comprehensive',
    );
  }

  @Get('quick/last-year')
  @ApiOperation({ summary: 'Get comprehensive report for last year' })
  @ApiResponse({
    status: 200,
    description: '1-year comprehensive report',
  })
  getLastYearReport() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    return this.reportingService.getCustomReport(
      startDate,
      endDate,
      'comprehensive',
    );
  }

  // Current Month/Year Reports
  @Get('current/month')
  @ApiOperation({ summary: 'Get current month revenue report' })
  @ApiResponse({
    status: 200,
    description: 'Current month revenue report',
  })
  getCurrentMonthReport() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return this.reportingService.getRevenueReport(startOfMonth, today);
  }

  @Get('current/year')
  @ApiOperation({ summary: 'Get current year revenue report' })
  @ApiResponse({
    status: 200,
    description: 'Current year revenue report',
  })
  getCurrentYearReport() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    return this.reportingService.getRevenueReport(startOfYear, today);
  }

  // Comparative Reports
  @Get('comparative/month-over-month')
  @ApiOperation({ summary: 'Get month-over-month comparison report' })
  @ApiResponse({
    status: 200,
    description: 'Month-over-month comparison report',
  })
  @ApiQuery({
    name: 'baseMonth',
    required: true,
    description: 'Base month for comparison (YYYY-MM)',
  })
  getMonthOverMonthComparison(@Query('baseMonth') baseMonth: string) {
    const [year, month] = baseMonth.split('-').map(Number);
    const baseStart = new Date(year, month - 1, 1);
    const baseEnd = new Date(year, month, 0);

    const previousStart = new Date(year, month - 2, 1);
    const previousEnd = new Date(year, month - 1, 0);

    return Promise.all([
      this.reportingService.getRevenueReport(baseStart, baseEnd),
      this.reportingService.getRevenueReport(previousStart, previousEnd),
    ]).then(([current, previous]) => ({
      current,
      previous,
      comparison: {
        revenueChange:
          previous.summary.totalCollected > 0
            ? ((current.summary.totalCollected -
                previous.summary.totalCollected) /
                previous.summary.totalCollected) *
              100
            : 0,
        invoiceChange:
          previous.metrics.totalInvoices > 0
            ? ((current.metrics.totalInvoices -
                previous.metrics.totalInvoices) /
                previous.metrics.totalInvoices) *
              100
            : 0,
        collectionRateChange:
          current.summary.collectionRate - previous.summary.collectionRate,
      },
    }));
  }

  @Get('comparative/year-over-year')
  @ApiOperation({ summary: 'Get year-over-year comparison report' })
  @ApiResponse({
    status: 200,
    description: 'Year-over-year comparison report',
  })
  @ApiQuery({
    name: 'baseYear',
    required: true,
    description: 'Base year for comparison (YYYY)',
  })
  getYearOverYearComparison(@Query('baseYear') baseYear: string) {
    const year = parseInt(baseYear);
    const currentStart = new Date(year, 0, 1);
    const currentEnd = new Date(year, 11, 31);

    const previousStart = new Date(year - 1, 0, 1);
    const previousEnd = new Date(year - 1, 11, 31);

    return Promise.all([
      this.reportingService.getRevenueReport(currentStart, currentEnd),
      this.reportingService.getRevenueReport(previousStart, previousEnd),
    ]).then(([current, previous]) => ({
      current,
      previous,
      comparison: {
        revenueChange:
          previous.summary.totalCollected > 0
            ? ((current.summary.totalCollected -
                previous.summary.totalCollected) /
                previous.summary.totalCollected) *
              100
            : 0,
        invoiceChange:
          previous.metrics.totalInvoices > 0
            ? ((current.metrics.totalInvoices -
                previous.metrics.totalInvoices) /
                previous.metrics.totalInvoices) *
              100
            : 0,
        collectionRateChange:
          current.summary.collectionRate - previous.summary.collectionRate,
      },
    }));
  }

  // Enhanced Cross-Module Integration Reports
  @Get('cross-module-integration')
  @ApiOperation({
    summary: 'Get cross-module integration report across all hospital services',
  })
  @ApiResponse({
    status: 200,
    description: 'Cross-module integration report with unified metrics',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for report (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for report (YYYY-MM-DD)',
  })
  getCrossModuleIntegrationReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getCrossModuleIntegrationReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Payment Analytics and Trends
  @Get('payment-analytics')
  @ApiOperation({
    summary: 'Get comprehensive payment analytics and trends report',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment analytics report with method breakdowns and trends',
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
  getPaymentAnalyticsReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getPaymentAnalyticsReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Service Utilization and Efficiency
  @Get('service-utilization')
  @ApiOperation({ summary: 'Get service utilization and efficiency report' })
  @ApiResponse({
    status: 200,
    description: 'Service utilization report with efficiency metrics',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for utilization report (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for utilization report (YYYY-MM-DD)',
  })
  getServiceUtilizationReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getServiceUtilizationReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Financial Forecasting and Projections
  @Get('financial-forecast')
  @ApiOperation({ summary: 'Get financial forecasting and projections report' })
  @ApiResponse({
    status: 200,
    description:
      'Financial forecast report with trend analysis and projections',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    description: 'Number of months to project (default: 12)',
    type: 'number',
  })
  getFinancialForecastReport(@Query('months') months?: number) {
    return this.reportingService.getFinancialForecastReport(months || 12);
  }

  // Operational Efficiency Metrics
  @Get('operational-efficiency')
  @ApiOperation({
    summary: 'Get operational efficiency metrics and recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Operational efficiency report with performance metrics',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for efficiency report (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for efficiency report (YYYY-MM-DD)',
  })
  getOperationalEfficiencyReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getOperationalEfficiencyReport(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
