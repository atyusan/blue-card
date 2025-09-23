import { apiClient } from '../lib/api-client';
import type { Service } from '../types';

export interface ServiceQueryParams {
  categoryId?: string;
  departmentId?: string;
  isActive?: boolean;
  search?: string;
  requiresPrePayment?: boolean;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  categoryId: string;
  basePrice: number;
  serviceCode?: string;
  departmentId?: string;
  requiresPrePayment?: boolean;
}

export type UpdateServiceData = Partial<CreateServiceData>;

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  services?: Service[];
}

export interface CreateServiceCategoryData {
  name: string;
  description?: string;
}

export type UpdateServiceCategoryData = Partial<CreateServiceCategoryData>;

export interface UpdateServicePriceData {
  price: number;
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

export interface ServicesResponse {
  data: Service[];
  counts: {
    totalServices: number;
    activeServices: number;
    inactiveServices: number;
  };
}

class ServiceService {
  // ===== SERVICE CRUD OPERATIONS =====

  // Get all services with filtering
  async getServices(
    params: ServiceQueryParams = {}
  ): Promise<ServicesResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ServicesResponse>(
      `/services?${queryParams.toString()}`
    );
    return response.data;
  }

  // Get service by ID
  async getServiceById(id: string): Promise<Service> {
    const response = await apiClient.get<Service>(`/services/${id}`);
    return response.data;
  }

  // Create new service
  async createService(serviceData: CreateServiceData): Promise<Service> {
    const response = await apiClient.post<Service>('/services', serviceData);
    return response.data;
  }

  // Update service
  async updateService(
    id: string,
    serviceData: UpdateServiceData
  ): Promise<Service> {
    const response = await apiClient.patch<Service>(
      `/services/${id}`,
      serviceData
    );
    return response.data;
  }

  // Deactivate service
  async deactivateService(id: string): Promise<void> {
    await apiClient.put(`/services/${id}/deactivate`);
  }

  // Delete service
  async deleteService(id: string): Promise<void> {
    await apiClient.delete(`/services/${id}`);
  }

  // Update service price
  async updateServicePrice(id: string, price: number): Promise<Service> {
    const response = await apiClient.patch<Service>(`/services/${id}/price`, {
      price,
    });
    return response.data;
  }

  // Get services by department
  async getServicesByDepartment(departmentId: string): Promise<Service[]> {
    const response = await apiClient.get<Service[]>(
      `/services/department/${departmentId}`
    );
    return response.data;
  }

  // Get services by category
  async getServicesByCategory(categoryId: string): Promise<Service[]> {
    const response = await apiClient.get<Service[]>(
      `/services/categories/${categoryId}/services`
    );
    return response.data;
  }

  // Get services requiring pre-payment
  async getServicesRequiringPrePayment(): Promise<Service[]> {
    const response = await apiClient.get<Service[]>(
      '/services/pre-payment-required'
    );
    return response.data;
  }

  // ===== SERVICE CATEGORY CRUD OPERATIONS =====

  // Get all service categories
  async getServiceCategories(): Promise<ServiceCategory[]> {
    const response = await apiClient.get<ServiceCategory[]>(
      '/services/categories'
    );
    return response.data;
  }

  // Get service category by ID
  async getServiceCategoryById(id: string): Promise<ServiceCategory> {
    const response = await apiClient.get<ServiceCategory>(
      `/services/categories/${id}`
    );
    return response.data;
  }

  // Create new service category
  async createServiceCategory(
    categoryData: CreateServiceCategoryData
  ): Promise<ServiceCategory> {
    const response = await apiClient.post<ServiceCategory>(
      '/services/categories',
      categoryData
    );
    return response.data;
  }

  // Update service category
  async updateServiceCategory(
    id: string,
    categoryData: UpdateServiceCategoryData
  ): Promise<ServiceCategory> {
    const response = await apiClient.patch<ServiceCategory>(
      `/services/categories/${id}`,
      categoryData
    );
    return response.data;
  }

  // Delete service category (deactivate)
  async deleteServiceCategory(id: string): Promise<void> {
    await apiClient.delete(`/services/categories/${id}`);
  }

  // ===== UTILITY METHODS =====

  // Search services
  async searchServices(query: string): Promise<Service[]> {
    const response = await this.getServices({ search: query });
    return response.data;
  }

  // Get active services
  async getActiveServices(): Promise<Service[]> {
    const response = await this.getServices({ isActive: true });
    return response.data;
  }

  // Get inactive services
  async getInactiveServices(): Promise<Service[]> {
    const response = await this.getServices({ isActive: false });
    return response.data;
  }
}

export const serviceService = new ServiceService();
export default serviceService;
