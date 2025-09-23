import { useState, useEffect } from 'react';
import type {
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '@/types/department';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/context/ToastContext';

interface UseDepartmentsReturn {
  departments: Department[];
  isLoading: boolean;
  error: Error | null;
  createDepartment: (data: CreateDepartmentDto) => Promise<Department>;
  updateDepartment: (
    id: string,
    data: UpdateDepartmentDto
  ) => Promise<Department>;
  deleteDepartment: (id: string) => Promise<void>;
  getDepartmentById: (id: string) => Promise<Department>;
  getDepartmentByCode: (code: string) => Promise<Department>;
  getDepartmentStats: (id: string) => Promise<any>;
  refetch: () => Promise<void>;
}

export const useDepartments = (): UseDepartmentsReturn => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showError } = useToast();

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/departments');
      setDepartments(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch departments')
      );
      showError('Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const createDepartment = async (
    data: CreateDepartmentDto
  ): Promise<Department> => {
    try {
      const response = await apiClient.post('/departments', data);
      const newDepartment = response.data;
      setDepartments((prev) => [...prev, newDepartment]);
      return newDepartment;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to create department');
      showError(error.message);
      throw error;
    }
  };

  const updateDepartment = async (
    id: string,
    data: UpdateDepartmentDto
  ): Promise<Department> => {
    try {
      const response = await apiClient.patch(`/departments/${id}`, data);
      const updatedDepartment = response.data;
      setDepartments((prev) =>
        prev.map((dept) => (dept.id === id ? updatedDepartment : dept))
      );
      return updatedDepartment;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to update department');
      showError(error.message);
      throw error;
    }
  };

  const deleteDepartment = async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/departments/${id}`);
      setDepartments((prev) => prev.filter((dept) => dept.id !== id));
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to delete department');
      showError(error.message);
      throw error;
    }
  };

  const getDepartmentById = async (id: string): Promise<Department> => {
    try {
      const response = await apiClient.get(`/departments/${id}`);
      return response.data;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to fetch department');
      showError(error.message);
      throw error;
    }
  };

  const getDepartmentByCode = async (code: string): Promise<Department> => {
    try {
      const response = await apiClient.get(`/departments/code/${code}`);
      return response.data;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('Failed to fetch department by code');
      showError(error.message);
      throw error;
    }
  };

  const getDepartmentStats = async (id: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/departments/stats/${id}`);
      return response.data;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('Failed to fetch department stats');
      showError(error.message);
      throw error;
    }
  };

  const refetch = async () => {
    await fetchDepartments();
  };

  return {
    departments,
    isLoading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentById,
    getDepartmentByCode,
    getDepartmentStats,
    refetch,
  };
};
