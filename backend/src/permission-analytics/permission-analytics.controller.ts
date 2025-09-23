import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PermissionAnalyticsService } from './permission-analytics.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Permission Analytics')
@Controller('permission-analytics')
@UseGuards(PermissionsGuard)
export class PermissionAnalyticsController {
  constructor(
    private readonly permissionAnalyticsService: PermissionAnalyticsService,
  ) {}

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get permission usage analytics for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'User permission analytics retrieved successfully',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze (default: 30)',
    type: Number,
  })
  @RequirePermissions(['view_permission_analytics'])
  getUserPermissionUsage(
    @Param('userId') userId: string,
    @Query('days') days?: number,
  ) {
    return this.permissionAnalyticsService.getUserPermissionUsage(
      userId,
      days || 30,
    );
  }

  @Get('system-usage')
  @ApiOperation({
    summary: 'Get permission usage analytics across the entire system',
  })
  @ApiResponse({
    status: 200,
    description: 'System permission analytics retrieved successfully',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze (default: 30)',
    type: Number,
  })
  @RequirePermissions(['view_permission_analytics'])
  getSystemPermissionUsage(@Query('days') days?: number) {
    return this.permissionAnalyticsService.getPermissionUsageAcrossSystem(
      days || 30,
    );
  }

  @Get('department-distribution')
  @ApiOperation({ summary: 'Get permission distribution across departments' })
  @ApiResponse({
    status: 200,
    description: 'Department permission distribution retrieved successfully',
  })
  @RequirePermissions(['view_permission_analytics'])
  getDepartmentPermissionDistribution() {
    return this.permissionAnalyticsService.getDepartmentPermissionDistribution();
  }

  @Get('risk-assessment')
  @ApiOperation({ summary: 'Get risk assessment for all permissions' })
  @ApiResponse({
    status: 200,
    description: 'Permission risk assessment retrieved successfully',
  })
  @RequirePermissions(['view_permission_analytics'])
  getPermissionRiskAssessment() {
    return this.permissionAnalyticsService.getPermissionRiskAssessment();
  }

  @Get('optimization-suggestions')
  @ApiOperation({ summary: 'Get permission optimization suggestions' })
  @ApiResponse({
    status: 200,
    description: 'Optimization suggestions retrieved successfully',
  })
  @RequirePermissions(['view_permission_analytics'])
  getOptimizationSuggestions() {
    return this.permissionAnalyticsService.getPermissionOptimizationSuggestions();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive permission analytics dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Analytics dashboard data retrieved successfully',
  })
  @RequirePermissions(['view_permission_analytics'])
  async getAnalyticsDashboard() {
    const [
      systemUsage,
      departmentDistribution,
      riskAssessment,
      optimizationSuggestions,
    ] = await Promise.all([
      this.permissionAnalyticsService.getPermissionUsageAcrossSystem(30),
      this.permissionAnalyticsService.getDepartmentPermissionDistribution(),
      this.permissionAnalyticsService.getPermissionRiskAssessment(),
      this.permissionAnalyticsService.getPermissionOptimizationSuggestions(),
    ]);

    return {
      systemUsage,
      departmentDistribution,
      riskAssessment,
      optimizationSuggestions,
      summary: {
        totalPermissions: systemUsage.totalPermissions,
        totalUsage: systemUsage.totalUsage,
        departmentsAnalyzed: departmentDistribution.length,
        highRiskPermissions: riskAssessment.filter(
          (r) => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL',
        ).length,
        suggestionsCount: optimizationSuggestions.length,
      },
    };
  }
}
