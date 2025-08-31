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
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationTemplateDto } from './dto/notification-template.dto';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ===== NOTIFICATION TEMPLATE MANAGEMENT =====

  @Post('templates')
  @ApiOperation({ summary: 'Create a new notification template' })
  @ApiResponse({
    status: 201,
    description: 'Notification template created successfully',
  })
  createNotificationTemplate(@Body() templateDto: NotificationTemplateDto) {
    return this.notificationsService.createNotificationTemplate(templateDto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all notification templates' })
  @ApiResponse({
    status: 200,
    description: 'List of notification templates',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by notification type',
  })
  @ApiQuery({
    name: 'channel',
    required: false,
    description: 'Filter by notification channel',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  getNotificationTemplates(
    @Query('type') type?: string,
    @Query('channel') channel?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.notificationsService.getNotificationTemplates({
      type,
      channel,
      isActive: isActive === undefined ? undefined : isActive === true,
    });
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update a notification template' })
  @ApiResponse({
    status: 200,
    description: 'Notification template updated successfully',
  })
  updateNotificationTemplate(
    @Param('id') id: string,
    @Body() updateDto: Partial<NotificationTemplateDto>,
  ) {
    return this.notificationsService.updateNotificationTemplate(id, updateDto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a notification template' })
  @ApiResponse({
    status: 200,
    description: 'Notification template deleted successfully',
  })
  deleteNotificationTemplate(@Param('id') id: string) {
    return this.notificationsService.deleteNotificationTemplate(id);
  }

  // ===== NOTIFICATION CREATION AND SENDING =====

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
  })
  createNotification(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(createDto);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a template-based notification' })
  @ApiResponse({
    status: 201,
    description: 'Template notification sent successfully',
  })
  sendTemplateNotification(@Body() sendDto: SendNotificationDto) {
    return this.notificationsService.sendTemplateNotification(sendDto);
  }

  @Post('send/:id')
  @ApiOperation({ summary: 'Send a specific notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully',
  })
  sendNotification(@Param('id') id: string) {
    return this.notificationsService.sendNotification(id);
  }

  // ===== APPOINTMENT-SPECIFIC NOTIFICATIONS =====

  @Post('appointments/:appointmentId/confirmation')
  @ApiOperation({ summary: 'Send appointment confirmation notifications' })
  @ApiResponse({
    status: 200,
    description: 'Appointment confirmation notifications sent',
  })
  sendAppointmentConfirmation(@Param('appointmentId') appointmentId: string) {
    return this.notificationsService.sendAppointmentConfirmation(appointmentId);
  }

  @Post('appointments/:appointmentId/reminder/:reminderType')
  @ApiOperation({ summary: 'Send appointment reminder notification' })
  @ApiResponse({
    status: 200,
    description: 'Appointment reminder notification sent',
  })
  sendAppointmentReminder(
    @Param('appointmentId') appointmentId: string,
    @Param('reminderType') reminderType: '24HR' | '2HR' | '1HR',
  ) {
    return this.notificationsService.sendAppointmentReminder(
      appointmentId,
      reminderType,
    );
  }

  @Post('appointments/:appointmentId/payment-reminder')
  @ApiOperation({ summary: 'Send payment reminder notification' })
  @ApiResponse({
    status: 200,
    description: 'Payment reminder notification sent',
  })
  sendPaymentReminder(@Param('appointmentId') appointmentId: string) {
    return this.notificationsService.sendPaymentReminder(appointmentId);
  }

  // ===== NOTIFICATION MANAGEMENT =====

  @Get()
  @ApiOperation({ summary: 'Get all notifications with filtering' })
  @ApiResponse({
    status: 200,
    description: 'List of notifications with pagination',
  })
  @ApiQuery({
    name: 'recipientId',
    required: false,
    description: 'Filter by recipient ID',
  })
  @ApiQuery({
    name: 'recipientType',
    required: false,
    description: 'Filter by recipient type',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by notification type',
  })
  @ApiQuery({
    name: 'channel',
    required: false,
    description: 'Filter by notification channel',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by notification status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by end date (YYYY-MM-DD)',
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
  getNotifications(
    @Query('recipientId') recipientId?: string,
    @Query('recipientType') recipientType?: string,
    @Query('type') type?: string,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.getNotifications({
      recipientId,
      recipientType,
      type,
      channel,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification found with complete details',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  getNotification(@Param('id') id: string) {
    // This would need to be implemented in the service
    return this.notificationsService.getNotifications({
      recipientId: id,
      limit: 1,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
  })
  updateNotification(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.updateNotification(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  deleteNotification(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }

  // ===== BULK NOTIFICATION OPERATIONS =====

  @Post('bulk')
  @ApiOperation({ summary: 'Send bulk notifications to multiple recipients' })
  @ApiResponse({
    status: 200,
    description: 'Bulk notifications processed',
  })
  sendBulkNotifications(
    @Body() bulkDto: SendNotificationDto & { recipientIds: string[] },
  ) {
    return this.notificationsService.sendBulkNotifications(bulkDto);
  }

  // ===== SCHEDULED NOTIFICATION PROCESSING =====

  @Post('process-scheduled')
  @ApiOperation({ summary: 'Process all scheduled notifications' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled notifications processed',
  })
  processScheduledNotifications() {
    return this.notificationsService.processScheduledNotifications();
  }

  // ===== ENHANCED MANUAL CONTROL ENDPOINTS =====

  @Post('process-appointment-reminders')
  @ApiOperation({ summary: 'Manually process appointment reminders' })
  @ApiResponse({
    status: 200,
    description: 'Appointment reminders processed',
  })
  processAppointmentReminders() {
    return this.notificationsService.processAppointmentReminders();
  }

  @Post('cleanup-old-notifications')
  @ApiOperation({ summary: 'Manually cleanup old notifications' })
  @ApiResponse({
    status: 200,
    description: 'Old notifications cleaned up',
  })
  cleanupOldNotifications() {
    return this.notificationsService.cleanupOldNotifications();
  }

  @Post('generate-daily-report')
  @ApiOperation({ summary: 'Manually generate daily notification report' })
  @ApiResponse({
    status: 200,
    description: 'Daily report generated',
  })
  generateDailyReport() {
    return this.notificationsService.generateDailyNotificationReport();
  }

  @Post('test-notification/:channel')
  @ApiOperation({
    summary: 'Test notification delivery for a specific channel',
  })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent',
  })
  @ApiQuery({
    name: 'recipientId',
    required: true,
    description: 'Test recipient ID',
  })
  @ApiQuery({
    name: 'recipientType',
    required: true,
    description: 'Test recipient type (PATIENT, STAFF, etc.)',
  })
  async testNotification(
    @Param('channel') channel: string,
    @Query('recipientId') recipientId: string,
    @Query('recipientType') recipientType: string,
  ) {
    const testNotification = await this.notificationsService.createNotification(
      {
        type: 'SYSTEM_TEST',
        channel: channel as any,
        recipientId,
        recipientType,
        subject: 'Test Notification',
        content: `This is a test notification sent via ${channel} at ${new Date().toISOString()}`,
        priority: 'NORMAL',
      },
    );

    return {
      message: 'Test notification created and sent',
      notification: testNotification,
      channel,
      recipientId,
      recipientType,
    };
  }

  @Get('cron-status')
  @ApiOperation({ summary: 'Get cron job status and health metrics' })
  @ApiResponse({
    status: 200,
    description: 'Cron job status and health metrics',
  })
  async getCronStatus() {
    const [pendingCount, failedCount, totalCount] = await Promise.all([
      this.notificationsService.getNotifications({
        status: 'PENDING',
        limit: 1,
      }),
      this.notificationsService.getNotifications({
        status: 'FAILED',
        limit: 1,
      }),
      this.notificationsService.getNotifications({ limit: 1 }),
    ]);

    return {
      timestamp: new Date().toISOString(),
      health: {
        pending: pendingCount.total,
        failed: failedCount.total,
        total: totalCount.total,
        status:
          pendingCount.total > 1000 || failedCount.total > 100
            ? 'WARNING'
            : 'HEALTHY',
      },
      cronJobs: {
        scheduledNotifications: 'EVERY_MINUTE',
        appointmentReminders: 'EVERY_15_MINUTES',
        dailyMaintenance: 'EVERY_DAY_AT_MIDNIGHT',
        healthCheck: 'EVERY_5_MINUTES',
      },
      lastRun: {
        scheduledNotifications: 'Auto-run every minute',
        appointmentReminders: 'Auto-run every 15 minutes',
        dailyMaintenance: 'Auto-run daily at midnight',
        healthCheck: 'Auto-run every 5 minutes',
      },
    };
  }

  // ===== NOTIFICATION STATISTICS =====

  @Get('statistics/summary')
  @ApiOperation({ summary: 'Get notification statistics for a date range' })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics with breakdowns',
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
  getNotificationStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.notificationsService.getNotificationStatistics(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
