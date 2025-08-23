import { http } from './api';

export interface LabOrder {
  id: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientId: string;
  };
  doctorId: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  orderDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PAID';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  clinicalNotes?: string;
  tests: LabTest[];
  totalAmount: number;
  isPaid: boolean;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  createdAt: string;
  updatedAt: string;
}

export interface LabTest {
  id: string;
  orderId: string;
  testName: string;
  testCode: string;
  category: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  price: number;
  result?: string;
  normalRange?: string;
  unit?: string;
  isAbnormal?: boolean;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  technicianId?: string;
  technician?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateLabOrderData {
  patientId: string;
  doctorId: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  clinicalNotes?: string;
  tests: {
    testName: string;
    testCode: string;
    category: string;
    price: number;
  }[];
}

export interface UpdateLabOrderData {
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  clinicalNotes?: string;
  tests?: {
    testName: string;
    testCode: string;
    category: string;
    price: number;
  }[];
}

export interface CreateLabTestData {
  testName: string;
  testCode: string;
  category: string;
  price: number;
}

export interface UpdateLabTestData {
  testName?: string;
  testCode?: string;
  category?: string;
  price?: number;
}

export interface CompleteLabTestData {
  result: string;
  normalRange?: string;
  unit?: string;
  isAbnormal?: boolean;
  notes?: string;
}

export interface LabOrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
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

class LaboratoryService {
  // ===== LAB ORDER MANAGEMENT =====

  // Create new lab order
  async createLabOrder(orderData: CreateLabOrderData): Promise<LabOrder> {
    const response = await http.post<LabOrder>('/lab/orders', orderData);
    return response;
  }

  // Get all lab orders with pagination and filtering
  async getLabOrders(
    params: LabOrderQueryParams = {}
  ): Promise<PaginatedResponse<LabOrder>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<LabOrder>>(
      `/lab?${queryParams.toString()}`
    );
    return response;
  }

  // Get lab order by ID
  async getLabOrderById(id: string): Promise<LabOrder> {
    const response = await http.get<LabOrder>(`/lab/orders/${id}`);
    return response;
  }

  // Update lab order
  async updateLabOrder(
    id: string,
    orderData: UpdateLabOrderData
  ): Promise<LabOrder> {
    const response = await http.patch<LabOrder>(`/lab/orders/${id}`, orderData);
    return response;
  }

  // Cancel lab order
  async cancelLabOrder(id: string, reason?: string): Promise<LabOrder> {
    const payload = reason ? { reason } : {};
    const response = await http.post<LabOrder>(
      `/lab/orders/${id}/cancel`,
      payload
    );
    return response;
  }

  // Mark lab order as paid
  async markLabOrderAsPaid(id: string): Promise<LabOrder> {
    const response = await http.post<LabOrder>(`/lab/orders/${id}/mark-paid`);
    return response;
  }

  // ===== LAB TEST MANAGEMENT =====

  // Add test to lab order
  async addTestToOrder(
    orderId: string,
    testData: CreateLabTestData
  ): Promise<LabTest> {
    const response = await http.post<LabTest>(
      `/lab/orders/${orderId}/tests`,
      testData
    );
    return response;
  }

  // Update lab test
  async updateLabTest(
    testId: string,
    testData: UpdateLabTestData
  ): Promise<LabTest> {
    const response = await http.patch<LabTest>(
      `/lab/tests/${testId}`,
      testData
    );
    return response;
  }

  // Start lab test
  async startLabTest(testId: string): Promise<LabTest> {
    const response = await http.post<LabTest>(`/lab/tests/${testId}/start`);
    return response;
  }

  // Complete lab test
  async completeLabTest(
    testId: string,
    completionData: CompleteLabTestData
  ): Promise<LabTest> {
    const response = await http.post<LabTest>(
      `/lab/tests/${testId}/complete`,
      completionData
    );
    return response;
  }

  // ===== ENHANCED QUERIES =====

  // Get orders ready for testing
  async getOrdersReadyForTesting(): Promise<LabOrder[]> {
    const response = await http.get<LabOrder[]>(
      '/lab/orders/ready-for-testing'
    );
    return response;
  }

  // Get orders by payment status
  async getOrdersByPaymentStatus(isPaid: boolean): Promise<LabOrder[]> {
    const response = await http.get<LabOrder[]>(
      `/lab/orders/payment-status/${isPaid}`
    );
    return response;
  }

  // Get patient test results
  async getPatientTestResults(patientId: string): Promise<LabTest[]> {
    const response = await http.get<LabTest[]>(
      `/lab/tests/patient/${patientId}/results`
    );
    return response;
  }

  // ===== ADDITIONAL FEATURES =====

  // Get lab test categories
  async getLabTestCategories(): Promise<string[]> {
    const response = await http.get<string[]>('/lab/tests/categories');
    return response;
  }

  // Get tests by category
  async getTestsByCategory(category: string): Promise<LabTest[]> {
    const response = await http.get<LabTest[]>(
      `/lab/tests/category/${category}`
    );
    return response;
  }

  // Search lab tests
  async searchLabTests(query: string): Promise<LabTest[]> {
    const response = await http.get<LabTest[]>(`/lab/tests/search?q=${query}`);
    return response;
  }

  // Get laboratory statistics
  async getLaboratoryStats(): Promise<{
    totalOrders: number;
    totalTests: number;
    ordersByStatus: Record<string, number>;
    testsByStatus: Record<string, number>;
    ordersByPriority: Record<string, number>;
    revenue: number;
    averageProcessingTime: number;
  }> {
    const response = await http.get('/lab/stats');
    return response as {
      totalOrders: number;
      totalTests: number;
      ordersByStatus: Record<string, number>;
      testsByStatus: Record<string, number>;
      ordersByPriority: Record<string, number>;
      revenue: number;
      averageProcessingTime: number;
    };
  }

  // Get patient lab history
  async getPatientLabHistory(patientId: string): Promise<LabOrder[]> {
    const response = await http.get<LabOrder[]>(
      `/lab/orders/patient/${patientId}/history`
    );
    return response;
  }

  // Get doctor lab orders
  async getDoctorLabOrders(
    doctorId: string,
    params: { startDate?: string; endDate?: string; status?: string } = {}
  ): Promise<LabOrder[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<LabOrder[]>(
      `/lab/orders/doctor/${doctorId}?${queryParams.toString()}`
    );
    return response;
  }

  // Get urgent lab orders
  async getUrgentLabOrders(): Promise<LabOrder[]> {
    const response = await http.get<LabOrder[]>('/lab/orders/urgent');
    return response;
  }

  // Get lab orders by date range
  async getLabOrdersByDateRange(
    startDate: string,
    endDate: string
  ): Promise<LabOrder[]> {
    const response = await http.get<LabOrder[]>(
      `/lab/orders/date-range?startDate=${startDate}&endDate=${endDate}`
    );
    return response;
  }

  // Export lab results
  async exportLabResults(
    orderId: string,
    format: 'pdf' | 'csv' | 'excel'
  ): Promise<Blob> {
    const response = await http.get(
      `/lab/orders/${orderId}/export?format=${format}`,
      {
        responseType: 'blob',
      }
    );
    return response as unknown as Blob;
  }

  // Get lab order billing details
  async getLabOrderBillingDetails(orderId: string): Promise<{
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    paymentHistory: any[];
    tests: LabTest[];
  }> {
    const response = await http.get(`/lab/orders/${orderId}/billing-details`);
    return response as {
      totalAmount: number;
      paidAmount: number;
      outstandingAmount: number;
      paymentHistory: any[];
      tests: LabTest[];
    };
  }
}

export const laboratoryService = new LaboratoryService();
export default laboratoryService;
