# Appointment System Permissions

## Overview

This document outlines all appointment-related permissions in the hospital management system. These permissions control access to various appointment management features, including provider availability, scheduling, and appointment operations.

## Permission Categories

### 1. Basic Appointment Operations

| Permission                | Description                                      | Role Access                 |
| ------------------------- | ------------------------------------------------ | --------------------------- |
| `view_appointments`       | View appointment lists and details               | Doctor, Nurse, Receptionist |
| `create_appointments`     | Create new appointments                          | Doctor, Receptionist        |
| `update_appointments`     | Update existing appointment details              | Doctor, Nurse, Receptionist |
| `cancel_appointments`     | Cancel appointments                              | Doctor, Nurse, Receptionist |
| `reschedule_appointments` | Reschedule appointments to different times/dates | Doctor, Nurse, Receptionist |

### 2. Provider Availability Management

| Permission                     | Description                            | Role Access                 |
| ------------------------------ | -------------------------------------- | --------------------------- |
| `manage_provider_availability` | Manage own availability settings       | Doctor, Nurse               |
| `view_provider_availability`   | View provider availability schedules   | Doctor, Nurse, Receptionist |
| `manage_provider_schedules`    | Set working hours and weekly schedules | Doctor, Nurse               |
| `manage_provider_time_off`     | Request and manage time off periods    | Doctor, Nurse               |

### 3. Appointment Slot Management

| Permission                 | Description                                  | Role Access                 |
| -------------------------- | -------------------------------------------- | --------------------------- |
| `manage_appointment_slots` | Create, update, and delete appointment slots | Doctor                      |
| `view_appointment_slots`   | View available appointment slots             | Doctor, Nurse, Receptionist |
| `delete_appointment_slots` | Remove appointment slots                     | Doctor                      |

### 4. Advanced Appointment Features

| Permission                    | Description                          | Role Access          |
| ----------------------------- | ------------------------------------ | -------------------- |
| `manage_appointment_waitlist` | Manage waitlist for overbooked slots | Doctor, Receptionist |

## Role-Based Permission Matrix

### Doctor Role

- **Full Access**: All appointment permissions
- **Use Cases**:
  - Manage their own availability and schedules
  - Create and manage appointment slots
  - Handle all appointment operations
  - Manage waitlists

### Nurse Role

- **Provider Access**: Can manage their own availability and schedules
- **Limited Operations**: Can view and update appointments but not create slots
- **Use Cases**:
  - Manage personal availability
  - Update appointment statuses
  - View provider availability

### Receptionist Role

- **Front Desk Access**: Can manage appointments but not provider schedules
- **Use Cases**:
  - Create and manage appointments for patients
  - View provider availability for scheduling
  - Manage appointment waitlists
  - Cancel and reschedule appointments

## Permission Implementation

### Frontend Permission Guards

```typescript
// Example permission check in React components
const { user } = useAuth();

// Check if user can manage provider availability
const canManageAvailability = user?.permissions?.includes(
  'manage_provider_availability',
);

// Check if user can view appointment slots
const canViewSlots = user?.permissions?.includes('view_appointment_slots');
```

### Backend Permission Validation

```typescript
// Example permission check in NestJS controllers
@UseGuards(JwtAuthGuard)
@Get('provider-availability')
async getProviderAvailability(@Request() req) {
  const user = req.user;

  // Check if user has permission to view provider availability
  if (!user.permissions.includes('view_provider_availability')) {
    throw new ForbiddenException('Insufficient permissions');
  }

  // ... rest of the method
}
```

## Permission Assignment

### Automatic Assignment

Permissions are automatically assigned to roles during database seeding:

```typescript
// Doctor role gets all appointment permissions
{
  name: 'Doctor',
  permissions: [
    'view_appointments',
    'create_appointments',
    'update_appointments',
    'cancel_appointments',
    'reschedule_appointments',
    'manage_provider_availability',
    'view_provider_availability',
    'manage_provider_schedules',
    'manage_provider_time_off',
    'manage_appointment_slots',
    'view_appointment_slots',
    'manage_appointment_waitlist',
    // ... other permissions
  ]
}
```

### Manual Assignment

Permissions can be manually assigned to users through the permission management system:

1. **Role Assignment**: Assign users to roles with appropriate permissions
2. **Direct Permissions**: Grant specific permissions directly to users
3. **Temporary Permissions**: Grant time-limited permissions for special cases

## Security Considerations

### Principle of Least Privilege

- Users only receive permissions necessary for their role
- Provider availability management is restricted to service providers
- Slot creation is limited to doctors to prevent conflicts

### Permission Validation

- All appointment endpoints validate user permissions
- Frontend components check permissions before rendering features
- Database queries are scoped based on user permissions

### Audit Trail

- All permission changes are logged
- Appointment operations are tracked with user attribution
- Provider availability changes are audited

## Future Enhancements

### Planned Permissions

- `manage_appointment_templates` - Create reusable appointment templates
- `manage_recurring_appointments` - Handle recurring appointment patterns
- `view_appointment_analytics` - Access appointment statistics and reports
- `manage_appointment_reminders` - Configure notification settings

### Permission Granularity

- Department-specific appointment permissions
- Service-specific provider access controls
- Patient-specific appointment restrictions

## Usage Examples

### Checking Provider Availability

```typescript
// Frontend: Check if user can access provider availability page
const canAccessAvailability = user?.permissions?.includes('manage_provider_availability');

if (!canAccessAvailability) {
  return <Alert>You don't have permission to manage availability</Alert>;
}
```

### Creating Appointment Slots

```typescript
// Backend: Validate slot creation permission
@Post('slots')
@UseGuards(JwtAuthGuard)
async createSlot(@Request() req, @Body() createSlotDto: CreateSlotDto) {
  if (!req.user.permissions.includes('manage_appointment_slots')) {
    throw new ForbiddenException('Cannot create appointment slots');
  }

  return this.appointmentsService.createSlot(createSlotDto);
}
```

### Managing Appointments

```typescript
// Frontend: Show/hide appointment management features
const canManageAppointments = user?.permissions?.includes('update_appointments');
const canCancelAppointments = user?.permissions?.includes('cancel_appointments');

return (
  <AppointmentCard>
    {/* Appointment details */}
    {canManageAppointments && <EditButton />}
    {canCancelAppointments && <CancelButton />}
  </AppointmentCard>
);
```

This permission system ensures secure and appropriate access to appointment management features while maintaining flexibility for different user roles and responsibilities.
