export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    staffRoleAssignments: number;
  };
  staffRoleAssignments?: StaffRoleAssignment[];
}

export interface StaffRoleAssignment {
  id: string;
  staffMemberId: string;
  roleId: string;
  assignedBy?: string;
  assignedAt: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  staffMember: {
    id: string;
    userId: string;
    employeeId: string;
    departmentId: string;
    specialization?: string;
    isActive: boolean;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      username?: string;
    };
    departmentRef?: {
      id: string;
      name: string;
      code: string;
    };
  };
  role: Role;
  assignedByStaff?: {
    id: string;
    userId: string;
    employeeId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface CreateRoleDto {
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  isActive?: boolean;
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {}

export interface AssignRoleDto {
  roleId: string;
}

export interface PermissionGroup {
  name: string;
  permissions: string[];
}

export interface UserPermissions {
  id: string;
  permissions: string[];
  roles: Role[];
}

