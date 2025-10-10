import api from './api';

export interface Permission {
  name: string;
  displayName: string;
  description: string | null;
  module: string | null;
}

export interface GroupedPermissions {
  [category: string]: Permission[];
}

export interface PermissionsResponse {
  permissions: Array<{
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    category: string;
    module: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  groupedPermissions: GroupedPermissions;
  categories: string[];
}

class PermissionsService {
  private readonly baseUrl = '/permissions';

  /**
   * Get all permissions grouped by category
   */
  async getAll(): Promise<PermissionsResponse> {
    const response = await api.get<PermissionsResponse>(this.baseUrl);
    return response.data;
  }

  /**
   * Get all permission categories
   */
  async getCategories(): Promise<string[]> {
    const response = await api.get<string[]>(`${this.baseUrl}/categories`);
    return response.data;
  }

  /**
   * Get all permission modules
   */
  async getModules(): Promise<string[]> {
    const response = await api.get<string[]>(`${this.baseUrl}/modules`);
    return response.data;
  }

  /**
   * Get permissions by category
   */
  async getByCategory(category: string): Promise<Permission[]> {
    const response = await api.get<Permission[]>(
      `${this.baseUrl}/by-category`,
      {
        params: { category },
      }
    );
    return response.data;
  }

  /**
   * Get permissions by module
   */
  async getByModule(module: string): Promise<Permission[]> {
    const response = await api.get<Permission[]>(`${this.baseUrl}/by-module`, {
      params: { module },
    });
    return response.data;
  }
}

export const permissionsService = new PermissionsService();
