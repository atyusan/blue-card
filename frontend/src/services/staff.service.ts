import { http } from './api';

export interface StaffMember {
  id: string;
  userId: string;
  employeeId: string;
  departmentId?: string;
  department: string;
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
    isActive: boolean;
  };
  departmentRef?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    roleAssignments: number;
  };
}

export interface CreateStaffData {
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  departmentId?: string;
  department: string;
  specialization?: string;
  licenseNumber?: string;
  hireDate: string;
  isActive?: boolean;
}

export interface UpdateStaffData {
  employeeId?: string;
  departmentId?: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  hireDate?: string;
  isActive?: boolean;
}

export interface StaffQueryParams {
  search?: string;
  departmentId?: string;
  department?: string;
  isActive?: boolean;
  specialization?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  totalDepartments: number;
  totalRoles: number;
}

export interface PaginatedStaffResponse {
  data: StaffMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: StaffStats;
}

class StaffService {
  private baseUrl = '/staff';

  async getStaff(query?: StaffQueryParams): Promise<PaginatedStaffResponse> {
    const response = await http.get<PaginatedStaffResponse>(this.baseUrl, {
      params: query,
    });
    return response;
  }

  async getStaffById(id: string): Promise<StaffMember> {
    const response = await http.get<StaffMember>(`${this.baseUrl}/${id}`);
    return response;
  }

  async createStaff(data: CreateStaffData): Promise<StaffMember> {
    const response = await http.post<StaffMember>('/staff', data);
    return response;
  }

  async updateStaff(id: string, data: UpdateStaffData): Promise<StaffMember> {
    const response = await http.patch<StaffMember>(
      `${this.baseUrl}/${id}`,
      data
    );
    return response;
  }

  async deleteStaff(id: string): Promise<void> {
    await http.delete(`/staff/${id}`);
  }

  async getStaffStats(): Promise<StaffStats> {
    const response = await http.get<StaffStats>(`${this.baseUrl}/stats`);
    return response;
  }

  async getStaffByDepartment(departmentId: string): Promise<StaffMember[]> {
    const response = await http.get<StaffMember[]>(
      `${this.baseUrl}/department/${departmentId}`
    );
    return response;
  }

  async getStaffBySpecialization(
    specialization: string
  ): Promise<StaffMember[]> {
    const response = await http.get<StaffMember[]>(
      `${this.baseUrl}/specialization/${specialization}`
    );
    return response;
  }

  async searchStaff(searchTerm: string): Promise<StaffMember[]> {
    const response = await http.get<StaffMember[]>(`${this.baseUrl}/search`, {
      params: { q: searchTerm },
    });
    return response;
  }

  async getActiveStaff(): Promise<StaffMember[]> {
    const response = await this.getStaff({ isActive: true });
    return response.data;
  }

  async getInactiveStaff(): Promise<StaffMember[]> {
    const response = await this.getStaff({ isActive: false });
    return response.data;
  }

  // Role management methods
  async assignRoleToStaff(
    staffId: string,
    roleId: string,
    scope?: string,
    scopeId?: string
  ): Promise<void> {
    await http.post(`${this.baseUrl}/${staffId}/roles`, {
      roleId,
      scope,
      scopeId,
    });
  }

  async removeRoleFromStaff(staffId: string, roleId: string): Promise<void> {
    await http.delete(`${this.baseUrl}/${staffId}/roles/${roleId}`);
  }

  async getStaffRoles(staffId: string): Promise<unknown[]> {
    const response = await http.get<unknown[]>(
      `${this.baseUrl}/${staffId}/roles`
    );
    return response;
  }

  async getStaffStatsById(staffId: string): Promise<unknown> {
    const response = await http.get<unknown>(
      `${this.baseUrl}/${staffId}/stats`
    );
    return response;
  }
}

export const staffService = new StaffService();
