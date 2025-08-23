import { http } from './api';
import type { Service, PaginatedResponse } from '../types';

export interface ServiceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateServiceData {
  name: string;
  description?: string;
  category: string;
  price: number;
  duration: number;
  active: boolean;
  code?: string;
}

export interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  categories: Array<{
    name: string;
    count: number;
  }>;
  popularServices: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

class ServiceService {
  // Get all services with pagination and filtering
  async getServices(
    params: ServiceQueryParams = {}
  ): Promise<PaginatedResponse<Service>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<Service>>(
      `/services?${queryParams.toString()}`
    );
    return response;
  }

  // Get service by ID
  async getServiceById(id: string): Promise<Service> {
    const response = await http.get<Service>(`/services/${id}`);
    return response;
  }

  // Create new service
  async createService(serviceData: CreateServiceData): Promise<Service> {
    const response = await http.post<Service>('/services', serviceData);
    return response;
  }

  // Update service
  async updateService(
    id: string,
    serviceData: Partial<CreateServiceData>
  ): Promise<Service> {
    const response = await http.put<Service>(`/services/${id}`, serviceData);
    return response;
  }

  // Delete service
  async deleteService(id: string): Promise<void> {
    await http.delete(`/services/${id}`);
  }

  // Get service statistics
  async getServiceStats(): Promise<ServiceStats> {
    const response = await http.get<ServiceStats>('/services/stats');
    return response;
  }

  // Get service categories
  async getServiceCategories(): Promise<string[]> {
    const response = await http.get<string[]>('/services/categories');
    return response;
  }

  // Get services by category
  async getServicesByCategory(category: string): Promise<Service[]> {
    const response = await http.get<Service[]>(
      `/services/category/${category}`
    );
    return response;
  }

  // Search services
  async searchServices(query: string): Promise<Service[]> {
    const response = await http.get<Service[]>(
      `/services/search?q=${encodeURIComponent(query)}`
    );
    return response;
  }

  // Get active services
  async getActiveServices(): Promise<Service[]> {
    const response = await http.get<Service[]>('/services/active');
    return response;
  }

  // Toggle service status
  async toggleServiceStatus(id: string): Promise<Service> {
    const response = await http.post<Service>(`/services/${id}/toggle-status`);
    return response;
  }

  // Bulk update services
  async bulkUpdateServices(
    serviceIds: string[],
    updates: Partial<CreateServiceData>
  ): Promise<Service[]> {
    const response = await http.put<Service[]>('/services/bulk-update', {
      serviceIds,
      updates,
    });
    return response;
  }

  // Import services
  async importServices(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await http.post<any>('/services/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  }

  // Export services
  async exportServices(format: 'csv' | 'excel'): Promise<Blob> {
    const response = await http.get(`/services/export?format=${format}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }
}

export const serviceService = new ServiceService();
export default serviceService;
