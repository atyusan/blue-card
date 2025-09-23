# Role Management System

## Overview

The Role Management System provides a flexible and scalable approach to managing user access and permissions within the Blue Card Hospital Management System. It enables administrators to create custom roles, assign permissions, and manage staff access through role-based assignments with advanced scoping capabilities.

## Features

- **Dynamic Role Creation**: Create custom roles with specific permission sets
- **Flexible Permission Assignment**: Assign multiple permissions to each role
- **Advanced Scoping**: Scope roles to global, department, service, or patient levels
- **Time-Limited Assignments**: Set expiration dates for role assignments
- **Conditional Access**: Implement conditional logic for role assignments
- **Audit Trail**: Track all role-related changes and assignments
- **Bulk Operations**: Manage multiple role assignments efficiently

## Database Schema

### Role Model

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  description String?
  permissions Json     // Array of permission strings
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

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
  assignedBy    String?   // Staff member who assigned the role
  assignedAt    DateTime  @default(now())
  isActive      Boolean   @default(true)
  expiresAt     DateTime? // Optional expiration date
  scope         String    @default("GLOBAL") // GLOBAL, DEPARTMENT, SERVICE, PATIENT
  scopeId       String?   // ID of the scoped entity (department, service, patient)
  conditions    Json?     // Array of role conditions
  metadata      Json?     // Additional context data
  createdAt     DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Relations
  staffMember     StaffMember  @relation(fields: [staffMemberId], references: [id], onDelete: Cascade)
  role            Role         @relation(fields: [roleId], references: [id], onDelete: Cascade)
  assignedByStaff StaffMember? @relation("RoleAssignments", fields: [assignedBy], references: [id])

  @@unique([staffMemberId, roleId, scope, scopeId])
  @@map("staff_role_assignments")
}
```

## Role Scoping

### Scope Types

1. **GLOBAL**: Role applies across the entire system
2. **DEPARTMENT**: Role limited to a specific department
3. **SERVICE**: Role limited to a specific service area
4. **PATIENT**: Role limited to specific patient cases

### Scope Examples

```typescript
// Global role - applies everywhere
{
  scope: "GLOBAL",
  scopeId: null
}

// Department-specific role
{
  scope: "DEPARTMENT",
  scopeId: "cardiology_department_id"
}

// Service-specific role
{
  scope: "SERVICE",
  scopeId: "echocardiogram_service_id"
}

// Patient-specific role
{
  scope: "PATIENT",
  scopeId: "patient_123_id"
}
```

## API Endpoints

### Role Management

- `GET /roles` - List all roles
- `POST /roles` - Create new role
- `GET /roles/{id}` - Get role details
- `PUT /roles/{id}` - Update role
- `DELETE /roles/{id}` - Delete role
- `GET /roles/{id}/stats` - Get role statistics

### Role Assignment

- `GET /roles/staff/{staffId}` - Get all roles assigned to staff member
- `POST /roles/staff/{staffId}/assign` - Assign role to staff member
- `DELETE /roles/staff/{staffId}/roles/{roleId}` - Remove role from staff member
- `PUT /roles/staff/{staffId}/roles/{roleId}` - Update role assignment

### Role Templates

- `GET /roles/templates` - List role templates
- `POST /roles/templates` - Create role template
- `GET /roles/templates/{id}` - Get template details
- `PUT /roles/templates/{id}` - Update template
- `DELETE /roles/templates/{id}` - Delete template

## Usage Examples

### Creating a Role

```typescript
POST /roles
{
  "name": "Senior Cardiologist",
  "code": "SENIOR_CARD",
  "description": "Experienced cardiology specialists with advanced permissions",
  "permissions": [
    "view_patients",
    "edit_patients",
    "create_consultations",
    "edit_consultations",
    "view_lab_results",
    "prescribe_medications",
    "approve_treatments",
    "manage_department_staff"
  ]
}
```

### Assigning Role to Staff

```typescript
POST /roles/staff/{staffId}/assign
{
  "roleId": "senior_cardiologist_role_id",
  "scope": "DEPARTMENT",
  "scopeId": "cardiology_department_id",
  "expiresAt": "2024-12-31T23:59:59Z",
  "conditions": {
    "requiresApproval": true,
    "maxPatientsPerDay": 20,
    "allowedSpecializations": ["cardiology", "interventional_cardiology"]
  }
}
```

### Updating Role Assignment

```typescript
PUT /roles/staff/{staffId}/roles/{roleId}
{
  "scope": "SERVICE",
  "scopeId": "cardiac_catheterization_service_id",
  "expiresAt": "2025-06-30T23:59:59Z",
  "conditions": {
    "requiresApproval": false,
    "maxPatientsPerDay": 15
  }
}
```

## Frontend Components

### RoleList Component

```typescript
import { useRoles } from '../hooks/useRoles';

function RoleList() {
  const { roles, isLoading, error, deleteRole } = useRoles();

  if (isLoading) return <div>Loading roles...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {roles.map((role) => (
        <RoleCard
          key={role.id}
          role={role}
          onDelete={() => deleteRole(role.id)}
        />
      ))}
    </div>
  );
}
```

### RoleForm Component

```typescript
import { useRoles } from '../hooks/useRoles';
import { PermissionSelector } from './PermissionSelector';

function RoleForm({ role, onSubmit }) {
  const { createRole, updateRole } = useRoles();
  const [formData, setFormData] = useState({
    name: role?.name || '',
    code: role?.code || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (role) {
        await updateRole(role.id, formData);
      } else {
        await createRole(formData);
      }
      onSubmit();
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name='name'
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder='Role Name'
        required
      />
      <input
        name='code'
        value={formData.code}
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        placeholder='Role Code'
        required
      />
      <textarea
        name='description'
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder='Description'
      />
      <PermissionSelector
        selectedPermissions={formData.permissions}
        onChange={(permissions) => setFormData({ ...formData, permissions })}
      />
      <button type='submit'>{role ? 'Update' : 'Create'} Role</button>
    </form>
  );
}
```

### RoleAssignmentForm Component

```typescript
import { useRoles } from '../hooks/useRoles';
import { useDepartments } from '../hooks/useDepartments';

function RoleAssignmentForm({ staffId, onSubmit }) {
  const { assignRoleToStaff } = useRoles();
  const { departments } = useDepartments();
  const [formData, setFormData] = useState({
    roleId: '',
    scope: 'GLOBAL',
    scopeId: '',
    expiresAt: '',
    conditions: {},
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const assignmentData = {
        ...formData,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt)
          : undefined,
        scopeId: formData.scope === 'GLOBAL' ? undefined : formData.scopeId,
      };

      await assignRoleToStaff(staffId, assignmentData);
      onSubmit();
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        name='roleId'
        value={formData.roleId}
        onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
        required
      >
        <option value=''>Select Role</option>
        {/* Role options */}
      </select>

      <select
        name='scope'
        value={formData.scope}
        onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
      >
        <option value='GLOBAL'>Global</option>
        <option value='DEPARTMENT'>Department</option>
        <option value='SERVICE'>Service</option>
        <option value='PATIENT'>Patient</option>
      </select>

      {formData.scope !== 'GLOBAL' && (
        <select
          name='scopeId'
          value={formData.scopeId}
          onChange={(e) =>
            setFormData({ ...formData, scopeId: e.target.value })
          }
          required
        >
          <option value=''>Select {formData.scope}</option>
          {/* Scope options based on selected scope */}
        </select>
      )}

      <input
        type='datetime-local'
        name='expiresAt'
        value={formData.expiresAt}
        onChange={(e) =>
          setFormData({ ...formData, expiresAt: e.target.value })
        }
      />

      <button type='submit'>Assign Role</button>
    </form>
  );
}
```

## Hooks

### useRoles Hook

```typescript
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useRoles() {
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/roles');
      setRoles(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const createRole = async (data) => {
    const response = await api.post('/roles', data);
    setRoles((prev) => [...prev, response.data]);
    return response.data;
  };

  const updateRole = async (id, data) => {
    const response = await api.put(`/roles/${id}`, data);
    setRoles((prev) =>
      prev.map((role) => (role.id === id ? response.data : role))
    );
    return response.data;
  };

  const deleteRole = async (id) => {
    await api.delete(`/roles/${id}`);
    setRoles((prev) => prev.filter((role) => role.id !== id));
  };

  const assignRoleToStaff = async (staffId, assignmentData) => {
    const response = await api.post(
      `/roles/staff/${staffId}/assign`,
      assignmentData
    );
    return response.data;
  };

  const removeRoleFromStaff = async (staffId, roleId) => {
    await api.delete(`/roles/staff/${staffId}/roles/${roleId}`);
  };

  const getStaffRoles = async (staffId) => {
    const response = await api.get(`/roles/staff/${staffId}`);
    return response.data;
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return {
    roles,
    isLoading,
    error,
    createRole,
    updateRole,
    deleteRole,
    assignRoleToStaff,
    removeRoleFromStaff,
    getStaffRoles,
    refetch: fetchRoles,
  };
}
```

## Business Logic

### Role Validation

```typescript
// Backend validation
export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z_]{2,20}$/, {
    message: 'Code must be 2-20 uppercase letters and underscores',
  })
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  permissions: string[];
}

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsEnum(['GLOBAL', 'DEPARTMENT', 'SERVICE', 'PATIENT'])
  @IsOptional()
  scope?: string = 'GLOBAL';

  @IsString()
  @IsOptional()
  scopeId?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsObject()
  @IsOptional()
  conditions?: any;
}
```

### Role Assignment Logic

```typescript
async assignRoleToStaff(
  staffId: string,
  assignRoleDto: AssignRoleDto,
  assignedBy?: string,
  scope?: string,
  scopeId?: string,
  conditions?: any,
  expiresAt?: Date,
) {
  const { roleId } = assignRoleDto;

  // Check if staff member exists
  const staffMember = await this.prisma.staffMember.findUnique({
    where: { id: staffId },
  });

  if (!staffMember) {
    throw new NotFoundException(`Staff member with ID ${staffId} not found`);
  }

  // Check if role exists
  const role = await this.prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new NotFoundException(`Role with ID ${roleId} not found`);
  }

  // Check for existing assignment with same scope
  const existingAssignment = await this.prisma.staffRoleAssignment.findFirst({
    where: {
      staffMemberId: staffId,
      roleId: roleId,
      scope: scope || 'GLOBAL',
      scopeId: scopeId || null,
    },
  });

  if (existingAssignment) {
    if (existingAssignment.isActive) {
      throw new ConflictException(
        'Role is already assigned to this staff member with the same scope',
      );
    } else {
      // Reactivate existing assignment
      const reactivatedAssignment = await this.prisma.staffRoleAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          isActive: true,
          assignedAt: new Date(),
          assignedBy,
          scope,
          scopeId,
          conditions,
          expiresAt,
        },
      });

      // Refresh user permissions
      if (reactivatedAssignment.staffMemberId) {
        const staffMember = await this.prisma.staffMember.findUnique({
          where: { id: reactivatedAssignment.staffMemberId },
          select: { userId: true },
        });

        if (staffMember?.userId) {
          await this.userPermissionsService.refreshUserPermissions(
            staffMember.userId,
          );
        }
      }

      return reactivatedAssignment;
    }
  }

  // Create new role assignment
  const roleAssignment = await this.prisma.staffRoleAssignment.create({
    data: {
      staffMemberId: staffId,
      roleId: roleId,
      assignedBy,
      scope,
      scopeId,
      conditions,
      expiresAt,
    },
  });

  // Refresh user permissions
  if (roleAssignment.staffMemberId) {
    const staffMember = await this.prisma.staffMember.findUnique({
      where: { id: roleAssignment.staffMemberId },
      select: { userId: true },
    });

    if (staffMember?.userId) {
      await this.userPermissionsService.refreshUserPermissions(
        staffMember.userId,
      );
    }
  }

  return roleAssignment;
}
```

### Role Statistics

```typescript
async getRoleStats(id: string) {
  const role = await this.prisma.role.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          staffRoleAssignments: true,
        },
      },
      staffRoleAssignments: {
        where: { isActive: true },
        include: {
          staffMember: {
            include: {
              departmentRef: true,
            },
          },
        },
      },
    },
  });

  if (!role) {
    throw new NotFoundException(`Role with ID ${id} not found`);
  }

  // Calculate statistics
  const activeAssignments = role.staffRoleAssignments;
  const departmentDistribution = activeAssignments.reduce((acc, assignment) => {
    const deptName = assignment.staffMember.departmentRef?.name || 'Unassigned';
    acc[deptName] = (acc[deptName] || 0) + 1;
    return acc;
  }, {});

  const scopeDistribution = activeAssignments.reduce((acc, assignment) => {
    acc[assignment.scope] = (acc[assignment.scope] || 0) + 1;
    return acc;
  }, {});

  const expiringSoon = activeAssignments.filter(assignment => {
    if (!assignment.expiresAt) return false;
    const daysUntilExpiry = (assignment.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }).length;

  return {
    id: role.id,
    name: role.name,
    code: role.code,
    totalAssignments: role._count.staffRoleAssignments,
    activeAssignments: activeAssignments.length,
    departmentDistribution,
    scopeDistribution,
    expiringSoon,
    permissions: role.permissions as string[],
    isActive: role.isActive,
  };
}
```

## Integration with Permission System

### Permission Aggregation

```typescript
async getUserPermissions(userId: string): Promise<string[]> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      staffMember: {
        include: {
          roleAssignments: {
            where: { isActive: true },
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException(`User with ID ${userId} not found`);
  }

  const permissions = new Set<string>();

  // Add direct user permissions
  if (user.permissions) {
    const userPermissions = user.permissions as string[];
    userPermissions.forEach(permission => permissions.add(permission));
  }

  // Add role-based permissions
  if (user.staffMember?.roleAssignments) {
    user.staffMember.roleAssignments.forEach(assignment => {
      const rolePermissions = assignment.role.permissions as string[];
      rolePermissions.forEach(permission => permissions.add(permission));
    });
  }

  // Add temporary permissions
  const temporaryPermissions = await this.prisma.temporaryPermission.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
  });

  temporaryPermissions.forEach(temp => permissions.add(temp.permission));

  return Array.from(permissions);
}
```

### Scoped Permission Checking

```typescript
async hasPermissionInScope(
  userId: string,
  permission: string,
  scope: string,
  scopeId?: string
): Promise<boolean> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      staffMember: {
        include: {
          roleAssignments: {
            where: {
              isActive: true,
              OR: [
                { scope: 'GLOBAL' },
                { scope, scopeId }
              ]
            },
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (!user) return false;

  // Check direct permissions (always global)
  if (user.permissions) {
    const userPermissions = user.permissions as string[];
    if (userPermissions.includes('admin') || userPermissions.includes(permission)) {
      return true;
    }
  }

  // Check role-based permissions
  if (user.staffMember?.roleAssignments) {
    for (const assignment of user.staffMember.roleAssignments) {
      const rolePermissions = assignment.role.permissions as string[];
      if (rolePermissions.includes(permission)) {
        // Check conditions if they exist
        if (assignment.conditions) {
          const conditions = assignment.conditions as any;
          if (this.evaluateConditions(conditions, { userId, permission, scope, scopeId })) {
            return true;
          }
        } else {
          return true;
        }
      }
    }
  }

  return false;
}

private evaluateConditions(conditions: any, context: any): boolean {
  // Implement condition evaluation logic
  // This could include time-based, location-based, or other conditional logic
  return true; // Simplified for example
}
```

## Role Templates

### Template Structure

```typescript
interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  permissions: string[];
  isSystem: boolean;
  version: string;
  metadata?: {
    recommendedFor?: string[];
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    requiresApproval?: boolean;
    maxDuration?: number;
  };
}
```

### Common Role Templates

#### Medical Staff

- **Junior Doctor**: Basic patient viewing and consultation creation
- **Senior Doctor**: Advanced patient management and treatment approval
- **Specialist**: Specialized area permissions with advanced capabilities
- **Consultant**: Full department access with administrative capabilities

#### Nursing Staff

- **Staff Nurse**: Basic patient care and observation recording
- **Senior Nurse**: Advanced patient care and supervision
- **Nurse Manager**: Department management and staff supervision

#### Administrative Staff

- **Receptionist**: Patient registration and appointment scheduling
- **Administrator**: General administrative functions
- **Manager**: Department management and reporting

#### Support Staff

- **Lab Technician**: Laboratory test management
- **Pharmacist**: Medication management and dispensing
- **Radiologist**: Imaging and diagnostic services

## Best Practices

### Role Design

1. **Principle of Least Privilege**: Grant minimum required permissions
2. **Separation of Duties**: Avoid combining conflicting permissions
3. **Regular Review**: Periodically audit and update role definitions
4. **Documentation**: Maintain clear documentation for each role

### Permission Organization

1. **Logical Grouping**: Group related permissions together
2. **Consistent Naming**: Use consistent permission naming conventions
3. **Granular Control**: Provide fine-grained permission control
4. **Inheritance**: Use role hierarchies for permission inheritance

### Assignment Management

1. **Scope Appropriately**: Use appropriate scope for each assignment
2. **Time Limits**: Set reasonable expiration dates for temporary assignments
3. **Conditional Logic**: Implement conditions for complex access requirements
4. **Audit Trail**: Maintain comprehensive audit logs

## Monitoring and Analytics

### Role Usage Metrics

- Assignment counts and trends
- Permission usage patterns
- Scope distribution analysis
- Expiration and renewal rates

### Security Analytics

- Unusual permission combinations
- Excessive privilege assignments
- Failed access attempts
- Suspicious role modifications

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**

   - Check role assignments are active
   - Verify scope and scopeId values
   - Check role permissions include required access
   - Verify conditions are met

2. **Role Assignment Failures**

   - Check for conflicting assignments
   - Verify role and staff member exist
   - Check scope constraints
   - Verify assignment conditions

3. **Permission Aggregation Issues**
   - Check role assignment status
   - Verify permission format in roles
   - Check temporary permission status
   - Verify user permission field format

### Debug Information

Enable debug logging for role operations:

```typescript
// Environment configuration
ROLE_DEBUG = true;
ROLE_LOG_LEVEL = debug;
ROLE_PERMISSION_DEBUG = true;
```

## Future Enhancements

### Planned Features

1. **Role Hierarchies**: Parent-child role relationships
2. **Advanced Conditions**: Complex conditional logic for assignments
3. **Role Analytics**: Detailed usage and performance analytics
4. **Integration APIs**: Third-party role management integration
5. **Mobile Support**: Enhanced mobile role management

### Extension Points

1. **Custom Role Types**: Implement specialized role behaviors
2. **External Integrations**: Connect with external identity providers
3. **Advanced Workflows**: Complex role approval and assignment workflows
4. **Role Plugins**: Add new role types and behaviors
