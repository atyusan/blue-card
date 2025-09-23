import { apiClient } from '../lib/api-client';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  staffMembers?: Array<{
    id: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  services?: Array<{
    id: string;
    name?: string;
    isActive?: boolean;
  }>;
  _count?: {
    staffMembers: number;
    services: number;
  };
}

export interface DepartmentStats {
  id: string;
  name: string;
  code: string;
  staffCount: number;
  serviceCount: number;
  totalConsultations: number;
  totalAppointments: number;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentData {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface DepartmentQueryParams {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedDepartmentsResponse {
  data: Department[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: {
    totalDepartments: number;
    activeDepartments: number;
  };
}

class DepartmentsService {
  private baseUrl = '/departments';

  async getDepartments(
    params?: DepartmentQueryParams
  ): Promise<PaginatedDepartmentsResponse> {
    const response = await apiClient.get(this.baseUrl, { params });
    return response.data;
  }

  async getDepartmentById(id: string): Promise<Department> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getDepartmentByCode(code: string): Promise<Department> {
    const response = await apiClient.get(`${this.baseUrl}/code/${code}`);
    return response.data;
  }

  async getDepartmentStats(id: string): Promise<DepartmentStats> {
    const response = await apiClient.get(`${this.baseUrl}/stats/${id}`);
    return response.data;
  }

  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    const response = await apiClient.post(this.baseUrl, data);
    return response.data;
  }

  async updateDepartment(
    id: string,
    data: UpdateDepartmentData
  ): Promise<Department> {
    const response = await apiClient.patch(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteDepartment(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Utility method to get paginated departments (if backend supports it)
  async getPaginatedDepartments(
    params: DepartmentQueryParams
  ): Promise<PaginatedDepartmentsResponse> {
    const response = await apiClient.get(this.baseUrl, { params });
    return response.data;
  }
}

export const departmentsService = new DepartmentsService();
