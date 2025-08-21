import { http } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role:
    | 'ADMIN'
    | 'DOCTOR'
    | 'NURSE'
    | 'CASHIER'
    | 'LAB_TECHNICIAN'
    | 'PHARMACIST';
  isActive: boolean;
  department?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role:
    | 'ADMIN'
    | 'DOCTOR'
    | 'NURSE'
    | 'CASHIER'
    | 'LAB_TECHNICIAN'
    | 'PHARMACIST';
  department?: string;
  phoneNumber?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  phoneNumber?: string;
  role?:
    | 'ADMIN'
    | 'DOCTOR'
    | 'NURSE'
    | 'CASHIER'
    | 'LAB_TECHNICIAN'
    | 'PHARMACIST';
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class UserService {
  // Create new user
  async createUser(userData: CreateUserData): Promise<User> {
    const response = await http.post<User>('/users', userData);
    return response;
  }

  // Get all users with pagination and filtering
  async getUsers(
    params: UserQueryParams = {}
  ): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<User>>(
      `/users?${queryParams.toString()}`
    );
    return response;
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    const response = await http.get<User>(`/users/${id}`);
    return response;
  }

  // Update user
  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const response = await http.patch<User>(`/users/${id}`, userData);
    return response;
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    await http.delete(`/users/${id}`);
  }

  // Deactivate user
  async deactivateUser(id: string): Promise<void> {
    await http.patch(`/users/${id}/deactivate`);
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    const response = await http.get<User>('/auth/profile');
    return response;
  }

  // Change password
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await http.patch(`/users/${id}/password`, {
      currentPassword,
      newPassword,
    });
  }

  // Reset password (admin only)
  async resetPassword(id: string, newPassword: string): Promise<void> {
    await http.patch(`/users/${id}/reset-password`, {
      newPassword,
    });
  }

  // Get users by role
  async getUsersByRole(role: string): Promise<User[]> {
    const response = await http.get<User[]>(`/users/role/${role}`);
    return response;
  }

  // Get users by department
  async getUsersByDepartment(department: string): Promise<User[]> {
    const response = await http.get<User[]>(`/users/department/${department}`);
    return response;
  }

  // Get active users count
  async getActiveUsersCount(): Promise<number> {
    const response = await http.get<{ count: number }>('/users/active/count');
    return response.count;
  }

  // Get users statistics
  async getUsersStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    byDepartment: Record<string, number>;
  }> {
    const response = await http.get('/users/stats');
    return response as {
      total: number;
      active: number;
      inactive: number;
      byRole: Record<string, number>;
      byDepartment: Record<string, number>;
    };
  }
}

export const userService = new UserService();
export default userService;
