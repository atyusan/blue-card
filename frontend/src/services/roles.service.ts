import { apiClient } from '../lib/api-client';

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
}

export interface CreateRoleData {
  name: string;
  code: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export type UpdateRoleData = Partial<CreateRoleData>;

export interface RoleQueryParams {
  isActive?: boolean;
  search?: string;
}

export interface RoleStats {
  id: string;
  name: string;
  code: string;
  totalAssignments: number;
  activeAssignments: number;
  departmentDistribution: Record<string, number>;
}

export interface AssignRoleData {
  roleId: string;
  assignedBy?: string;
  expiresAt?: string;
}

class RolesService {
  // ===== ROLE CRUD OPERATIONS =====

  // Get all roles with filtering
  async getRoles(params: RoleQueryParams = {}): Promise<Role[]> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<Role[]>(
      `/roles?${queryParams.toString()}`
    );
    return response.data;
  }

  // Get role by ID
  async getRoleById(id: string): Promise<Role> {
    const response = await apiClient.get<Role>(`/roles/${id}`);
    return response.data;
  }

  // Get role by code
  async getRoleByCode(code: string): Promise<Role> {
    const response = await apiClient.get<Role>(`/roles/code/${code}`);
    return response.data;
  }

  // Create new role
  async createRole(roleData: CreateRoleData): Promise<Role> {
    const response = await apiClient.post<Role>('/roles', roleData);
    return response.data;
  }

  // Update role
  async updateRole(id: string, roleData: UpdateRoleData): Promise<Role> {
    const response = await apiClient.patch<Role>(`/roles/${id}`, roleData);
    return response.data;
  }

  // Delete role
  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  }

  // Get role statistics
  async getRoleStats(id: string): Promise<RoleStats> {
    const response = await apiClient.get<RoleStats>(`/roles/stats/${id}`);
    return response.data;
  }

  // ===== ROLE ASSIGNMENT OPERATIONS =====

  // Assign role to staff member
  async assignRoleToStaff(
    staffId: string,
    assignData: AssignRoleData
  ): Promise<void> {
    await apiClient.post(`/roles/staff/${staffId}/assign`, assignData);
  }

  // Remove role from staff member
  async removeRoleFromStaff(staffId: string, roleId: string): Promise<void> {
    await apiClient.delete(`/roles/staff/${staffId}/roles/${roleId}`);
  }

  // Get staff member roles
  async getStaffRoles(staffId: string): Promise<Role[]> {
    const response = await apiClient.get<Role[]>(`/roles/staff/${staffId}`);
    return response.data;
  }

  // ===== UTILITY METHODS =====

  // Search roles
  async searchRoles(query: string): Promise<Role[]> {
    return this.getRoles({ search: query });
  }

  // Get active roles
  async getActiveRoles(): Promise<Role[]> {
    return this.getRoles({ isActive: true });
  }

  // Get inactive roles
  async getInactiveRoles(): Promise<Role[]> {
    return this.getRoles({ isActive: false });
  }
}

export const rolesService = new RolesService();
export default rolesService;
