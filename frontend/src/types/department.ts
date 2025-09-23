export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    staffMembers: number;
    services: number;
    cashRequests: number;
  };
  staffMembers?: any[]; // Will be typed as StaffMember[] to avoid circular dependency
  services?: Service[];
  cashRequests?: CashRequest[];
}

// StaffMember interface moved to @/types/staff

export interface Service {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  departmentId?: string;
  basePrice: number;
  currentPrice: number;
  serviceCode?: string;
  isActive: boolean;
  requiresPrePayment: boolean;
  createdAt: string;
  updatedAt: string;
  department?: any; // Will be typed as Department to avoid circular dependency
}

export interface CashRequest {
  id: string;
  requestNumber: string;
  requesterId: string;
  departmentId: string;
  purpose: string;
  amount: number;
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  notes?: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  department: any; // Will be typed as Department to avoid circular dependency
}

export interface CreateDepartmentDto {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {}
