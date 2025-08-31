# 🏥 Hospital Billing Backend - Appointments Module Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Core Features](#core-features)
5. [API Endpoints](#api-endpoints)
6. [Cron Job System](#cron-job-system)
7. [Notification System](#notification-system)
8. [Billing Integration](#billing-integration)
9. [Module Integration](#module-integration)
10. [Configuration](#configuration)
11. [Deployment](#deployment)
12. [Monitoring & Health](#monitoring--health)
13. [Troubleshooting](#troubleshooting)
14. [API Examples](#api-examples)

---

## 🎯 Overview

The Appointments Module is a comprehensive scheduling and management system designed for hospital operations. It integrates with the unified billing system and follows a "payment before services" policy, ensuring financial compliance while providing robust scheduling capabilities.

### Key Features

- **Intelligent Scheduling Engine** with real-time availability management
- **Advanced Slot Management** with dynamic generation and reservation systems
- **Automated Billing Integration** with invoice generation and payment processing
- **Comprehensive Notification System** with automated reminders and confirmations
- **Cron-based Automation** for background processing and maintenance
- **Multi-module Integration** with reporting, cash office, and billing systems

---

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Cron Jobs     │
│   Applications  │◄──►│   (NestJS)       │◄──►│   (Scheduler)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Database       │
                       │   (PostgreSQL)   │
                       └──────────────────┘
```

### Module Dependencies

```
AppointmentsModule
├── DatabaseModule (Prisma ORM)
├── NotificationsModule
├── BillingModule
├── ServicesModule
├── PatientsModule
└── UsersModule
```

---

## 🗄️ Database Schema

### Core Models

#### AppointmentSlot

```prisma
model AppointmentSlot {
  id                String   @id @default(cuid())
  date              DateTime
  startTime         DateTime
  endTime           DateTime
  slotType          SlotType
  maxBookings       Int      @default(1)
  currentBookings   Int      @default(0)
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  appointments      Appointment[]
  resources        ResourceSchedule[]
  providerSchedule ProviderSchedule[]
}
```

#### Appointment

```prisma
model Appointment {
  id              String            @id @default(cuid())
  patientId       String
  slotId          String
  providerId      String
  status          AppointmentStatus @default(SCHEDULED)
  type            AppointmentType
  priority        AppointmentPriority @default(NORMAL)
  scheduledStart  DateTime
  scheduledEnd    DateTime
  actualStart     DateTime?
  actualEnd       DateTime?
  notes           String?
  totalAmount     Decimal           @db.Decimal(10, 2)
  paidAmount      Decimal           @db.Decimal(10, 2) @default(0)
  balance         Decimal           @db.Decimal(10, 2) @default(0)
  invoiceId       String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  patient         Patient           @relation(fields: [patientId], references: [id])
  slot            AppointmentSlot   @relation(fields: [slotId], references: [id])
  provider        StaffMember       @relation(fields: [providerId], references: [id])
  invoice         Invoice?          @relation(fields: [invoiceId], references: [id])
  bundles         AppointmentBundle[]
  waitlistEntries WaitlistEntry[]
  notifications   AppointmentNotification[]
}
```

#### Notification

```prisma
model Notification {
  id              String            @id @default(cuid())
  type            String
  channel         NotificationChannel
  recipientId     String
  recipientType   String
  subject         String?
  content         String
  metadata        Json?
  scheduledFor    DateTime?
  sentAt          DateTime?
  status          NotificationStatus @default(PENDING)
  priority        NotificationPriority @default(NORMAL)
  failureReason   String?
  retryCount      Int               @default(0)
  deliveryDetails Json?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  recipient       Json?
}
```

### Enums

```prisma
enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  CHECKED_IN
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
  RESCHEDULED
}

enum SlotType {
  CONSULTATION
  LAB_TEST
  IMAGING
  SURGERY
  PHARMACY
  FOLLOW_UP
  EMERGENCY
}

enum NotificationChannel {
  EMAIL
  SMS
  PUSH_NOTIFICATION
  IN_APP
  PHONE_CALL
  WEBHOOK
}
```

---

## ⚡ Core Features

### 1. Intelligent Scheduling Engine

- **Real-time Availability Management**: Live slot updates across all channels
- **Resource Optimization**: Staff, equipment, and room scheduling coordination
- **Conflict Detection**: Automatic prevention of double-booking and scheduling conflicts
- **Buffer Time Management**: Automatic spacing for prep, cleanup, and transitions

### 2. Advanced Slot Management

- **Dynamic Slot Generation**: Rule-based availability creation
- **Slot Reservation System**: Temporary holds during booking process
- **Overbooking Management**: Controlled overbooking with waitlist automation
- **Priority Scheduling**: VIP, emergency, and urgent case prioritization

### 3. Appointment Bundling

- **Multi-service Appointments**: Consultation + lab + imaging combinations
- **Bundle Pricing**: Automatic calculation of bundled service costs
- **Sequential Scheduling**: Intelligent ordering of bundled services

### 4. Recurring Appointments

- **Pattern Support**: Weekly, monthly, or custom interval scheduling
- **Bulk Operations**: Create multiple appointments from a single template
- **Modification Handling**: Update or cancel entire recurring series

---

## 🌐 API Endpoints

### Appointments Management

```
GET    /appointments                    # List all appointments
POST   /appointments                    # Create new appointment
GET    /appointments/:id               # Get appointment details
PATCH  /appointments/:id               # Update appointment
DELETE /appointments/:id               # Cancel appointment
POST   /appointments/:id/reschedule    # Reschedule appointment
POST   /appointments/:id/check-in      # Check in patient
POST   /appointments/:id/complete      # Mark appointment complete
```

### Scheduling & Availability

```
GET    /appointments/slots             # Get available slots
POST   /appointments/slots             # Create new slot
GET    /appointments/slots/:id         # Get slot details
PATCH  /appointments/slots/:id         # Update slot
DELETE /appointments/slots/:id         # Delete slot
GET    /appointments/availability      # Check provider availability
```

### Billing & Payments

```
POST   /appointments/:id/process-payment # Process payment
GET    /appointments/:id/invoice       # Get appointment invoice
GET    /appointments/invoices          # List all invoices
POST   /appointments/:id/regenerate-invoice # Regenerate invoice
```

### Waitlist Management

```
GET    /appointments/waitlist          # Get waitlist entries
POST   /appointments/waitlist          # Add to waitlist
PATCH  /appointments/waitlist/:id     # Update waitlist entry
DELETE /appointments/waitlist/:id     # Remove from waitlist
```

---

## ⏰ Cron Job System

### Overview

The system uses `@nestjs/schedule` to automate background tasks, ensuring efficient operation without manual intervention.

### Cron Job Schedule

#### 1. Scheduled Notifications Processing

```typescript
@Cron(CronExpression.EVERY_MINUTE)
async processScheduledNotificationsCron()
```

- **Frequency**: Every minute
- **Purpose**: Process notifications scheduled for future delivery
- **Operations**: Send emails, SMS, push notifications based on schedule

#### 2. Appointment Reminders

```typescript
@Cron('*/15 * * * *')
async processAppointmentRemindersCron()
```

- **Frequency**: Every 15 minutes
- **Purpose**: Send appointment reminders at appropriate intervals
- **Reminder Schedule**:
  - 24 hours before appointment
  - 2 hours before appointment
  - 1 hour before appointment

#### 3. Health Monitoring

```typescript
@Cron('*/5 * * * *')
async healthCheckCron()
```

- **Frequency**: Every 5 minutes
- **Purpose**: Monitor system health and performance
- **Metrics Tracked**:
  - Pending notification count
  - Failed notification count
  - System performance alerts

#### 4. Daily Maintenance

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async dailyMaintenanceCron()
```

- **Frequency**: Daily at midnight
- **Purpose**: System cleanup and maintenance
- **Operations**:
  - Clean up old notifications (30+ days)
  - Generate daily reports
  - Database optimization

### Cron Job Configuration

```typescript
// app.module.ts
imports: [
  ScheduleModule.forRoot(),
  // ... other modules
];
```

### Manual Cron Control

```typescript
// Manual execution of cron jobs for testing/debugging
POST / notifications / process - scheduled;
POST / notifications / process - appointment - reminders;
POST / notifications / cleanup - old - notifications;
POST / notifications / generate - daily - report;
```

---

## 📧 Notification System

### Architecture

The notification system is centralized and can be used by all modules for consistent communication across multiple channels.

### Notification Types

1. **Appointment Confirmations**: Sent immediately after booking
2. **Appointment Reminders**: 24hr, 2hr, and 1hr before appointment
3. **Payment Confirmations**: After successful payment processing
4. **Payment Reminders**: For overdue payments
5. **Cancellation Notifications**: When appointments are cancelled
6. **Reschedule Notifications**: When appointments are modified

### Channels Supported

- **Email**: SMTP-based delivery with template support
- **SMS**: Text message delivery via SMS gateway
- **Push Notifications**: Mobile app notifications
- **In-App**: Internal system notifications
- **Phone Calls**: Automated voice calls
- **Webhooks**: External system integration

### Template System

```typescript
interface NotificationTemplate {
  name: string;
  type: string;
  channel: NotificationChannel;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
}
```

### Variable Replacement

Templates support dynamic content with variable replacement:

```typescript
// Template content
"Hello {{patientName}}, your appointment with {{providerName}} is scheduled for {{appointmentDate}} at {{appointmentTime}}."

// Variables object
{
  patientName: "John Doe",
  providerName: "Dr. Smith",
  appointmentDate: "2024-01-15",
  appointmentTime: "10:00 AM"
}
```

### Notification Lifecycle

```
PENDING → SCHEDULED → SENT → DELIVERED → READ
   ↓
FAILED (with retry logic)
```

---

## 💰 Billing Integration

### Payment Before Services Policy

The system enforces a strict "payment before services" policy:

1. **Invoice Generation**: Automatic invoice creation upon appointment booking
2. **Payment Processing**: Payment must be completed before appointment confirmation
3. **Balance Tracking**: Real-time balance calculation and updates
4. **Refund Handling**: Automatic refund processing for cancellations

### Invoice Flow

```
Appointment Created → Invoice Generated → Payment Required → Appointment Confirmed
```

### Payment Processing

```typescript
async processPayment(paymentDto: ProcessPaymentDto): Promise<AppointmentResponse> {
  // 1. Validate payment amount
  // 2. Process payment transaction
  // 3. Update invoice status
  // 4. Update appointment balance
  // 5. Send payment confirmation
  // 6. Return updated appointment
}
```

### Financial Tracking

- **Total Amount**: Full cost of appointment services
- **Paid Amount**: Amount received from patient
- **Balance**: Outstanding amount owed
- **Payment History**: Complete transaction record

---

## 🔗 Module Integration

### Reporting Module

```typescript
// Appointment analytics and reporting
GET / reporting / appointments / analytics;
GET / reporting / appointments / revenue;
GET / reporting / appointments / resource - utilization;
GET / reporting / appointments / waitlist;
```

### Cash Office Module

```typescript
// Cash transaction tracking
GET / cash - office / appointments / transactions;
GET / cash - office / appointments / cash - flow;
```

### Billing Module

```typescript
// Billing summaries and invoice details
GET /billing/appointments/billing-summary
GET /billing/appointments/:id/invoice-details
```

### Data Flow

```
Appointment Creation → Invoice Generation → Payment Processing →
Reporting Updates → Cash Office Updates → Billing Updates
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hospital_db"

# Notification Services
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="notifications@hospital.com"
SMTP_PASS="app_password"

SMS_API_KEY="your_sms_api_key"
SMS_API_SECRET="your_sms_api_secret"

# Cron Job Configuration
ENABLE_CRON_JOBS="true"
CRON_TIMEZONE="UTC"
```

### Cron Job Customization

```typescript
// Custom cron expressions
@Cron('0 9 * * 1-5')     // Weekdays at 9 AM
@Cron('0 */6 * * *')     // Every 6 hours
@Cron('0 0 1 * *')       // First day of month
```

---

## 🚀 Deployment

### Production Setup

1. **Install Dependencies**

   ```bash
   npm install
   npm install @nestjs/schedule
   ```

2. **Database Migration**

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Configure environment variables
   ```

4. **Build and Start**
   ```bash
   npm run build
   npm run start:prod
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

---

## 📊 Monitoring & Health

### Health Check Endpoint

```
GET /notifications/cron-status
```

### Response Format

```json
{
  "timestamp": "2024-01-15T10:00:00.000Z",
  "health": {
    "pending": 5,
    "failed": 0,
    "total": 150,
    "status": "HEALTHY"
  },
  "cronJobs": {
    "scheduledNotifications": "EVERY_MINUTE",
    "appointmentReminders": "EVERY_15_MINUTES",
    "dailyMaintenance": "EVERY_DAY_AT_MIDNIGHT",
    "healthCheck": "EVERY_5_MINUTES"
  },
  "lastRun": {
    "scheduledNotifications": "Auto-run every minute",
    "appointmentReminders": "Auto-run every 15 minutes",
    "dailyMaintenance": "Auto-run daily at midnight",
    "healthCheck": "Auto-run every 5 minutes"
  }
}
```

### Logging

```typescript
// Structured logging with emojis for easy identification
this.logger.log('🕐 Running scheduled notifications cron job...');
this.logger.log('✅ Cron job processed 5 scheduled notifications');
this.logger.error(
  '❌ Cron job failed to process scheduled notifications:',
  error,
);
this.logger.warn('⚠️ High pending notifications: 1500');
this.logger.error('🚨 High failed notifications: 150');
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Cron Jobs Not Running

**Symptoms**: No automated processing, manual endpoints work
**Solutions**:

- Check `ScheduleModule.forRoot()` is imported
- Verify cron job decorators are properly applied
- Check application logs for cron job errors
- Ensure application is running continuously

#### 2. Notifications Not Sending

**Symptoms**: Notifications created but not delivered
**Solutions**:

- Check notification service configuration
- Verify external service credentials (SMTP, SMS)
- Check notification status in database
- Review failure reasons and retry logic

#### 3. Database Connection Issues

**Symptoms**: Cron jobs fail with database errors
**Solutions**:

- Verify database connection string
- Check database server status
- Ensure proper database permissions
- Review connection pool configuration

### Debug Mode

```typescript
// Enable debug logging
@Cron(CronExpression.EVERY_MINUTE, { name: 'debug-scheduled' })
async debugScheduledNotificationsCron() {
  this.logger.debug('🔍 Debug: Processing scheduled notifications...');
  // ... implementation
}
```

---

## 📝 API Examples

### Create Appointment

```bash
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "patientId": "patient_123",
    "slotId": "slot_456",
    "providerId": "provider_789",
    "type": "CONSULTATION",
    "scheduledStart": "2024-01-20T10:00:00Z",
    "scheduledEnd": "2024-01-20T11:00:00Z",
    "notes": "Follow-up consultation"
  }'
```

### Process Payment

```bash
curl -X POST http://localhost:3000/appointments/appointment_123/process-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 150.00,
    "paymentMethod": "CASH"
  }'
```

### Test Notification

```bash
curl -X POST "http://localhost:3000/notifications/test-notification/EMAIL?recipientId=patient_123&recipientType=PATIENT" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Cron Status

```bash
curl -X GET http://localhost:3000/notifications/cron-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📚 Additional Resources

### Related Documentation

- [Billing Module Documentation](./BILLING_MODULE_DOCUMENTATION.md)
- [Notification System Summary](./NOTIFICATION_SYSTEM_SUMMARY.md)
- [Module Integration Summary](./APPOINTMENT_MODULE_INTEGRATION_SUMMARY.md)

### Database Migrations

```bash
# View migration history
npx prisma migrate status

# Create new migration
npx prisma migrate dev --name feature_name

# Reset database (development only)
npx prisma migrate reset
```

### Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:cov
```

---

## 🎯 Conclusion

The Appointments Module provides a robust, scalable, and automated solution for hospital appointment management. With its integrated billing system, comprehensive notification capabilities, and automated cron job processing, it ensures efficient operations while maintaining financial compliance.

The hybrid approach of automated cron jobs with manual control endpoints provides the best of both worlds: production efficiency and development flexibility.

For questions or support, refer to the troubleshooting section or contact the development team.

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Author**: Hospital Billing Backend Team
