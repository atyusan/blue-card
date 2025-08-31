import { http } from './api';
import type {
  Notification,
  NotificationTemplate,
  SendNotificationData,
  NotificationSearchResult,
} from '../types';

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  recipientId?: string;
  recipientType?: string;
  type?: string;
  channel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationStats {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
  read: number;
  channelBreakdown: {
    email: number;
    sms: number;
    push: number;
    inApp: number;
  };
  typeBreakdown: Record<string, number>;
  dailyStats: Array<{
    date: string;
    count: number;
  }>;
}

class NotificationsService {
  // ===== NOTIFICATION TEMPLATE MANAGEMENT =====

  // Create notification template
  async createNotificationTemplate(
    templateData: Partial<NotificationTemplate>
  ): Promise<NotificationTemplate> {
    const response = await http.post<NotificationTemplate>(
      '/notifications/templates',
      templateData
    );
    return response;
  }

  // Get all notification templates
  async getNotificationTemplates(params?: {
    type?: string;
    channel?: string;
    isActive?: boolean;
  }): Promise<NotificationTemplate[]> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.channel) queryParams.append('channel', params.channel);
    if (params?.isActive !== undefined)
      queryParams.append('isActive', params.isActive.toString());

    const response = await http.get<NotificationTemplate[]>(
      `/notifications/templates?${queryParams.toString()}`
    );
    return response;
  }

  // Update notification template
  async updateNotificationTemplate(
    id: string,
    templateData: Partial<NotificationTemplate>
  ): Promise<NotificationTemplate> {
    const response = await http.patch<NotificationTemplate>(
      `/notifications/templates/${id}`,
      templateData
    );
    return response;
  }

  // Delete notification template
  async deleteNotificationTemplate(id: string): Promise<void> {
    await http.delete(`/notifications/templates/${id}`);
  }

  // ===== NOTIFICATION CREATION AND SENDING =====

  // Create a new notification
  async createNotification(
    notificationData: SendNotificationData
  ): Promise<Notification> {
    const response = await http.post<Notification>(
      '/notifications',
      notificationData
    );
    return response;
  }

  // Send template-based notification
  async sendTemplateNotification(
    sendData: SendNotificationData
  ): Promise<Notification> {
    const response = await http.post<Notification>(
      '/notifications/send',
      sendData
    );
    return response;
  }

  // Send a specific notification by ID
  async sendNotification(id: string): Promise<Notification> {
    const response = await http.post<Notification>(`/notifications/send/${id}`);
    return response;
  }

  // ===== APPOINTMENT-SPECIFIC NOTIFICATIONS =====

  // Send appointment confirmation notifications
  async sendAppointmentConfirmation(
    appointmentId: string
  ): Promise<Notification[]> {
    const response = await http.post<Notification[]>(
      `/notifications/appointments/${appointmentId}/confirmation`
    );
    return response;
  }

  // Send appointment reminder notification
  async sendAppointmentReminder(
    appointmentId: string,
    reminderType: '24HR' | '2HR' | '1HR'
  ): Promise<Notification> {
    const response = await http.post<Notification>(
      `/notifications/appointments/${appointmentId}/reminder/${reminderType}`
    );
    return response;
  }

  // Send payment reminder notification
  async sendPaymentReminder(appointmentId: string): Promise<Notification> {
    const response = await http.post<Notification>(
      `/notifications/appointments/${appointmentId}/payment-reminder`
    );
    return response;
  }

  // ===== NOTIFICATION MANAGEMENT =====

  // Get all notifications with filtering
  async getNotifications(
    params: NotificationQueryParams = {}
  ): Promise<NotificationSearchResult> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<NotificationSearchResult>(
      `/notifications?${queryParams.toString()}`
    );
    return response;
  }

  // Get notification by ID
  async getNotificationById(id: string): Promise<Notification> {
    const response = await http.get<Notification>(`/notifications/${id}`);
    return response;
  }

  // Update a notification
  async updateNotification(
    id: string,
    notificationData: Partial<Notification>
  ): Promise<Notification> {
    const response = await http.patch<Notification>(
      `/notifications/${id}`,
      notificationData
    );
    return response;
  }

  // Delete a notification
  async deleteNotification(id: string): Promise<void> {
    await http.delete(`/notifications/${id}`);
  }

  // ===== BULK NOTIFICATION OPERATIONS =====

  // Send bulk notifications to multiple recipients
  async sendBulkNotifications(
    bulkData: SendNotificationData & { recipientIds: string[] }
  ): Promise<Notification[]> {
    const response = await http.post<Notification[]>(
      '/notifications/bulk',
      bulkData
    );
    return response;
  }

  // ===== SCHEDULED NOTIFICATION PROCESSING =====

  // Process all scheduled notifications
  async processScheduledNotifications(): Promise<{
    processed: number;
    success: number;
    failed: number;
  }> {
    const response = await http.post<{
      processed: number;
      success: number;
      failed: number;
    }>('/notifications/process-scheduled');
    return response;
  }

  // Manually process appointment reminders
  async processAppointmentReminders(): Promise<{
    processed: number;
    success: number;
    failed: number;
  }> {
    const response = await http.post<{
      processed: number;
      success: number;
      failed: number;
    }>('/notifications/process-appointment-reminders');
    return response;
  }

  // Manually cleanup old notifications
  async cleanupOldNotifications(): Promise<{
    deleted: number;
    message: string;
  }> {
    const response = await http.post<{
      deleted: number;
      message: string;
    }>('/notifications/cleanup-old-notifications');
    return response;
  }

  // Manually generate daily notification report
  async generateDailyReport(): Promise<{
    report: string;
    stats: NotificationStats;
    generatedAt: string;
  }> {
    const response = await http.post<{
      report: string;
      stats: NotificationStats;
      generatedAt: string;
    }>('/notifications/generate-daily-report');
    return response;
  }

  // ===== TESTING AND HEALTH MONITORING =====

  // Test notification delivery for a specific channel
  async testNotification(
    channel: string,
    recipientId: string,
    recipientType: string
  ): Promise<{
    message: string;
    notification: Notification;
    channel: string;
    recipientId: string;
    recipientType: string;
  }> {
    const queryParams = new URLSearchParams({
      recipientId,
      recipientType,
    });

    const response = await http.post<{
      message: string;
      notification: Notification;
      channel: string;
      recipientId: string;
      recipientType: string;
    }>(`/notifications/test-notification/${channel}?${queryParams.toString()}`);
    return response;
  }

  // Get cron job status and health metrics
  async getCronStatus(): Promise<{
    timestamp: string;
    health: {
      pending: number;
      failed: number;
      total: number;
      status: string;
    };
    cronJobs: Record<string, string>;
    lastRun: Record<string, string>;
  }> {
    const response = await http.get<{
      timestamp: string;
      health: {
        pending: number;
        failed: number;
        total: number;
        status: string;
      };
      cronJobs: Record<string, string>;
      lastRun: Record<string, string>;
    }>('/notifications/cron-status');
    return response;
  }

  // ===== NOTIFICATION STATISTICS =====

  // Get notification statistics for a date range
  async getNotificationStatistics(
    startDate: string,
    endDate: string
  ): Promise<NotificationStats> {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
    });

    const response = await http.get<NotificationStats>(
      `/notifications/statistics/summary?${queryParams.toString()}`
    );
    return response;
  }

  // ===== UTILITY METHODS =====

  // Mark notification as read
  async markAsRead(id: string): Promise<Notification> {
    return this.updateNotification(id, {
      status: 'READ',
      readAt: new Date().toISOString(),
    });
  }

  // Mark notification as delivered
  async markAsDelivered(id: string): Promise<Notification> {
    return this.updateNotification(id, {
      status: 'DELIVERED',
      deliveredAt: new Date().toISOString(),
    });
  }

  // Resend failed notification
  async resendFailedNotification(id: string): Promise<Notification> {
    return this.sendNotification(id);
  }

  // Get unread notifications count
  async getUnreadCount(): Promise<number> {
    const response = await this.getNotifications({
      status: 'DELIVERED',
      limit: 1,
    });
    return response.pagination.total;
  }

  // Get pending notifications count
  async getPendingCount(): Promise<number> {
    const response = await this.getNotifications({
      status: 'PENDING',
      limit: 1,
    });
    return response.pagination.total;
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
