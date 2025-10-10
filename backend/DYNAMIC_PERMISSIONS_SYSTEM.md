# Dynamic Permissions System

## Overview

The permissions system has been upgraded from hardcoded frontend constants to a dynamic, database-driven architecture. This allows for better management, scalability, and flexibility in defining and assigning permissions.

## Architecture

### Database Model

A new `Permission` model has been added to the database schema:

```prisma
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique          // e.g., 'view_patients'
  displayName String                    // e.g., 'View Patients'
  description String?                   // What this permission allows
  category    String                    // e.g., 'Patient Management'
  module      String?                   // e.g., 'Patients', 'Appointments'
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([module])
  @@map("permissions")
}
```

### Backend API

**Endpoint**: `/permissions`

**Available Routes**:

- `GET /permissions` - Get all permissions grouped by category
- `GET /permissions/categories` - Get all permission categories
- `GET /permissions/modules` - Get all permission modules
- `GET /permissions/by-category?category=<name>` - Get permissions by category
- `GET /permissions/by-module?module=<name>` - Get permissions by module

**Controller**: `src/permissions/permissions.controller.ts`  
**Service**: `src/permissions/permissions.service.ts`

### Frontend Integration

**Service**: `frontend/src/services/permissions.service.ts`

The frontend now fetches permissions dynamically from the API instead of using hardcoded constants.

**Usage in RolesPage**:

```typescript
// Load permissions from API
const loadPermissions = useCallback(async () => {
  try {
    setIsLoadingPermissions(true);
    const response = await permissionsService.getAll();
    setPermissionCategories(response.groupedPermissions);
  } catch (error) {
    console.error('Failed to load permissions:', error);
    showSnackbar('Failed to load permissions', 'error');
  } finally {
    setIsLoadingPermissions(false);
  }
}, []);
```

## Permission Categories

The system currently defines **76 permissions** across the following categories:

1. **User Management** (4 permissions)
   - View, Create, Update, Delete Users

2. **Patient Management** (4 permissions)
   - View, Create, Update, Delete Patients

3. **Appointment Management** (14 permissions)
   - View, Create, Update, Cancel, Reschedule Appointments
   - Manage Slots, Waitlist, Bundles, Payments, Resources, Preferences
   - View Analytics

4. **Provider Management** (5 permissions)
   - View/Manage Availability
   - Manage Schedules, Time Off
   - Approve Time Off

5. **Treatment Management** (7 permissions)
   - View, Create, Update, Delete Treatments
   - Update Status, Manage Providers, Manage Links

6. **Consultation Management** (3 permissions)
   - View, Create, Update Consultations

7. **Laboratory Services** (5 permissions)
   - View/Create/Update Lab Orders
   - View/Create Lab Results

8. **Pharmacy Services** (4 permissions)
   - View/Create Prescriptions
   - Dispense Medications, Manage Inventory

9. **Surgery Management** (3 permissions)
   - View, Create, Update Surgeries

10. **Billing & Finance** (10 permissions)
    - View Billing, Manage Invoices, Payments
    - View/Create Cash Transactions and Requests

11. **Reports & Analytics** (3 permissions)
    - View, Create, Export Reports

12. **Role & Permission Management** (5 permissions)
    - View, Create, Update, Delete, Assign Roles

13. **Department Management** (4 permissions)
    - View, Create, Update, Delete Departments

14. **Service Management** (4 permissions)
    - View, Create, Update, Delete Services

15. **System Administration** (1 permission)
    - Administrator (Full Access)

## Benefits

### 1. **Dynamic Management**

- Permissions can be added/modified without code changes
- New modules automatically appear in the UI
- Centralized permission definitions

### 2. **Better UX**

- Permissions show displayName (human-readable)
- Descriptions help users understand what each permission does
- Organized by category and module for easy navigation

### 3. **Scalability**

- Easy to add new permissions as the system grows
- Permissions can be filtered by category or module
- Supports future features like permission dependencies

### 4. **Consistency**

- Single source of truth in the database
- Backend and frontend use the same permission definitions
- No discrepancies between hardcoded values

## Migration

### Seeding Permissions

Permissions are automatically seeded during the main seed process. The seed function:

- Checks if permissions already exist
- Creates 76 predefined permissions
- Groups them by category and module

### Updating Existing Roles

After adding the permissions table, existing roles were updated to include the new treatment and appointment permissions:

**Doctor Role**: 40 permissions (full access)
**Nurse Role**: 20 permissions (limited access)
**Receptionist Role**: 18 permissions (front desk access)

## Future Enhancements

### Planned Features

1. **Permission Dependencies**
   - Define which permissions require other permissions
   - Example: `delete_patients` requires `view_patients`

2. **Permission Groups**
   - Create logical groups of permissions
   - Example: "Patient Care Bundle" = view + create + update patients

3. **Custom Permissions**
   - Allow admins to create custom permissions via UI
   - Support for dynamic permission creation

4. **Permission Analytics**
   - Track which permissions are actually used
   - Identify unused or rarely-used permissions

5. **Audit Trail**
   - Log when permissions are granted/revoked
   - Track permission changes over time

## API Examples

### Get All Permissions

```typescript
const response = await permissionsService.getAll();
// Returns: { permissions: [...], groupedPermissions: {...}, categories: [...] }
```

### Get Permissions by Category

```typescript
const permissions =
  await permissionsService.getByCategory('Patient Management');
// Returns: [{ name: 'view_patients', displayName: 'View Patients', ... }, ...]
```

### Get Permissions by Module

```typescript
const permissions = await permissionsService.getByModule('Appointments');
// Returns: All appointment-related permissions
```

## Security Considerations

1. **Authentication Required**: All permission endpoints require JWT authentication
2. **Read-Only API**: The permissions API only supports GET operations
3. **Active Permissions**: Only active permissions are returned by the API
4. **Role-Based Filtering**: In the future, permissions can be filtered based on user context

## Conclusion

The dynamic permissions system provides a robust, scalable foundation for managing access control in the hospital management system. It eliminates hardcoded values, improves user experience, and sets the stage for future enhancements.
