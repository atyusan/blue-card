# Authentication & Authorization System

## Overview

The Blue Card Hospital Management System implements a comprehensive, role-based authentication and authorization system that provides granular control over user access and permissions. This system replaces the previous hardcoded role approach with a dynamic, database-driven permission management system.

## Architecture

### Core Components

1. **User Model** - Central user entity with aggregated permissions
2. **Staff Member Model** - Healthcare staff information linked to users
3. **Department Model** - Organizational structure for staff and services
4. **Role Model** - Configurable roles with permission sets
5. **Permission System** - Dynamic permission management and enforcement
6. **JWT Authentication** - Secure token-based authentication

### Key Features

- **Dynamic Permissions**: Permissions are stored as JSON and can be modified without code changes
- **Role-Based Access Control (RBAC)**: Users inherit permissions through assigned roles
- **Attribute-Based Access Control (ABAC)**: Additional context-based permission rules
- **Temporary Permissions**: Time-limited access grants with approval workflows
- **Permission Auditing**: Comprehensive logging of all permission-related activities
- **Multi-Approver Workflows**: Configurable approval processes for sensitive operations

## Database Schema

### User Model

```prisma
model User {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String
  email       String   @unique
  username    String?  @unique
  password    String
  permissions Json?    // Aggregated permissions from roles and direct assignments
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  staffMember StaffMember?
  permissionRequests PermissionRequest[]
  permissionApprovals PermissionApprover[]
  permissionAudits PermissionAudit[]
  temporaryPermissions TemporaryPermission[]
}
```

### Staff Member Model

```prisma
model StaffMember {
  id             String   @id @default(cuid())
  userId         String   @unique
  employeeId     String   @unique
  departmentId   String?
  specialization String?
  licenseNumber  String?
  hireDate       DateTime
  isActive       Boolean  @default(true)

  // Relations
  departmentRef Department?
  roleAssignments StaffRoleAssignment[]
  temporaryPermissionsGranted TemporaryPermission[]
}
```

### Department Model

```prisma
model Department {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  description String?
  isActive    Boolean  @default(true)

  // Relations
  staffMembers StaffMember[]
  services    Service[]
}
```

### Role Model

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  description String?
  permissions Json     // Array of permission strings
  isActive    Boolean  @default(true)

  // Relations
  staffRoleAssignments StaffRoleAssignment[]
}
```

### Staff Role Assignment Model

```prisma
model StaffRoleAssignment {
  id            String    @id @default(cuid())
  staffMemberId String
  roleId        String
  assignedBy    String?
  assignedAt    DateTime  @default(now())
  isActive      Boolean   @default(true)
  expiresAt     DateTime?
  scope         String    @default("GLOBAL")
  scopeId       String?
  conditions    Json?

  // Relations
  staffMember StaffMember
  role        Role
  assignedByStaff StaffMember?

  @@unique([staffMemberId, roleId, scope, scopeId])
}
```

## Permission System

### Permission Structure

Permissions are stored as JSON arrays in the following format:

```json
[
  "view_patients",
  "edit_patients",
  "delete_patients",
  "view_consultations",
  "create_consultations",
  "admin"
]
```

### Common Permissions

#### Patient Management

- `view_patients` - View patient information
- `create_patients` - Create new patient records
- `edit_patients` - Modify existing patient data
- `delete_patients` - Remove patient records
- `view_patient_history` - Access patient medical history

#### Consultation Management

- `view_consultations` - View consultation records
- `create_consultations` - Schedule new consultations
- `edit_consultations` - Modify consultation details
- `cancel_consultations` - Cancel scheduled consultations

#### Financial Operations

- `view_invoices` - Access invoice information
- `create_invoices` - Generate new invoices
- `process_payments` - Handle payment processing
- `view_financial_reports` - Access financial analytics

#### Administrative Functions

- `admin` - Full system access (overrides all other permissions)
- `manage_users` - User account management
- `manage_roles` - Role and permission configuration
- `system_configuration` - System settings management

### Permission Aggregation

The system automatically aggregates permissions from multiple sources:

1. **Role-Based Permissions**: Inherited from assigned roles
2. **Direct User Permissions**: Explicitly assigned to users
3. **Temporary Permissions**: Time-limited access grants
4. **Department-Specific Permissions**: Scoped to organizational units

## Authentication Flow

### 1. User Login

```typescript
POST /auth/login
{
  "email": "user@hospital.com",
  "password": "secure_password"
}
```

### 2. JWT Token Generation

The system generates a JWT token containing:

```json
{
  "sub": "user_id",
  "email": "user@hospital.com",
  "permissions": ["view_patients", "create_consultations"],
  "staffMemberId": "staff_member_id",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### 3. Permission Validation

For each protected endpoint, the system:

1. Extracts the JWT token
2. Validates the token signature
3. Checks user permissions against required permissions
4. Grants or denies access accordingly

## Authorization Implementation

### Permission Guards

The system uses NestJS guards to protect endpoints:

```typescript
@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientsController {
  @Get()
  @RequirePermissions(['view_patients'])
  async findAll() {
    // Only users with view_patients permission can access
  }

  @Post()
  @RequirePermissions(['create_patients'])
  async create() {
    // Only users with create_patients permission can access
  }
}
```

### Permission Decorators

#### @RequirePermissions(permissions: string[], requireAll?: boolean)

Requires the user to have specific permissions:

```typescript
@RequirePermissions(['view_patients', 'view_consultations'])
// User must have BOTH permissions

@RequirePermissions(['view_patients', 'view_consultations'], false)
// User must have AT LEAST ONE permission
```

#### @RequirePermission(permission: string)

Requires a single specific permission:

```typescript
@RequirePermission('admin')
// User must have admin permission
```

#### @RequireAdmin

Requires admin-level access:

```typescript
@RequireAdmin()
// User must have admin permission
```

### Frontend Permission Checking

The frontend uses the `usePermissions` hook for permission validation:

```typescript
import { usePermissions } from '../hooks/usePermissions';

function PatientList() {
  const { canViewPatients, canCreatePatients } = usePermissions();

  return (
    <div>
      {canViewPatients && <PatientTable />}
      {canCreatePatients && <CreatePatientButton />}
    </div>
  );
}
```

## Role Management

### Creating Roles

```typescript
POST /roles
{
  "name": "Senior Doctor",
  "code": "SENIOR_DOCTOR",
  "description": "Experienced medical practitioners",
  "permissions": [
    "view_patients",
    "edit_patients",
    "create_consultations",
    "edit_consultations",
    "view_lab_results",
    "prescribe_medications"
  ]
}
```

### Assigning Roles to Staff

```typescript
POST /roles/staff/{staffId}/assign
{
  "roleId": "role_id",
  "scope": "DEPARTMENT",
  "scopeId": "department_id",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Role Scoping

Roles can be scoped to different organizational levels:

- **GLOBAL**: Applies across the entire system
- **DEPARTMENT**: Limited to a specific department
- **SERVICE**: Limited to a specific service area
- **PATIENT**: Limited to specific patient cases

## Temporary Permissions

### Requesting Temporary Access

```typescript
POST /permission-requests
{
  "permission": "view_sensitive_data",
  "reason": "Emergency patient case review",
  "urgency": "HIGH",
  "expiresAt": "2024-01-15T18:00:00Z",
  "approverIds": ["approver1", "approver2"]
}
```

### Approval Workflow

1. **Request Creation**: User submits permission request
2. **Approver Assignment**: System assigns approvers based on configuration
3. **Review Process**: Approvers review and approve/reject requests
4. **Permission Grant**: Upon approval, temporary permission is granted
5. **Automatic Expiration**: Permission automatically expires at specified time

### Temporary Permission Structure

```typescript
interface TemporaryPermission {
  id: string;
  userId: string;
  permission: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date;
  reason: string;
  isActive: boolean;
}
```

## Security Features

### Multi-Factor Authentication (MFA)

The system supports MFA for high-risk permissions:

```typescript
interface PermissionSecurity {
  permission: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresMFA: boolean;
  requiresApproval: boolean;
  maxDuration?: number;
  allowedIPs?: string[];
  allowedDevices?: string[];
  auditLevel: 'BASIC' | 'STANDARD' | 'DETAILED' | 'COMPREHENSIVE';
}
```

### IP and Device Restrictions

Permissions can be restricted to specific:

- IP address ranges
- Device identifiers
- Time windows
- Geographic locations

### Audit Logging

All permission-related activities are logged:

```typescript
interface PermissionAudit {
  id: string;
  userId: string;
  permission: string;
  action: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  metadata?: any;
}
```

## API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/profile` - Get current user profile

### Permission Management

- `GET /permissions` - List all available permissions
- `GET /permissions/user/{userId}` - Get user permissions
- `POST /permissions/user/{userId}` - Add user permission
- `DELETE /permissions/user/{userId}/{permission}` - Remove user permission

### Role Management

- `GET /roles` - List all roles
- `POST /roles` - Create new role
- `GET /roles/{id}` - Get role details
- `PUT /roles/{id}` - Update role
- `DELETE /roles/{id}` - Delete role
- `POST /roles/staff/{staffId}/assign` - Assign role to staff
- `DELETE /roles/staff/{staffId}/roles/{roleId}` - Remove role from staff

### Permission Requests

- `GET /permission-requests` - List permission requests
- `POST /permission-requests` - Create permission request
- `GET /permission-requests/{id}` - Get request details
- `PUT /permission-requests/{id}` - Update request
- `POST /permission-requests/{id}/approve` - Approve/reject request
- `POST /permission-requests/{id}/cancel` - Cancel request
- `DELETE /permission-requests/{id}` - Delete request

### Temporary Permissions

- `GET /temporary-permissions` - List temporary permissions
- `POST /temporary-permissions` - Grant temporary permission
- `PUT /temporary-permissions/{id}` - Update temporary permission
- `DELETE /temporary-permissions/{id}` - Revoke temporary permission

## Frontend Integration

### Permission Guard Component

```typescript
import { PermissionGuard } from '../components/auth/PermissionGuard';

function AdminPanel() {
  return (
    <PermissionGuard permissions={['admin']}>
      <AdminDashboard />
    </PermissionGuard>
  );
}
```

### Route Protection

```typescript
import { PermissionGuard } from '../components/auth/PermissionGuard';

const routes = [
  {
    path: '/patients',
    element: (
      <PermissionGuard permissions={['view_patients']}>
        <PatientsPage />
      </PermissionGuard>
    ),
  },
];
```

### Conditional Rendering

```typescript
function PatientActions({ patient }) {
  const { canEditPatients, canDeletePatients } = usePermissions();

  return (
    <div>
      {canEditPatients && <EditButton patient={patient} />}
      {canDeletePatients && <DeleteButton patient={patient} />}
    </div>
  );
}
```

## Migration Guide

### From Old System

1. **Update User Records**: Add `permissions` field to existing users
2. **Create Default Roles**: Set up basic roles (Admin, Doctor, Nurse, etc.)
3. **Assign Roles**: Link existing staff to appropriate roles
4. **Update Frontend**: Replace hardcoded role checks with permission checks
5. **Test Permissions**: Verify all access controls work correctly

### Database Migration

```sql
-- Add permissions field to users table
ALTER TABLE users ADD COLUMN permissions JSON;

-- Create default roles
INSERT INTO roles (id, name, code, permissions) VALUES
('admin_role', 'Administrator', 'ADMIN', '["admin"]'),
('doctor_role', 'Doctor', 'DOCTOR', '["view_patients", "edit_patients", "create_consultations"]'),
('nurse_role', 'Nurse', 'NURSE', '["view_patients", "view_consultations"]');

-- Assign admin role to existing admin users
UPDATE users SET permissions = '["admin"]' WHERE email = 'admin@hospital.com';
```

## Best Practices

### Permission Design

1. **Granular Permissions**: Use specific, actionable permissions
2. **Consistent Naming**: Follow `action_resource` pattern
3. **Least Privilege**: Grant minimum required permissions
4. **Regular Review**: Periodically audit and update permissions

### Security Considerations

1. **JWT Expiration**: Set reasonable token expiration times
2. **HTTPS Only**: Always use HTTPS in production
3. **Rate Limiting**: Implement API rate limiting
4. **Input Validation**: Validate all permission-related inputs
5. **Audit Logging**: Log all permission changes and access attempts

### Performance Optimization

1. **Permission Caching**: Cache user permissions in memory
2. **Database Indexing**: Index permission-related fields
3. **Lazy Loading**: Load permissions only when needed
4. **Batch Operations**: Use batch operations for bulk permission updates

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**

   - Check user has required permissions
   - Verify role assignments are active
   - Check permission scope restrictions

2. **JWT Token Issues**

   - Verify token hasn't expired
   - Check token signature validation
   - Ensure proper token format

3. **Role Assignment Problems**
   - Verify role exists and is active
   - Check scope and scopeId values
   - Ensure no conflicting assignments

### Debug Mode

Enable debug logging for permission-related operations:

```typescript
// In environment configuration
PERMISSION_DEBUG = true;
PERMISSION_LOG_LEVEL = debug;
```

This will log detailed information about permission checks and decisions.

## Future Enhancements

### Planned Features

1. **Permission Templates**: Predefined permission sets for common roles
2. **Advanced Workflows**: Complex approval chains with conditions
3. **Permission Analytics**: Usage analytics and optimization suggestions
4. **Integration APIs**: Third-party system integration
5. **Mobile Support**: Enhanced mobile authentication and permissions

### Extension Points

The system is designed to be extensible:

1. **Custom Permission Validators**: Implement custom permission logic
2. **External Permission Sources**: Integrate with external identity providers
3. **Advanced Scoping**: Implement custom scoping rules
4. **Permission Plugins**: Add new permission types and behaviors

## Support and Maintenance

### Monitoring

- Monitor permission request volumes and approval times
- Track failed authentication attempts
- Monitor temporary permission usage patterns
- Review audit logs for suspicious activity

### Maintenance Tasks

- Regular permission audits and cleanup
- Update role definitions based on organizational changes
- Review and update security policies
- Backup and restore permission configurations

### Contact Information

For technical support or questions about the authentication system:

- **System Administrator**: admin@hospital.com
- **Technical Support**: tech-support@hospital.com
- **Security Team**: security@hospital.com
