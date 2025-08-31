import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationTemplateDto } from './dto/notification-template.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  // ===== CRON JOB SCHEDULING =====

  // Process scheduled notifications every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotificationsCron() {
    this.logger.log('🕐 Running scheduled notifications cron job...');
    try {
      const result = await this.processScheduledNotifications();
      if (result.processed > 0) {
        this.logger.log(
          `✅ Cron job processed ${result.processed} scheduled notifications`,
        );
      }
    } catch (error) {
      this.logger.error(
        '❌ Cron job failed to process scheduled notifications:',
        error,
      );
    }
  }

  // Process appointment reminders every 15 minutes
  @Cron('*/15 * * * *')
  async processAppointmentRemindersCron() {
    this.logger.log('🕐 Running appointment reminders cron job...');
    try {
      const result = await this.processAppointmentReminders();
      if (result.processed > 0) {
        this.logger.log(
          `✅ Cron job processed ${result.processed} appointment reminders`,
        );
      }
    } catch (error) {
      this.logger.error(
        '❌ Cron job failed to process appointment reminders:',
        error,
      );
    }
  }

  // Daily maintenance and cleanup at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyMaintenanceCron() {
    this.logger.log('🕐 Running daily maintenance cron job...');
    try {
      await this.cleanupOldNotifications();
      await this.generateDailyNotificationReport();
      this.logger.log('✅ Daily maintenance completed successfully');
    } catch (error) {
      this.logger.error('❌ Daily maintenance cron job failed:', error);
    }
  }

  // Health check every 5 minutes
  @Cron('*/5 * * * *')
  async healthCheckCron() {
    try {
      const pendingCount = await this.prisma.notification.count({
        where: { status: 'PENDING' },
      });

      const failedCount = await this.prisma.notification.count({
        where: { status: 'FAILED' },
      });

      // Log health metrics
      if (pendingCount > 0 || failedCount > 0) {
        this.logger.log(
          `📊 Health Check - Pending: ${pendingCount}, Failed: ${failedCount}`,
        );
      }

      // Alert if too many pending or failed notifications
      if (pendingCount > 1000) {
        this.logger.warn(`⚠️ High pending notifications: ${pendingCount}`);
      }

      if (failedCount > 100) {
        this.logger.error(`🚨 High failed notifications: ${failedCount}`);
      }
    } catch (error) {
      this.logger.error('❌ Health check cron job failed:', error);
    }
  }

  // ===== NOTIFICATION TEMPLATE MANAGEMENT =====

  async createNotificationTemplate(templateDto: NotificationTemplateDto) {
    const template = await this.prisma.notificationTemplate.create({
      data: {
        name: templateDto.name,
        type: templateDto.type,
        channel: templateDto.channel,
        subject: templateDto.subject,
        content: templateDto.content,
        variables: templateDto.variables,
        isActive: templateDto.isActive ?? true,
      },
    });

    this.logger.log(`Notification template created: ${template.name}`);
    return template;
  }

  async getNotificationTemplates(query?: {
    type?: string;
    channel?: string;
    isActive?: boolean;
  }) {
    const where: any = {};
    if (query?.type) where.type = query.type;
    if (query?.channel) where.channel = query.channel;
    if (query?.isActive !== undefined) where.isActive = query.isActive;

    return await this.prisma.notificationTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateNotificationTemplate(
    id: string,
    updateDto: Partial<NotificationTemplateDto>,
  ) {
    const template = await this.prisma.notificationTemplate.update({
      where: { id },
      data: updateDto,
    });

    this.logger.log(`Notification template updated: ${template.name}`);
    return template;
  }

  async deleteNotificationTemplate(id: string) {
    await this.prisma.notificationTemplate.delete({
      where: { id },
    });

    this.logger.log(`Notification template deleted: ${id}`);
    return { message: 'Template deleted successfully' };
  }

  // ===== NOTIFICATION CREATION AND SENDING =====

  async createNotification(createDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        type: createDto.type,
        channel: createDto.channel,
        recipientId: createDto.recipientId,
        recipientType: createDto.recipientType,
        subject: createDto.subject,
        content: createDto.content,
        metadata: createDto.metadata,
        scheduledFor: createDto.scheduledFor,
        priority: createDto.priority || 'NORMAL',
        status: createDto.scheduledFor ? 'SCHEDULED' : 'PENDING',
      },
    });

    this.logger.log(`Notification created: ${notification.id}`);

    // If no scheduled time, send immediately
    if (!createDto.scheduledFor) {
      await this.sendNotification(notification.id);
    }

    return notification;
  }

  async sendNotification(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.status === 'SENT') {
      throw new BadRequestException('Notification already sent');
    }

    try {
      let deliveryResult: any;

      switch (notification.channel) {
        case 'EMAIL':
          deliveryResult = await this.sendEmailNotification(notification);
          break;
        case 'SMS':
          deliveryResult = await this.sendSMSNotification(notification);
          break;
        case 'PUSH_NOTIFICATION':
          deliveryResult = await this.sendPushNotification(notification);
          break;
        case 'IN_APP':
          deliveryResult = await this.sendInAppNotification(notification);
          break;
        default:
          throw new BadRequestException(
            `Unsupported channel: ${notification.channel}`,
          );
      }

      // Update notification status
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          deliveryDetails: deliveryResult,
        },
      });

      this.logger.log(`Notification sent successfully: ${notificationId}`);
      return { success: true, deliveryResult };
    } catch (error) {
      // Update notification status to failed
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          failureReason: error.message,
          retryCount: {
            increment: 1,
          },
        },
      });

      this.logger.error(
        `Failed to send notification: ${notificationId}`,
        error.stack,
      );
      throw error;
    }
  }

  // ===== CHANNEL-SPECIFIC SENDING METHODS =====

  private async sendEmailNotification(notification: any) {
    // Get recipient email - this would need to be implemented based on recipient type
    // For now, simulate email sending
    this.logger.log(`Sending email notification: ${notification.id}`);
    this.logger.log(`Subject: ${notification.subject}`);
    this.logger.log(`Content: ${notification.content}`);

    // Simulate email delivery
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      channel: 'EMAIL',
      recipient: 'simulated@email.com',
      messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deliveredAt: new Date(),
    };
  }

  private async sendSMSNotification(notification: any) {
    // Get recipient phone number - this would need to be implemented based on recipient type
    // For now, simulate SMS sending
    this.logger.log(`Sending SMS notification: ${notification.id}`);
    this.logger.log(`Content: ${notification.content}`);

    // Simulate SMS delivery
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      channel: 'SMS',
      recipient: '+1234567890',
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deliveredAt: new Date(),
    };
  }

  private async sendPushNotification(notification: any) {
    // TODO: Implement push notification logic
    // This would integrate with Firebase Cloud Messaging, Apple Push Notifications, etc.
    this.logger.log('Push notification not yet implemented');

    // Simulate push notification delivery
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      channel: 'PUSH_NOTIFICATION',
      recipient: notification.recipientId,
      messageId: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deliveredAt: new Date(),
    };
  }

  private async sendInAppNotification(notification: any) {
    // TODO: Implement in-app notification logic
    // This would store notifications for display in the application UI
    this.logger.log('In-app notification stored for UI display');

    // Simulate storing notification
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      channel: 'IN_APP',
      recipient: notification.recipientId,
      messageId: `inapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deliveredAt: new Date(),
    };
  }

  // ===== HELPER METHODS =====

  private extractEmail(recipient: any): string | null {
    if (recipient?.email) return recipient.email;
    if (recipient?.user?.email) return recipient.user.email;
    return null;
  }

  private extractPhoneNumber(recipient: any): string | null {
    if (recipient?.phoneNumber) return recipient.phoneNumber;
    if (recipient?.user?.phoneNumber) return recipient.user.phoneNumber;
    return null;
  }

  // ===== TEMPLATE-BASED NOTIFICATION SENDING =====

  async sendTemplateNotification(sendDto: SendNotificationDto) {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: {
        name: sendDto.templateName,
        type: sendDto.type,
        channel: sendDto.channel,
        isActive: true,
      },
    });

    if (!template) {
      throw new NotFoundException(
        `Template not found: ${sendDto.templateName}`,
      );
    }

    // Process template variables
    let processedSubject = template.subject || '';
    let processedContent = template.content;

    if (sendDto.variables) {
      Object.entries(sendDto.variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedSubject = processedSubject.replace(regex, value);
        processedContent = processedContent.replace(regex, value);
      });
    }

    // Create and send notification
    const notification = await this.createNotification({
      type: sendDto.type,
      channel: sendDto.channel,
      recipientId: sendDto.recipientId,
      recipientType: sendDto.recipientType,
      subject: processedSubject,
      content: processedContent,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        originalVariables: sendDto.variables,
      },
      scheduledFor: sendDto.scheduledFor,
      priority: sendDto.priority,
    });

    return notification;
  }

  // ===== APPOINTMENT-SPECIFIC NOTIFICATIONS =====

  async sendAppointmentConfirmation(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        slot: {
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            resource: {
              select: {
                name: true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const variables = {
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      appointmentDate: appointment.scheduledStart.toLocaleDateString(),
      appointmentTime: appointment.scheduledStart.toLocaleTimeString(),
      providerName: `${appointment.slot.provider.user.firstName} ${appointment.slot.provider.user.lastName}`,
      resourceName: appointment.slot.resource?.name || 'TBD',
      resourceLocation: appointment.slot.resource?.location || 'TBD',
      appointmentType: appointment.appointmentType,
      totalAmount: `$${Number(appointment.totalAmount).toFixed(2)}`,
    };

    // Send email confirmation
    await this.sendTemplateNotification({
      templateName: 'appointment_confirmation',
      type: 'APPOINTMENT_CONFIRMATION',
      channel: 'EMAIL',
      recipientId: appointment.patientId,
      recipientType: 'PATIENT',
      variables,
    });

    // Send SMS confirmation
    await this.sendTemplateNotification({
      templateName: 'appointment_confirmation_sms',
      type: 'APPOINTMENT_CONFIRMATION',
      channel: 'SMS',
      recipientId: appointment.patientId,
      recipientType: 'PATIENT',
      variables,
    });

    return { message: 'Appointment confirmation notifications sent' };
  }

  async sendAppointmentReminder(
    appointmentId: string,
    reminderType: '24HR' | '2HR' | '1HR',
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        slot: {
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const variables = {
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      appointmentDate: appointment.scheduledStart.toLocaleDateString(),
      appointmentTime: appointment.scheduledStart.toLocaleTimeString(),
      providerName: `${appointment.slot.provider.user.firstName} ${appointment.slot.provider.user.lastName}`,
      reminderType,
    };

    // Send reminder based on type
    const templateName = `appointment_reminder_${reminderType.toLowerCase()}`;

    await this.sendTemplateNotification({
      templateName,
      type: 'APPOINTMENT_REMINDER',
      channel: 'SMS', // SMS for reminders is more effective
      recipientId: appointment.patientId,
      recipientType: 'PATIENT',
      variables,
    });

    return { message: `${reminderType} reminder sent for appointment` };
  }

  async sendPaymentReminder(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        invoice: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.isPaid) {
      throw new BadRequestException('Appointment is already paid');
    }

    const variables = {
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      appointmentDate: appointment.scheduledStart.toLocaleDateString(),
      totalAmount: `$${Number(appointment.totalAmount).toFixed(2)}`,
      balance: `$${Number(appointment.balance).toFixed(2)}`,
      dueDate: appointment.invoice?.dueDate?.toLocaleDateString() || 'ASAP',
    };

    await this.sendTemplateNotification({
      templateName: 'payment_reminder',
      type: 'PAYMENT_REMINDER',
      channel: 'EMAIL',
      recipientId: appointment.patientId,
      recipientType: 'PATIENT',
      variables,
    });

    return { message: 'Payment reminder sent' };
  }

  // ===== NOTIFICATION MANAGEMENT =====

  async getNotifications(query?: {
    recipientId?: string;
    recipientType?: string;
    type?: string;
    channel?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      page = 1,
      limit = 20,
      recipientId,
      recipientType,
      type,
      channel,
      status,
      startDate,
      endDate,
    } = query || {};

    const where: any = {};
    if (recipientId) where.recipientId = recipientId;
    if (recipientType) where.recipientType = recipientType;
    if (type) where.type = type;
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateNotification(id: string, updateDto: UpdateNotificationDto) {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: updateDto,
    });

    this.logger.log(`Notification updated: ${id}`);
    return notification;
  }

  async deleteNotification(id: string) {
    await this.prisma.notification.delete({
      where: { id },
    });

    this.logger.log(`Notification deleted: ${id}`);
    return { message: 'Notification deleted successfully' };
  }

  // ===== BULK NOTIFICATION OPERATIONS =====

  async sendBulkNotifications(
    sendDto: SendNotificationDto & { recipientIds: string[] },
  ) {
    const results: Array<{
      recipientId: string;
      success: boolean;
      result?: any;
      error?: string;
    }> = [];

    for (const recipientId of sendDto.recipientIds) {
      try {
        const result = await this.sendTemplateNotification({
          ...sendDto,
          recipientId,
        });
        results.push({ recipientId, success: true, result });
      } catch (error) {
        results.push({ recipientId, success: false, error: error.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    this.logger.log(
      `Bulk notification completed: ${successCount} success, ${failureCount} failures`,
    );

    return {
      total: sendDto.recipientIds.length,
      successCount,
      failureCount,
      results,
    };
  }

  // ===== SCHEDULED NOTIFICATION PROCESSING =====

  async processScheduledNotifications() {
    const scheduledNotifications = await this.prisma.notification.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: new Date(),
        },
      },
    });

    this.logger.log(
      `Processing ${scheduledNotifications.length} scheduled notifications`,
    );

    const results: Array<{
      id: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const notification of scheduledNotifications) {
      try {
        await this.sendNotification(notification.id);
        results.push({ id: notification.id, success: true });
      } catch (error) {
        results.push({
          id: notification.id,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      processed: scheduledNotifications.length,
      results,
    };
  }

  // ===== APPOINTMENT REMINDER PROCESSING =====

  async processAppointmentReminders() {
    const now = new Date();

    // Get appointments needing reminders (scheduled within next 25 hours)
    const appointmentsNeedingReminders = await this.prisma.appointment.findMany(
      {
        where: {
          status: 'SCHEDULED',
          scheduledStart: {
            gte: now,
            lte: new Date(now.getTime() + 25 * 60 * 60 * 1000), // Next 25 hours
          },
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              email: true,
            },
          },
          slot: {
            include: {
              provider: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    );

    let processedCount = 0;

    for (const appointment of appointmentsNeedingReminders) {
      const timeUntilAppointment =
        appointment.scheduledStart.getTime() - now.getTime();
      const hoursUntilAppointment = timeUntilAppointment / (1000 * 60 * 60);

      try {
        // Send 24-hour reminder (between 24 and 23.5 hours)
        if (hoursUntilAppointment <= 24 && hoursUntilAppointment > 23.5) {
          await this.sendAppointmentReminder(appointment.id, '24HR');
          processedCount++;
        }

        // Send 2-hour reminder (between 2 and 1.5 hours)
        if (hoursUntilAppointment <= 2 && hoursUntilAppointment > 1.5) {
          await this.sendAppointmentReminder(appointment.id, '2HR');
          processedCount++;
        }

        // Send 1-hour reminder (between 1 and 0.5 hours)
        if (hoursUntilAppointment <= 1 && hoursUntilAppointment > 0.5) {
          await this.sendAppointmentReminder(appointment.id, '1HR');
          processedCount++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for appointment ${appointment.id}:`,
          error,
        );
      }
    }

    return {
      processed: processedCount,
      totalAppointments: appointmentsNeedingReminders.length,
    };
  }

  // ===== MAINTENANCE AND CLEANUP =====

  async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old sent/failed notifications
    const deletedCount = await this.prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
        status: {
          in: ['SENT', 'FAILED', 'CANCELLED'],
        },
      },
    });

    this.logger.log(`🧹 Cleaned up ${deletedCount.count} old notifications`);
    return deletedCount;
  }

  async generateDailyNotificationReport() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await this.getNotificationStatistics(yesterday, today);

    this.logger.log('📊 Daily Notification Report:');
    this.logger.log(`   Total: ${stats.statistics.total}`);
    this.logger.log(`   By Channel:`, stats.statistics.byChannel);
    this.logger.log(`   By Type:`, stats.statistics.byType);
    this.logger.log(`   By Status:`, stats.statistics.byStatus);

    return stats;
  }

  // ===== NOTIFICATION STATISTICS =====

  async getNotificationStatistics(startDate: Date, endDate: Date) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const stats = {
      total: notifications.length,
      byChannel: {},
      byType: {},
      byStatus: {},
      byDay: {},
    };

    notifications.forEach((notification) => {
      // Channel statistics
      if (!stats.byChannel[notification.channel]) {
        stats.byChannel[notification.channel] = 0;
      }
      stats.byChannel[notification.channel]++;

      // Type statistics
      if (!stats.byType[notification.type]) {
        stats.byType[notification.type] = 0;
      }
      stats.byType[notification.type]++;

      // Status statistics
      if (!stats.byStatus[notification.status]) {
        stats.byStatus[notification.status] = 0;
      }
      stats.byStatus[notification.status]++;

      // Daily statistics
      const date = notification.createdAt.toISOString().split('T')[0];
      if (!stats.byDay[date]) {
        stats.byDay[date] = 0;
      }
      stats.byDay[date]++;
    });

    return {
      period: { startDate, endDate },
      statistics: stats,
    };
  }
}
