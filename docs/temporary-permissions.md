# Temporary Permissions System

## Overview

The Temporary Permissions System allows administrators to grant time-limited access to specific permissions for users who need temporary elevated privileges.

## Features

- **Time-Limited Access**: Grant permissions with automatic expiration
- **Emergency Permissions**: Quick access for urgent situations
- **Training Permissions**: Temporary access for learning purposes
- **Audit Trail**: Complete tracking of all temporary permission grants
- **Automatic Cleanup**: Scheduled removal of expired permissions

## Database Schema

```prisma
model TemporaryPermission {
  id          String    @id @default(cuid())
  userId      String
  permission  String    // The permission being granted
  grantedBy   String    // Staff member who granted the permission
  grantedAt   DateTime  @default(now())
  expiresAt   DateTime  // When the permission expires
  reason      String    // Why the permission was granted
  isActive    Boolean   @default(true)
  conditions  Json?     // Additional conditions for the permission
  metadata    Json?     // Additional context data
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  grantedByStaff StaffMember @relation(fields: [grantedBy], references: [id])
}
```

## API Endpoints

- `GET /temporary-permissions` - List all temporary permissions
- `POST /temporary-permissions` - Grant temporary permission
- `PUT /temporary-permissions/{id}` - Update permission
- `DELETE /temporary-permissions/{id}` - Revoke permission early
- `POST /temporary-permissions/{id}/extend` - Extend permission duration

## Usage Examples

### Granting Emergency Permission

```typescript
POST /temporary-permissions
{
  "userId": "user_123",
  "permission": "emergency_patient_access",
  "reason": "Emergency cardiac case requiring immediate access",
  "expiresAt": "2024-01-15T23:59:59Z",
  "conditions": {
    "emergencyLevel": "CRITICAL",
    "supervisorApproval": true
  }
}
```

### Extending Permission Duration

```typescript
POST /temporary-permissions/{id}/extend
{
  "newExpiryDate": "2024-02-15T23:59:59Z",
  "reason": "Training extended due to additional modules"
}
```

## Frontend Components

### TemporaryPermissionForm

```typescript
function TemporaryPermissionForm({ onSubmit }) {
  const { grantPermission } = useTemporaryPermissions();
  const [formData, setFormData] = useState({
    userId: '',
    permission: '',
    reason: '',
    expiresAt: '',
    conditions: {},
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await grantPermission({
        ...formData,
        expiresAt: new Date(formData.expiresAt),
      });
      onSubmit();
    } catch (error) {
      console.error('Error granting permission:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        name='userId'
        value={formData.userId}
        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
        required
      >
        <option value=''>Select User</option>
        {/* User options */}
      </select>

      <select
        name='permission'
        value={formData.permission}
        onChange={(e) =>
          setFormData({ ...formData, permission: e.target.value })
        }
        required
      >
        <option value=''>Select Permission</option>
        <option value='emergency_patient_access'>
          Emergency Patient Access
        </option>
        <option value='lab_result_editing'>Lab Result Editing</option>
      </select>

      <textarea
        name='reason'
        value={formData.reason}
        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        placeholder='Reason'
        required
      />

      <input
        type='datetime-local'
        name='expiresAt'
        value={formData.expiresAt}
        onChange={(e) =>
          setFormData({ ...formData, expiresAt: e.target.value })
        }
        required
      />

      <button type='submit'>Grant Permission</button>
    </form>
  );
}
```

## Hooks

### useTemporaryPermissions

```typescript
export function useTemporaryPermissions() {
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/temporary-permissions');
      setPermissions(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const grantPermission = async (data) => {
    const response = await api.post('/temporary-permissions', data);
    setPermissions((prev) => [...prev, response.data]);
    return response.data;
  };

  const revokePermission = async (id) => {
    await api.delete(`/temporary-permissions/${id}`);
    setPermissions((prev) =>
      prev.map((permission) =>
        permission.id === id ? { ...permission, isActive: false } : permission
      )
    );
  };

  const extendPermission = async (id, extensionData) => {
    const response = await api.post(
      `/temporary-permissions/${id}/extend`,
      extensionData
    );
    setPermissions((prev) =>
      prev.map((permission) =>
        permission.id === id ? response.data : permission
      )
    );
    return response.data;
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  return {
    permissions,
    isLoading,
    error,
    grantPermission,
    revokePermission,
    extendPermission,
    refetch: fetchPermissions,
  };
}
```

## Business Logic

### Permission Granting

```typescript
async grantTemporaryPermission(createDto: CreateTemporaryPermissionDto, grantedBy: string) {
  const { userId, permission, reason, expiresAt, conditions, metadata } = createDto;

  // Check if user exists
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

  // Check for existing active permission
  const existingPermission = await this.prisma.temporaryPermission.findFirst({
    where: {
      userId,
      permission,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingPermission) {
    throw new ConflictException('User already has an active temporary permission');
  }

  // Validate expiration date
  const expiryDate = new Date(expiresAt);
  if (expiryDate <= new Date()) {
    throw new BadRequestException('Expiration date must be in the future');
  }

  // Create temporary permission
  const temporaryPermission = await this.prisma.temporaryPermission.create({
    data: { userId, permission, grantedBy, expiresAt: expiryDate, reason, conditions, metadata },
  });

  // Refresh user permissions
  await this.userPermissionsService.refreshUserPermissions(userId);

  return temporaryPermission;
}
```

### Automatic Cleanup

```typescript
async cleanupExpiredPermissions() {
  const expiredPermissions = await this.prisma.temporaryPermission.findMany({
    where: {
      isActive: true,
      expiresAt: { lte: new Date() },
    },
  });

  for (const permission of expiredPermissions) {
    await this.prisma.temporaryPermission.update({
      where: { id: permission.id },
      data: { isActive: false },
    });

    // Refresh user permissions
    await this.userPermissionsService.refreshUserPermissions(permission.userId);
  }

  return expiredPermissions.length;
}

// Schedule cleanup job
@Cron('0 0 * * *') // Run daily at midnight
async handleCleanup() {
  const count = await this.cleanupExpiredPermissions();
  this.logger.log(`Cleaned up ${count} expired temporary permissions`);
}
```

## Security Features

- **Input Validation**: Validate all input parameters
- **Permission Checks**: Verify granter has authority
- **Conflict Detection**: Prevent duplicate permissions
- **Audit Trail**: Log all permission operations
- **Automatic Expiration**: Ensure time limits are enforced

## Best Practices

1. **Justification Required**: Always require a valid reason
2. **Time Limits**: Set reasonable expiration dates
3. **Conditional Access**: Use conditions to limit scope
4. **Regular Review**: Periodically review active permissions
5. **Audit Trail**: Maintain complete audit logs

## Future Enhancements

1. **Advanced Conditions**: Complex conditional logic
2. **Permission Templates**: Predefined permission sets
3. **Integration APIs**: External approval systems
4. **Mobile Notifications**: Expiration alerts
