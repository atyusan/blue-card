# Hospital Appointment Booking & Scheduling System

## Overview

The Hospital Appointment Booking & Scheduling System is a comprehensive, intelligent scheduling solution that integrates seamlessly with the existing hospital billing backend. It provides robust appointment management, intelligent scheduling, resource optimization, and full billing integration while adhering to the "payment before services" policy.

## 🚀 Key Features

### 1. Intelligent Scheduling Engine

- **Real-time Availability Management**: Live slot updates across all channels
- **Resource Optimization**: Staff, equipment, and room scheduling coordination
- **Appointment Bundling**: Multi-service appointments (consultation + lab + imaging)
- **Buffer Time Management**: Automatic spacing for prep, cleanup, and transitions
- **Recurring Appointment Support**: Weekly, monthly, or custom interval scheduling

### 2. Advanced Slot Management

- **Dynamic Slot Generation**: Rule-based availability creation
- **Slot Reservation System**: Temporary holds during booking process
- **Overbooking Management**: Controlled overbooking with waitlist automation
- **Priority Scheduling**: VIP, emergency, and urgent case prioritization
- **Template-based Schedules**: Configurable weekly/monthly schedule patterns

### 3. Patient Preferences & Experience

- **Favorite Providers**: Quick booking with preferred doctors
- **Time Slot Preferences**: Morning/afternoon/evening preference learning
- **Special Needs Accommodation**: Customizable preferences for accessibility
- **Communication Preferences**: Preferred notification channels

### 4. Communication & Engagement

- **Automated Notifications**: SMS, email, push notifications
- **Appointment Reminders**: Configurable reminder schedules (24hr, 2hr, etc.)
- **Pre-visit Instructions**: Preparation guidelines, forms, documentation
- **Real-time Updates**: Delays, cancellations, and schedule changes

### 5. Provider Management

- **Staff Calendar Management**: Individual and departmental schedules
- **Availability Management**: Time-off requests, schedule modifications
- **Workload Balancing**: Fair distribution of appointments across providers
- **Specialty-based Scheduling**: Different rules for different medical specialties
- **Coverage Management**: Backup provider assignments and cross-coverage

## 🏗️ System Architecture

### Database Schema

The system extends the existing Prisma schema with new models:

```prisma
// Core Appointment Models
- AppointmentSlot: Available time slots for booking
- Appointment: Individual appointment records
- AppointmentBundle: Multi-service appointment packages
- RecurringSlotPattern: Recurring slot generation patterns

// Resource Management
- Resource: Rooms, equipment, vehicles
- ResourceSchedule: Resource availability schedules
- ProviderSchedule: Staff member schedules
- ProviderTimeOff: Time-off requests and approvals

// Patient Experience
- PatientPreference: Individual patient preferences
- WaitlistEntry: Waitlist management for overbooked slots

// Communication
- AppointmentNotification: Automated notification system
```

### Service Layer

- **AppointmentsService**: Core appointment management logic
- **Intelligent Scheduling Engine**: Conflict detection and optimization
- **Resource Optimization**: Staff and equipment utilization
- **Billing Integration**: Payment processing and cost calculation

## 🔧 API Endpoints

### Core Appointment Management

```http
POST /appointments                    # Create new appointment
GET /appointments                     # List appointments with filters
GET /appointments/:id                 # Get appointment details
PATCH /appointments/:id               # Update appointment
DELETE /appointments/:id              # Cancel appointment
```

### Intelligent Scheduling

```http
POST /appointments/slots/search       # Search available slots
POST /appointments/slots/recurring    # Create recurring slots
POST /appointments/slots/bulk         # Bulk slot creation
GET /appointments/availability/provider # Provider availability
```

### Appointment Operations

```http
POST /appointments/reschedule         # Reschedule appointment
POST /appointments/cancel             # Cancel appointment
POST /appointments/check-in           # Check in patient
POST /appointments/complete           # Complete appointment
POST /appointments/payment            # Process payment
```

### Resource Management

```http
POST /appointments/resources          # Create resource
GET /appointments/resources           # List resources
POST /appointments/resources/schedules # Resource schedules
POST /appointments/providers/schedules # Provider schedules
POST /appointments/providers/time-off # Time off requests
```

## 💰 Billing Integration

### Payment Before Services Policy

The system enforces the "payment before services" policy through:

1. **Pre-payment Requirements**: `requiresPrePayment` flag on appointments
2. **Payment Status Tracking**: Real-time payment status monitoring
3. **Service Blocking**: Services blocked until payment is confirmed
4. **Refund Processing**: Automatic refund handling for cancellations

### Cost Calculation

- **Base Service Costs**: Automatic cost calculation based on appointment type
- **Bundle Discounts**: Multi-service appointment packages with discounts
- **Dynamic Pricing**: Specialty-based and provider-based pricing
- **Payment Tracking**: Real-time balance and payment status

## 🎯 Intelligent Scheduling Features

### Conflict Detection

The system automatically detects and prevents:

- **Time Conflicts**: Overlapping appointments
- **Provider Conflicts**: Provider unavailability
- **Resource Conflicts**: Room/equipment conflicts
- **Capacity Conflicts**: Overbooking prevention

### Optimization Algorithms

- **Slot Optimization**: Best available time slot selection
- **Resource Utilization**: Efficient resource allocation
- **Provider Workload**: Balanced appointment distribution
- **Buffer Time Management**: Automatic spacing between appointments

### Recurring Patterns

- **Daily Patterns**: Same time every day
- **Weekly Patterns**: Same time on specific days
- **Monthly Patterns**: Same time on specific dates
- **Custom Patterns**: Flexible interval-based scheduling

## 📱 Notification System

### Automated Notifications

- **Appointment Confirmation**: Immediate booking confirmation
- **Reminders**: Configurable reminder schedules
- **Status Updates**: Real-time status changes
- **Pre-visit Instructions**: Preparation guidelines

### Communication Channels

- **Email**: Detailed appointment information
- **SMS**: Quick reminders and updates
- **Push Notifications**: In-app notifications
- **Phone Calls**: Important updates and confirmations

## 🔒 Security & Access Control

### Authentication & Authorization

- **JWT Authentication**: Secure API access
- **Role-based Access**: Different permissions for different user types
- **Audit Logging**: Complete action tracking
- **Data Validation**: Input sanitization and validation

### Data Protection

- **Patient Privacy**: HIPAA-compliant data handling
- **Secure Communication**: Encrypted notification channels
- **Access Logging**: Complete access audit trail

## 📊 Analytics & Reporting

### Appointment Statistics

- **Volume Metrics**: Total appointments, cancellations, no-shows
- **Revenue Tracking**: Payment status and revenue analytics
- **Utilization Metrics**: Provider and resource utilization rates
- **Performance Indicators**: Wait times, booking efficiency

### Operational Insights

- **Peak Time Analysis**: Busy period identification
- **Resource Optimization**: Equipment and room utilization
- **Provider Performance**: Individual provider metrics
- **Patient Satisfaction**: Waitlist and preference analysis

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Existing hospital billing backend

### Installation

1. **Database Migration**:

   ```bash
   npx prisma migrate dev --name add_appointment_system
   ```

2. **Generate Prisma Client**:

   ```bash
   npx prisma generate
   ```

3. **Start the Application**:
   ```bash
   npm run start:dev
   ```

### Configuration

Set up environment variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hospital_db"

# Notification Services (optional)
EMAIL_SERVICE_API_KEY="your_email_service_key"
SMS_SERVICE_API_KEY="your_sms_service_key"
```

## 📝 Usage Examples

### Creating an Appointment

```typescript
const appointment = await appointmentsService.createAppointment({
  patientId: 'patient_123',
  slotId: 'slot_456',
  appointmentType: 'GENERAL_CONSULTATION',
  scheduledStart: '2024-01-15T10:00:00Z',
  scheduledEnd: '2024-01-15T10:30:00Z',
  reason: 'Annual checkup',
  requiresPrePayment: true,
});
```

### Searching Available Slots

```typescript
const availableSlots = await appointmentsService.searchAvailableSlots({
  providerId: 'doctor_789',
  startDate: '2024-01-15',
  endDate: '2024-01-20',
  slotType: 'CONSULTATION',
  duration: 30,
});
```

### Creating Recurring Slots

```typescript
await appointmentsService.createRecurringSlots({
  slotId: 'base_slot_123',
  patternType: 'WEEKLY',
  interval: 1,
  daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
  startDate: '2024-01-15',
  endDate: '2024-12-31',
});
```

## 🔧 Customization & Extension

### Adding New Appointment Types

1. **Update Enums**: Add new types to `AppointmentType` enum
2. **Service Mapping**: Map types to service categories in `getBaseServiceCost`
3. **Validation Rules**: Add type-specific validation in DTOs

### Custom Scheduling Rules

1. **Business Logic**: Implement custom rules in `applySchedulingRules`
2. **Conflict Detection**: Add new conflict types in `detectSchedulingConflicts`
3. **Optimization Algorithms**: Customize slot selection logic

### Notification Templates

1. **Content Generation**: Update `generateNotificationContent`
2. **Channel Support**: Add new notification channels
3. **Scheduling Logic**: Customize notification timing

## 🧪 Testing

### Unit Tests

```bash
npm run test appointments
```

### Integration Tests

```bash
npm run test:e2e appointments
```

### API Testing

Use the provided Postman collection or test endpoints directly:

```bash
# Test appointment creation
curl -X POST http://localhost:3000/appointments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patientId":"test","slotId":"test","appointmentType":"GENERAL_CONSULTATION","scheduledStart":"2024-01-15T10:00:00Z","scheduledEnd":"2024-01-15T10:30:00Z"}'
```

## 📚 API Documentation

Full API documentation is available at `/api/docs` when the application is running.

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure all tests pass before submitting

## 📄 License

This project is part of the Hospital Billing Backend system.

## 🆘 Support

For questions or issues:

1. Check the existing documentation
2. Review the code examples
3. Check the test files for usage patterns
4. Create an issue with detailed information

---

**Note**: This system is designed to integrate seamlessly with the existing hospital infrastructure while providing a modern, intelligent appointment scheduling experience. All features respect the existing billing policies and security requirements.
