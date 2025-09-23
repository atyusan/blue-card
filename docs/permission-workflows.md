# Permission Workflows System

## Overview

The Permission Workflows System manages the approval process for permission requests, ensuring proper authorization and compliance with security policies.

## Features

- **Multi-Level Approval**: Multiple approvers for sensitive permissions
- **Workflow Templates**: Predefined workflow configurations
- **Conditional Logic**: Dynamic approval paths based on conditions
- **Automated Processing**: Automatic workflow progression
- **Audit Trail**: Complete tracking of all workflow actions

## Database Schema

```prisma
model PermissionRequest {
  id          String   @id @default(cuid())
  requesterId String   // User requesting the permission
  permission  String   // The permission being requested
  reason      String   // Why the permission is needed
  urgency     String   // LOW, MEDIUM, HIGH, CRITICAL
  status      String   // PENDING, APPROVED, REJECTED, CANCELLED
  expiresAt   DateTime? // When the request expires
  approverIds Json     // Array of approver IDs
  attachments Json?    // Array of attachment references
  metadata    Json?    // Additional context data
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  requester   User     @relation(fields: [requesterId], references: [id], onDelete: Cascade)
  approvals   PermissionApprover[]
}

model PermissionApprover {
  id                  String   @id @default(cuid())
  permissionRequestId String
  userId              String   // Approver user ID
  role                String   // Approver's role in the workflow
  status              String   // PENDING, APPROVED, REJECTED
  required            Boolean  @default(true) // Whether approval is required
  comments            String?  // Approval comments
  approvedAt          DateTime? // When approval was given
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  permissionRequest PermissionRequest @relation(fields: [permissionRequestId], references: [id], onDelete: Cascade)
  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Workflow Types

### Standard Approval Workflow

1. **Initial Request**: User submits permission request
2. **Manager Approval**: Direct manager reviews and approves
3. **Department Head**: Department head provides final approval
4. **Permission Grant**: System automatically grants permission

### Emergency Approval Workflow

1. **Emergency Request**: User submits urgent request
2. **Immediate Approval**: On-call manager provides immediate approval
3. **Post-Review**: Full review after emergency is resolved

## API Endpoints

- `GET /permission-requests` - List all permission requests
- `POST /permission-requests` - Create new permission request
- `GET /permission-requests/{id}` - Get request details
- `POST /permission-requests/{id}/approve` - Approve request
- `POST /permission-requests/{id}/reject` - Reject request

## Usage Examples

### Creating a Permission Request

```typescript
POST /permission-requests
{
  "permission": "admin_access",
  "reason": "Need temporary admin access to resolve system issue",
  "urgency": "HIGH",
  "expiresAt": "2024-01-20T23:59:59Z",
  "approverIds": ["manager_123", "security_456"],
  "metadata": {
    "systemIssue": "Database connection timeout",
    "affectedServices": ["patient_records", "billing"]
  }
}
```

### Approving a Request

```typescript
POST /permission-requests/{id}/approve
{
  "status": "APPROVED",
  "comments": "Approved for emergency system maintenance",
  "conditions": {
    "timeLimit": "4 hours",
    "scope": "system_maintenance_only"
  }
}
```

## Frontend Components

### PermissionRequestForm

```typescript
function PermissionRequestForm({ onSubmit }) {
  const { createRequest } = usePermissionWorkflows();
  const [formData, setFormData] = useState({
    permission: '',
    reason: '',
    urgency: 'MEDIUM',
    expiresAt: '',
    approverIds: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRequest({
        ...formData,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt)
          : undefined,
      });
      onSubmit();
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        name='permission'
        value={formData.permission}
        onChange={(e) =>
          setFormData({ ...formData, permission: e.target.value })
        }
        required
      >
        <option value=''>Select Permission</option>
        <option value='admin_access'>Admin Access</option>
        <option value='patient_data_export'>Patient Data Export</option>
      </select>

      <select
        name='urgency'
        value={formData.urgency}
        onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
      >
        <option value='LOW'>Low</option>
        <option value='MEDIUM'>Medium</option>
        <option value='HIGH'>High</option>
        <option value='CRITICAL'>Critical</option>
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
      />

      <button type='submit'>Submit Request</button>
    </form>
  );
}
```

## Hooks

### usePermissionWorkflows

```typescript
export function usePermissionWorkflows() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/permission-requests');
      setRequests(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const createRequest = async (data) => {
    const response = await api.post('/permission-requests', data);
    setRequests((prev) => [...prev, response.data]);
    return response.data;
  };

  const approveRequest = async (id, approvalData) => {
    const response = await api.post(
      `/permission-requests/${id}/approve`,
      approvalData
    );
    setRequests((prev) =>
      prev.map((request) => (request.id === id ? response.data : request))
    );
    return response.data;
  };

  const rejectRequest = async (id, rejectionData) => {
    const response = await api.post(
      `/permission-requests/${id}/reject`,
      rejectionData
    );
    setRequests((prev) =>
      prev.map((request) => (request.id === id ? response.data : request))
    );
    return response.data;
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return {
    requests,
    isLoading,
    error,
    createRequest,
    approveRequest,
    rejectRequest,
    refetch: fetchRequests,
  };
}
```

## Business Logic

### Request Creation

```typescript
async createPermissionRequest(createDto: CreatePermissionRequestDto, requesterId: string) {
  const { permission, reason, urgency, expiresAt, approverIds, metadata } = createDto;

  // Check if user already has an active request
  const existingRequest = await this.prisma.permissionRequest.findFirst({
    where: {
      requesterId,
      permission,
      status: 'PENDING',
    },
  });

  if (existingRequest) {
    throw new ConflictException('User already has a pending request for this permission');
  }

  // Create the permission request
  const permissionRequest = await this.prisma.permissionRequest.create({
    data: {
      requesterId,
      permission,
      reason,
      urgency,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata,
    },
  });

  // Create approver assignments
  const approvers = approverIds.map((approverId, index) => ({
    permissionRequestId: permissionRequest.id,
    userId: approverId,
    role: this.getApproverRole(index, urgency),
    required: true,
    status: 'PENDING',
  }));

  await this.prisma.permissionApprover.createMany({ data: approvers });

  return permissionRequest;
}
```

### Approval Logic

```typescript
async approvePermissionRequest(id: string, approvalDto: ApprovePermissionRequestDto, approverId: string) {
  const { status, comments, conditions } = approvalDto;

  // Get the permission request
  const permissionRequest = await this.prisma.permissionRequest.findUnique({
    where: { id },
    include: { approvals: true },
  });

  if (!permissionRequest) {
    throw new NotFoundException(`Permission request with ID ${id} not found`);
  }

  // Find the approver's approval record
  const approval = permissionRequest.approvals.find(
    (a) => a.userId === approverId && a.status === 'PENDING'
  );

  if (!approval) {
    throw new ForbiddenException('User is not authorized to approve this request');
  }

  // Update the approval
  await this.prisma.permissionApprover.update({
    where: { id: approval.id },
    data: { status, comments, approvedAt: new Date() },
  });

  // Check if all required approvals are complete
  const allApprovals = await this.prisma.permissionApprover.findMany({
    where: { permissionRequestId: id },
  });

  const allRequiredApproved = allApprovals
    .filter((a) => a.required)
    .every((a) => a.status === 'APPROVED');

  const anyRejected = allApprovals.some((a) => a.status === 'REJECTED');

  let newStatus: string;
  if (anyRejected) {
    newStatus = 'REJECTED';
  } else if (allRequiredApproved) {
    newStatus = 'APPROVED';
    // Grant the permission
    await this.grantTemporaryPermission(permissionRequest);
  } else {
    newStatus = 'PENDING';
  }

  // Update request status
  await this.prisma.permissionRequest.update({
    where: { id },
    data: { status: newStatus },
  });

  return { status: newStatus, message: 'Request updated successfully' };
}
```

## Security Features

- **Approval Validation**: Verify approver has required role
- **Permission Checks**: Ensure approver can approve the request
- **Conflict Prevention**: Prevent duplicate approvals
- **Audit Trail**: Log all approval actions

## Best Practices

1. **Clear Steps**: Define clear, logical approval steps
2. **Role Assignment**: Assign appropriate roles to each step
3. **Timeout Handling**: Set reasonable timeouts for each step
4. **Escalation Paths**: Define clear escalation procedures

## Future Enhancements

1. **Advanced Conditions**: Complex conditional logic
2. **Dynamic Workflows**: Runtime workflow modification
3. **Integration APIs**: External system integration
4. **Mobile Approval**: Mobile-friendly approval interface
