import { http } from './api';
import type { PaginatedResponse } from '../types';

export interface CashRequest {
  id: string;
  requestNumber: string;
  requesterId: string;
  department: string;
  purpose: string;
  amount: number;
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  requester?: {
    id: string;
    userId: string;
    employeeId: string;
    department: string;
    specialization?: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  approver?: {
    id: string;
    userId: string;
    employeeId: string;
    department: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  rejector?: {
    id: string;
    userId: string;
    employeeId: string;
    department: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  cashTransactions?: any[];
}

export interface CreateCashRequestData {
  department: string;
  purpose: string;
  amount: number;
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  notes?: string;
  attachments?: string[];
}

export interface UpdateCashRequestData {
  department?: string;
  purpose?: string;
  amount?: number;
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  notes?: string;
  attachments?: string[];
}

export interface ApproveCashRequestData {
  notes?: string;
}

export interface RejectCashRequestData {
  rejectionReason: string;
  notes: string;
}

export interface CashRequestQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  requesterId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CashRequestStatistics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalAmount: number;
  urgentRequests: number;
}

class CashRequestsService {
  // Get all cash requests with pagination and filtering
  async getCashRequests(
    params: CashRequestQueryParams = {}
  ): Promise<PaginatedResponse<CashRequest>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<CashRequest>>(
      `/cash-requests?${queryParams.toString()}`
    );
    return response;
  }

  // Get cash request by ID
  async getCashRequestById(id: string): Promise<CashRequest> {
    const response = await http.get<CashRequest>(`/cash-requests/${id}`);
    return response;
  }

  // Create cash request
  async createCashRequest(data: CreateCashRequestData): Promise<CashRequest> {
    const response = await http.post<CashRequest>('/cash-requests', data);
    return response;
  }

  // Update cash request
  async updateCashRequest(
    id: string,
    data: UpdateCashRequestData
  ): Promise<CashRequest> {
    const response = await http.patch<CashRequest>(
      `/cash-requests/${id}`,
      data
    );
    return response;
  }

  // Approve cash request
  async approveCashRequest(
    id: string,
    data: ApproveCashRequestData
  ): Promise<CashRequest> {
    const response = await http.post<CashRequest>(
      `/cash-requests/${id}/approve`,
      data
    );
    return response;
  }

  // Reject cash request
  async rejectCashRequest(
    id: string,
    data: RejectCashRequestData
  ): Promise<CashRequest> {
    const response = await http.post<CashRequest>(
      `/cash-requests/${id}/reject`,
      data
    );
    return response;
  }

  // Cancel cash request
  async cancelCashRequest(id: string): Promise<CashRequest> {
    const response = await http.post<CashRequest>(
      `/cash-requests/${id}/cancel`
    );
    return response;
  }

  // Mark cash request as completed
  async markAsCompleted(id: string): Promise<CashRequest> {
    const response = await http.post<CashRequest>(
      `/cash-requests/${id}/complete`
    );
    return response;
  }

  // Delete cash request
  async deleteCashRequest(id: string): Promise<void> {
    await http.delete(`/cash-requests/${id}`);
  }

  // Get cash request statistics
  async getStatistics(): Promise<CashRequestStatistics> {
    const response = await http.get<CashRequestStatistics>(
      '/cash-requests/statistics'
    );
    return response;
  }
}

export const cashRequestsService = new CashRequestsService();
