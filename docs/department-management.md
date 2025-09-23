# Department Management System

## Overview

The Department Management System provides comprehensive organizational structure management for the Blue Card Hospital Management System. It enables administrators to create, organize, and manage departments, assign staff members, and configure services within each department.

## Features

- **Department Creation & Management**: Create and maintain organizational departments
- **Staff Assignment**: Assign staff members to specific departments
- **Service Organization**: Group services by department for better management
- **Hierarchical Structure**: Support for department hierarchies and sub-departments
- **Active/Inactive Management**: Enable/disable departments as needed
- **Audit Trail**: Track all department-related changes

## Database Schema

### Department Model

```prisma
model Department {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  staffMembers StaffMember[]
  services    Service[]
}
```

### Staff Member Model (Department Relation)

```prisma
model StaffMember {
  id             String   @id @default(cuid())
  userId         String   @unique
  employeeId     String   @unique
  departmentId   String?  // Foreign key to Department
  specialization String?
  licenseNumber  String?
  hireDate       DateTime
  isActive       Boolean  @default(true)

  // Relations
  departmentRef Department? @relation(fields: [departmentId], references: [id])
  roleAssignments StaffRoleAssignment[]
}
```

### Service Model (Department Relation)

```prisma
model Service {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal
  departmentId String? // Foreign key to Department
  isActive    Boolean  @default(true)

  // Relations
  department Department? @relation(fields: [departmentId], references: [id])
}
```

## API Endpoints

### Department Management

- `GET /departments` - List all departments
- `POST /departments` - Create new department
- `GET /departments/{id}` - Get department details
- `PUT /departments/{id}` - Update department
- `DELETE /departments/{id}` - Delete department
- `GET /departments/{id}/stats` - Get department statistics

### Staff Management

- `GET /departments/{id}/staff` - List staff in department
- `POST /departments/{id}/staff` - Add staff to department
- `PUT /departments/{id}/staff/{staffId}` - Update staff department assignment
- `DELETE /departments/{id}/staff/{staffId}` - Remove staff from department

### Service Management

- `GET /departments/{id}/services` - List services in department
- `POST /departments/{id}/services` - Add service to department
- `PUT /departments/{id}/services/{serviceId}` - Update service department assignment
- `DELETE /departments/{id}/services/{serviceId}` - Remove service from department

## Usage Examples

### Creating a Department

```typescript
POST /departments
{
  "name": "Cardiology",
  "code": "CARD",
  "description": "Cardiovascular medicine and heart care services"
}
```

### Assigning Staff to Department

```typescript
PUT /staff-members/{staffId}
{
  "departmentId": "department_id_here"
}
```

### Creating a Service in Department

```typescript
POST /services
{
  "name": "Echocardiogram",
  "description": "Heart ultrasound examination",
  "price": 150.00,
  "departmentId": "cardiology_department_id"
}
```

## Frontend Components

### DepartmentList Component

```typescript
import { useDepartments } from '../hooks/useDepartments';

function DepartmentList() {
  const { departments, isLoading, error } = useDepartments();

  if (isLoading) return <div>Loading departments...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {departments.map((dept) => (
        <DepartmentCard key={dept.id} department={dept} />
      ))}
    </div>
  );
}
```

### DepartmentForm Component

```typescript
import { useDepartments } from '../hooks/useDepartments';

function DepartmentForm({ department, onSubmit }) {
  const { createDepartment, updateDepartment } = useDepartments();

  const handleSubmit = async (data) => {
    if (department) {
      await updateDepartment(department.id, data);
    } else {
      await createDepartment(data);
    }
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name='name' placeholder='Department Name' required />
      <input name='code' placeholder='Department Code' required />
      <textarea name='description' placeholder='Description' />
      <button type='submit'>
        {department ? 'Update' : 'Create'} Department
      </button>
    </form>
  );
}
```

### DepartmentDetails Component

```typescript
function DepartmentDetails({ department }) {
  const { staffMembers, services } = department;

  return (
    <div>
      <h2>{department.name}</h2>
      <p>{department.description}</p>

      <h3>Staff Members ({staffMembers.length})</h3>
      <StaffList staff={staffMembers} />

      <h3>Services ({services.length})</h3>
      <ServiceList services={services} />
    </div>
  );
}
```

## Hooks

### useDepartments Hook

```typescript
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const createDepartment = async (data) => {
    const response = await api.post('/departments', data);
    setDepartments((prev) => [...prev, response.data]);
    return response.data;
  };

  const updateDepartment = async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    setDepartments((prev) =>
      prev.map((dept) => (dept.id === id ? response.data : dept))
    );
    return response.data;
  };

  const deleteDepartment = async (id) => {
    await api.delete(`/departments/${id}`);
    setDepartments((prev) => prev.filter((dept) => dept.id !== id));
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return {
    departments,
    isLoading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refetch: fetchDepartments,
  };
}
```

## Business Logic

### Department Validation

```typescript
// Backend validation
export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2,10}$/, {
    message: 'Code must be 2-10 uppercase letters',
  })
  code: string;

  @IsString()
  @IsOptional()
  description?: string;
}
```

### Department Statistics

```typescript
async getDepartmentStats(id: string) {
  const department = await this.prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          staffMembers: true,
          services: true
        }
      },
      staffMembers: {
        where: { isActive: true },
        select: {
          specialization: true,
          hireDate: true
        }
      },
      services: {
        where: { isActive: true },
        select: {
          price: true
        }
      }
    }
  });

  if (!department) {
    throw new NotFoundException('Department not found');
  }

  const totalRevenue = department.services.reduce(
    (sum, service) => sum + Number(service.price),
    0
  );

  const avgStaffTenure = department.staffMembers.length > 0
    ? department.staffMembers.reduce((sum, staff) => {
        const tenure = Date.now() - staff.hireDate.getTime();
        return sum + tenure;
      }, 0) / department.staffMembers.length
    : 0;

  return {
    id: department.id,
    name: department.name,
    staffCount: department._count.staffMembers,
    serviceCount: department._count.services,
    totalRevenue,
    averageStaffTenure: avgStaffTenure / (1000 * 60 * 60 * 24 * 365), // Convert to years
    isActive: department.isActive
  };
}
```

## Integration with Other Systems

### Role Assignment Integration

```typescript
// When assigning roles, consider department scope
async assignRoleToStaff(staffId: string, roleId: string, scope: string, scopeId?: string) {
  const staffMember = await this.prisma.staffMember.findUnique({
    where: { id: staffId },
    include: { departmentRef: true }
  });

  // If scope is DEPARTMENT, use staff member's department
  if (scope === 'DEPARTMENT' && !scopeId) {
    scopeId = staffMember.departmentId;
  }

  return this.prisma.staffRoleAssignment.create({
    data: {
      staffMemberId: staffId,
      roleId,
      scope,
      scopeId,
      assignedAt: new Date()
    }
  });
}
```

### Permission Scoping

```typescript
// Check if user has permission within specific department
async hasPermissionInDepartment(userId: string, permission: string, departmentId: string) {
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
                {
                  scope: 'DEPARTMENT',
                  scopeId: departmentId
                }
              ]
            },
            include: {
              role: true
            }
          }
        }
      }
    }
  });

  const permissions = user.permissions as string[];

  // Check direct permissions
  if (permissions.includes('admin') || permissions.includes(permission)) {
    return true;
  }

  // Check role-based permissions
  const rolePermissions = user.staffMember.roleAssignments
    .flatMap(assignment => assignment.role.permissions as string[]);

  return rolePermissions.includes(permission);
}
```

## Migration Guide

### From String-Based Departments

```sql
-- 1. Create departments table
CREATE TABLE departments (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Insert default departments
INSERT INTO departments (id, name, code, description) VALUES
('dept_cardiology', 'Cardiology', 'CARD', 'Cardiovascular medicine'),
('dept_orthopedics', 'Orthopedics', 'ORTH', 'Bone and joint care'),
('dept_pediatrics', 'Pediatrics', 'PEDI', 'Child healthcare'),
('dept_emergency', 'Emergency Medicine', 'EMER', 'Emergency care services');

-- 3. Add department_id to staff_members table
ALTER TABLE staff_members ADD COLUMN department_id VARCHAR(255);
ALTER TABLE staff_members ADD FOREIGN KEY (department_id) REFERENCES departments(id);

-- 4. Update existing staff members with department assignments
UPDATE staff_members SET department_id = 'dept_cardiology' WHERE department = 'Cardiology';
UPDATE staff_members SET department_id = 'dept_orthopedics' WHERE department = 'Orthopedics';
-- ... continue for other departments

-- 5. Drop old department column
ALTER TABLE staff_members DROP COLUMN department;
```

## Best Practices

### Department Naming

1. **Use Clear, Descriptive Names**: "Cardiology" instead of "Card"
2. **Maintain Consistency**: Follow established naming conventions
3. **Avoid Abbreviations**: Use full names when possible
4. **Consider Hierarchy**: Use prefixes for sub-departments if needed

### Code Management

1. **Keep Codes Short**: 2-10 characters maximum
2. **Use Uppercase**: Maintain consistency with uppercase codes
3. **Avoid Special Characters**: Use only letters and numbers
4. **Make Codes Memorable**: Choose codes that relate to department names

### Staff Assignment

1. **Primary Department**: Each staff member should have one primary department
2. **Cross-Department Roles**: Use role assignments for cross-department access
3. **Temporary Assignments**: Use temporary permissions for short-term needs
4. **Regular Review**: Periodically review and update department assignments

## Monitoring and Analytics

### Department Metrics

- Staff count and turnover rates
- Service utilization and revenue
- Patient satisfaction scores
- Resource allocation efficiency

### Performance Indicators

- Average consultation time per department
- Staff productivity metrics
- Service delivery quality scores
- Cost per patient by department

## Troubleshooting

### Common Issues

1. **Department Not Found**

   - Verify department ID exists
   - Check if department is active
   - Ensure proper database relationships

2. **Staff Assignment Failures**

   - Verify staff member exists
   - Check department is active
   - Ensure no conflicting assignments

3. **Service Organization Issues**
   - Verify service exists
   - Check department is active
   - Ensure proper foreign key relationships

### Debug Information

Enable debug logging for department operations:

```typescript
// Environment configuration
DEPARTMENT_DEBUG = true;
DEPARTMENT_LOG_LEVEL = debug;
```

## Future Enhancements

### Planned Features

1. **Department Hierarchies**: Support for parent-child department relationships
2. **Department Templates**: Predefined department configurations
3. **Advanced Analytics**: Detailed performance and efficiency metrics
4. **Integration APIs**: Third-party system integration
5. **Mobile Support**: Enhanced mobile department management

### Extension Points

1. **Custom Department Types**: Implement specialized department behaviors
2. **External Integrations**: Connect with external organizational systems
3. **Advanced Reporting**: Custom department performance reports
4. **Workflow Integration**: Department-specific approval workflows
