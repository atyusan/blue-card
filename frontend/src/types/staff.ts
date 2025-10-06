// Staff-related types to avoid circular dependencies
export interface StaffMember {
  id: string;
  userId: string;
  employeeId: string;
  departmentId?: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  specialization?: string;
  licenseNumber?: string;
  serviceProvider?: boolean;
  hireDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username?: string;
    isActive: boolean;
  };
  _count?: {
    roleAssignments: number;
  };
}
