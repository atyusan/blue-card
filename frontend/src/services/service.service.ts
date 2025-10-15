import { http } from './api';

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
  category?: {
    id: string;
    name: string;
    description?: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  categoryId: string;
  departmentId?: string;
  basePrice: number;
  currentPrice: number;
  serviceCode?: string;
  requiresPrePayment?: boolean;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  categoryId?: string;
  departmentId?: string;
  basePrice?: number;
  currentPrice?: number;
  serviceCode?: string;
  isActive?: boolean;
  requiresPrePayment?: boolean;
}

export class ServiceService {
  private baseUrl = '/services';

  // Get all services
  async getAllServices(): Promise<Service[]> {
    return http.get<Service[]>(this.baseUrl);
  }

  // Get service by ID
  async getServiceById(id: string): Promise<Service> {
    return http.get<Service>(`${this.baseUrl}/${id}`);
  }

  // Get services by category (name or ID)
  async getServicesByCategory(categoryName: string): Promise<Service[]> {
    return http.get<Service[]>(`${this.baseUrl}/category/${categoryName}`);
  }

  // Get services by department
  async getServicesByDepartment(departmentId: string): Promise<Service[]> {
    return http.get<Service[]>(`${this.baseUrl}/department/${departmentId}`);
  }

  // Get active services only
  async getActiveServices(): Promise<Service[]> {
    return http.get<Service[]>(`${this.baseUrl}/active`);
  }

  // Create service
  async createService(data: CreateServiceDto): Promise<Service> {
    return http.post<Service>(this.baseUrl, data);
  }

  // Update service
  async updateService(id: string, data: UpdateServiceDto): Promise<Service> {
    return http.patch<Service>(`${this.baseUrl}/${id}`, data);
  }

  // Delete service
  async deleteService(id: string): Promise<void> {
    return http.delete(`${this.baseUrl}/${id}`);
  }

  // Search services
  async searchServices(query: string): Promise<Service[]> {
    return http.get<Service[]>(`${this.baseUrl}/search`, {
      params: { q: query },
    });
  }
}

export const serviceService = new ServiceService();
