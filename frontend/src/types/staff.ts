// Staff-related types to avoid circular dependencies
export interface StaffMember {
  id: string;
  userId: string;
  employeeId: string;
  departmentId: string;
  specialization?: string;
  licenseNumber?: string;
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
  };
  departmentRef?: any; // Will be typed as Department to avoid circular dependency
}
