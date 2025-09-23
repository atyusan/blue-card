import { useState, useEffect } from 'react';
import {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
} from '@/types/role';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/context/ToastContext';

interface UseRolesReturn {
  roles: Role[];
  isLoading: boolean;
  error: Error | null;
  createRole: (data: CreateRoleDto) => Promise<Role>;
  updateRole: (id: string, data: UpdateRoleDto) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;
  getRoleById: (id: string) => Promise<Role>;
  getRoleByCode: (code: string) => Promise<Role>;
  getRoleStats: (id: string) => Promise<any>;
  assignRoleToStaff: (staffId: string, data: AssignRoleDto) => Promise<any>;
  removeRoleFromStaff: (staffId: string, roleId: string) => Promise<any>;
  getStaffRoles: (staffId: string) => Promise<any[]>;
  refetch: () => Promise<void>;
}

export const useRoles = (): UseRolesReturn => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showError, showSuccess } = useToast();

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/roles');
      setRoles(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch roles'));
      showError('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const createRole = async (data: CreateRoleDto): Promise<Role> => {
    try {
      const response = await apiClient.post('/roles', data);
      const newRole = response.data;
      setRoles((prev) => [...prev, newRole]);
      return newRole;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to create role');
      showError(error.message);
      throw error;
    }
  };

  const updateRole = async (id: string, data: UpdateRoleDto): Promise<Role> => {
    try {
      const response = await apiClient.patch(`/roles/${id}`, data);
      const updatedRole = response.data;
      setRoles((prev) =>
        prev.map((role) => (role.id === id ? updatedRole : role))
      );
      return updatedRole;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to update role');
      showError(error.message);
      throw error;
    }
  };

  const deleteRole = async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/roles/${id}`);
      setRoles((prev) => prev.filter((role) => role.id !== id));
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to delete role');
      showError(error.message);
      throw error;
    }
  };

  const getRoleById = async (id: string): Promise<Role> => {
    try {
      const response = await apiClient.get(`/roles/${id}`);
      return response.data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to fetch role');
      showError(error.message);
      throw error;
    }
  };

  const getRoleByCode = async (code: string): Promise<Role> => {
    try {
      const response = await apiClient.get(`/roles/code/${code}`);
      return response.data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to fetch role by code');
      showError(error.message);
      throw error;
    }
  };

  const getRoleStats = async (id: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/roles/stats/${id}`);
      return response.data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to fetch role stats');
      showError(error.message);
      throw error;
    }
  };

  const assignRoleToStaff = async (
    staffId: string,
    data: AssignRoleDto
  ): Promise<any> => {
    try {
      const response = await apiClient.post(
        `/roles/staff/${staffId}/assign`,
        data
      );
      showSuccess('Role assigned successfully');
      return response.data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to assign role');
      showError(error.message);
      throw error;
    }
  };

  const removeRoleFromStaff = async (
    staffId: string,
    roleId: string
  ): Promise<any> => {
    try {
      const response = await apiClient.delete(
        `/roles/staff/${staffId}/roles/${roleId}`
      );
      showSuccess('Role removed successfully');
      return response.data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to remove role');
      showError(error.message);
      throw error;
    }
  };

  const getStaffRoles = async (staffId: string): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/roles/staff/${staffId}`);
      return response.data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to fetch staff roles');
      showError(error.message);
      throw error;
    }
  };

  const refetch = async () => {
    await fetchRoles();
  };

  return {
    roles,
    isLoading,
    error,
    createRole,
    updateRole,
    deleteRole,
    getRoleById,
    getRoleByCode,
    getRoleStats,
    assignRoleToStaff,
    removeRoleFromStaff,
    getStaffRoles,
    refetch,
  };
};
