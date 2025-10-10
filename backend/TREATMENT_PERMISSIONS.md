# Treatment System Permissions

## Overview

This document outlines all treatment-related permissions in the hospital management system. These permissions control access to various treatment management features, including treatment operations, provider management, and treatment linkages.

## Permission Categories

### 1. Basic Treatment Operations

| Permission          | Description                       | Role Access   |
| ------------------- | --------------------------------- | ------------- |
| `view_treatments`   | View treatment lists and details  | Doctor, Nurse |
| `create_treatments` | Create new treatments             | Doctor        |
| `update_treatments` | Update existing treatment details | Doctor        |
| `delete_treatments` | Delete/remove treatments          | Doctor        |

### 2. Treatment Status Management

| Permission                | Description                                            | Role Access   |
| ------------------------- | ------------------------------------------------------ | ------------- |
| `update_treatment_status` | Update treatment status (e.g., in-progress, completed) | Doctor, Nurse |

### 3. Provider Management

| Permission                   | Description                             | Role Access |
| ---------------------------- | --------------------------------------- | ----------- |
| `manage_treatment_providers` | Add or remove providers from treatments | Doctor      |

### 4. Treatment Links Management

| Permission               | Description                                   | Role Access |
| ------------------------ | --------------------------------------------- | ----------- |
| `manage_treatment_links` | Create, update, and delete treatment linkages | Doctor      |

## Role-Based Permission Matrix

### Doctor Role

- **Full Access**: All treatment permissions
- **Use Cases**:
  - Create and manage treatments for patients
  - Update treatment status and details
  - Manage treatment providers (add/remove team members)
  - Link related treatments together
  - View complete treatment history

### Nurse Role

- **Limited Access**: View and status update permissions
- **Use Cases**:
  - View treatment details and history
  - Update treatment status
  - Monitor treatment progress
  - Cannot create, delete, or manage providers

## Treatment Permissions Detail

### view_treatments

Allows users to:

- View all treatments with filtering options
- Get individual treatment details
- View treatment history for patients
- View treatment links and chains
- Access treatment-related information

**Endpoints Protected:**

- `GET /treatments`
- `GET /treatments/:id`
- `GET /treatments/patient/:patientId/history`
- `GET /treatments/:id/links`
- `GET /treatments/:id/chain`

### create_treatments

Allows users to:

- Create new treatments for patients
- Associate treatments with appointments
- Set treatment type and emergency status
- Define treatment protocols and medications

**Endpoints Protected:**

- `POST /treatments`

### update_treatments

Allows users to:

- Modify treatment details
- Update treatment notes and findings
- Change treatment protocols
- Update medication information

**Endpoints Protected:**

- `PATCH /treatments/:id`

### delete_treatments

Allows users to:

- Remove treatments from the system
- Archive completed treatments
- Delete erroneous treatment records

**Endpoints Protected:**

- `DELETE /treatments/:id`

### update_treatment_status

Allows users to:

- Change treatment status (planned, in-progress, completed, cancelled)
- Track treatment progression
- Mark treatments as completed or cancelled

**Endpoints Protected:**

- `PATCH /treatments/:id/status`

### manage_treatment_providers

Allows users to:

- Add healthcare providers to treatments
- Assign provider roles (primary, consulting, assisting, supervising, specialist)
- Remove providers from treatments
- Manage treatment team composition

**Endpoints Protected:**

- `POST /treatments/:id/providers`
- `DELETE /treatments/:id/providers/:providerId`

### manage_treatment_links

Allows users to:

- Create links between related treatments
- Define link types (follow-up, related, precedes, continuation)
- Update treatment link details
- Delete treatment links
- Build treatment chains for comprehensive care

**Endpoints Protected:**

- `POST /treatments/links`
- `PATCH /treatments/links/:linkId`
- `DELETE /treatments/links/:linkId`

## Permission Implementation

### Frontend Permission Guards

```typescript
// Example permission check in React components
const { user } = useAuth();

// Check if user can create treatments
const canCreateTreatments = user?.permissions?.includes('create_treatments');

// Check if user can manage providers
const canManageProviders = user?.permissions?.includes(
  'manage_treatment_providers',
);
```

### Backend Permission Validation

```typescript
// Example permission decorator in NestJS controllers
@Post()
@RequirePermissions(['create_treatments'])
async create(@Body() createTreatmentDto: CreateTreatmentDto) {
  return this.treatmentsService.create(createTreatmentDto);
}
```

## Permission Assignment

### Automatic Assignment

Permissions are automatically assigned to roles during database seeding:

```typescript
// Doctor role gets all treatment permissions
{
  name: 'Doctor',
  permissions: [
    'view_treatments',
    'create_treatments',
    'update_treatments',
    'delete_treatments',
    'update_treatment_status',
    'manage_treatment_providers',
    'manage_treatment_links',
    // ... other permissions
  ]
}

// Nurse role gets limited treatment permissions
{
  name: 'Nurse',
  permissions: [
    'view_treatments',
    'update_treatment_status',
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
- Treatment creation and deletion is restricted to doctors
- Provider management is limited to doctors to maintain treatment team integrity
- Nurses can update status but cannot modify core treatment details

### Permission Validation

- All treatment endpoints validate user permissions via `PermissionsGuard`
- Frontend components check permissions before rendering features
- Database queries are scoped based on user permissions

### Audit Trail

- All treatment operations are logged with user attribution
- Provider additions/removals are tracked
- Status changes are audited with timestamps
- Treatment link modifications are recorded

## Future Enhancements

### Planned Permissions

- `approve_treatments` - Approve treatments requiring authorization
- `view_treatment_analytics` - Access treatment statistics and reports
- `manage_treatment_templates` - Create reusable treatment templates
- `manage_treatment_protocols` - Define and manage treatment protocols

### Permission Granularity

- Department-specific treatment permissions
- Specialty-specific treatment access controls
- Patient-specific treatment restrictions
- Emergency treatment override permissions

## Usage Examples

### Checking Treatment Creation Permission

```typescript
// Frontend: Check if user can create treatments
const canCreateTreatment = user?.permissions?.includes('create_treatments');

if (!canCreateTreatment) {
  return <Alert>You don't have permission to create treatments</Alert>;
}
```

### Managing Treatment Providers

```typescript
// Backend: Validate provider management permission
@Post(':id/providers')
@RequirePermissions(['manage_treatment_providers'])
async addProvider(
  @Param('id') treatmentId: string,
  @Body('providerId') providerId: string,
  @Body('role') role: ProviderRole,
) {
  return this.treatmentsService.addProviderToTreatment(
    treatmentId,
    providerId,
    role
  );
}
```

### Viewing Treatment History

```typescript
// Frontend: Show treatment history if user has permission
const canViewTreatments = user?.permissions?.includes('view_treatments');

return (
  <TreatmentHistory>
    {canViewTreatments ? (
      <TreatmentList patientId={patientId} />
    ) : (
      <Alert>No permission to view treatments</Alert>
    )}
  </TreatmentHistory>
);
```

## Integration with Appointment System

Treatment permissions work in conjunction with appointment permissions:

- Users need both `view_appointments` and `view_treatments` to see appointment-linked treatments
- Creating treatments may require `create_appointments` for appointment association
- Treatment providers should have `view_provider_availability` to coordinate care

This permission system ensures secure and appropriate access to treatment management features while maintaining flexibility for different user roles and medical workflows.
