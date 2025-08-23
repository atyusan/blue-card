import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import {
  DashboardDataDto,
  DashboardStatsDto,
  RecentActivityDto,
  ChartDataDto,
  TopServiceDto,
} from './dto';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get complete dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    type: DashboardDataDto,
  })
  async getDashboardData(): Promise<DashboardDataDto> {
    return this.dashboardService.getDashboardData();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getDashboardStats();
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of activities to return',
    type: 'number',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent activities retrieved successfully',
    type: [RecentActivityDto],
  })
  async getRecentActivities(
    @Query('limit') limit: number = 10,
  ): Promise<RecentActivityDto[]> {
    return this.dashboardService.getRecentActivities(limit);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get revenue chart data' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period for the chart',
    enum: ['week', 'month', 'quarter', 'year'],
    example: 'month',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue chart data retrieved successfully',
    type: ChartDataDto,
  })
  async getRevenueChart(
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ): Promise<ChartDataDto> {
    return this.dashboardService.getRevenueChart(period);
  }

  @Get('appointment-chart')
  @ApiOperation({ summary: 'Get appointment chart data' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period for the chart',
    enum: ['week', 'month', 'quarter'],
    example: 'month',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointment chart data retrieved successfully',
    type: ChartDataDto,
  })
  async getAppointmentChart(
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month',
  ): Promise<ChartDataDto> {
    return this.dashboardService.getAppointmentChart(period);
  }

  @Get('top-services')
  @ApiOperation({ summary: 'Get top services' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of services to return',
    type: 'number',
    example: 5,
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period for the data',
    enum: ['week', 'month', 'quarter'],
    example: 'month',
  })
  @ApiResponse({
    status: 200,
    description: 'Top services retrieved successfully',
    type: [TopServiceDto],
  })
  async getTopServices(
    @Query('limit') limit: number = 5,
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month',
  ): Promise<TopServiceDto[]> {
    return this.dashboardService.getTopServices(limit, period);
  }

  @Get('upcoming-appointments')
  @ApiOperation({ summary: 'Get upcoming appointments' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of appointments to return',
    type: 'number',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming appointments retrieved successfully',
  })
  async getUpcomingAppointments(
    @Query('limit') limit: number = 5,
  ): Promise<any[]> {
    return this.dashboardService.getUpcomingAppointments(limit);
  }

  @Get('overdue-invoices')
  @ApiOperation({ summary: 'Get overdue invoices' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of invoices to return',
    type: 'number',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Overdue invoices retrieved successfully',
  })
  async getOverdueInvoices(@Query('limit') limit: number = 5): Promise<any[]> {
    return this.dashboardService.getOverdueInvoices(limit);
  }

  @Get('patient-demographics')
  @ApiOperation({ summary: 'Get patient demographics' })
  @ApiResponse({
    status: 200,
    description: 'Patient demographics retrieved successfully',
  })
  async getPatientDemographics(): Promise<any> {
    return this.dashboardService.getPatientDemographics();
  }

  @Get('financial-summary')
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period for the summary',
    enum: ['week', 'month', 'quarter', 'year'],
    example: 'month',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial summary retrieved successfully',
  })
  async getFinancialSummary(
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ): Promise<any> {
    return this.dashboardService.getFinancialSummary(period);
  }

  @Get('appointment-summary')
  @ApiOperation({ summary: 'Get appointment summary' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period for the summary',
    enum: ['week', 'month', 'quarter'],
    example: 'month',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointment summary retrieved successfully',
  })
  async getAppointmentSummary(
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month',
  ): Promise<any> {
    return this.dashboardService.getAppointmentSummary(period);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get system alerts' })
  @ApiResponse({
    status: 200,
    description: 'System alerts retrieved successfully',
  })
  async getAlerts(): Promise<any[]> {
    return this.dashboardService.getAlerts();
  }

  @Post('alerts/:alertId/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  @ApiParam({
    name: 'alertId',
    description: 'Alert ID to mark as read',
  })
  @ApiResponse({
    status: 200,
    description: 'Alert marked as read successfully',
  })
  async markAlertAsRead(@Param('alertId') alertId: string): Promise<void> {
    return this.dashboardService.markAlertAsRead(alertId);
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({
    status: 200,
    description: 'System health status retrieved successfully',
  })
  async getSystemHealth(): Promise<any> {
    return this.dashboardService.getSystemHealth();
  }

  @Get('export')
  @ApiOperation({ summary: 'Export dashboard report' })
  @ApiQuery({
    name: 'format',
    required: true,
    description: 'Export format',
    enum: ['pdf', 'excel'],
    example: 'pdf',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard report exported successfully',
  })
  async exportDashboardReport(
    @Query('format') format: 'pdf' | 'excel',
    @Res() res: Response,
  ): Promise<void> {
    const reportBuffer =
      await this.dashboardService.exportDashboardReport(format);

    const contentType =
      format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const filename = `dashboard-report-${new Date().toISOString().split('T')[0]}.${format}`;

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': reportBuffer.length.toString(),
    });

    res.status(HttpStatus.OK).send(reportBuffer);
  }
}
