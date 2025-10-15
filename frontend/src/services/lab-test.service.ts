import { http } from './api';

// Unified interface for administrative monitoring
export interface UnifiedLabTest {
  id: string;
  type: 'LAB_REQUEST' | 'LAB_TEST';
  source: 'TREATMENT' | 'EXTERNAL';
  testName: string;
  testType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CLAIMED';
  createdAt: string;
  claimedAt?: string;
  startedAt?: string;
  completedAt?: string;
  patient: {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
  };
  requestedBy?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  processedBy?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  service?: {
    id: string;
    name: string;
    description?: string;
  };
  totalPrice: number;
  isPaid: boolean;
  requirePayment: boolean;
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
  };
  // For lab tests (external orders)
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  isCritical?: boolean;
  hasResults: boolean;
  notes?: string;
  orderId?: string;
  // For lab requests (treatment-based)
  results?: Array<{
    id: string;
    parameter: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    status?: string;
  }>;
  treatmentId?: string;
}

export interface LabTestResult {
  id: string;
  orderId: string;
  serviceId: string;
  result?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalPrice: number;
  unitPrice: number;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  service: {
    name: string;
    description?: string;
    category?: {
      name: string;
    };
  };
  order: {
    id: string;
    orderDate: string;
    patient: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
    doctor: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

export interface CreateLabTestDto {
  serviceId: string;
}

export interface UpdateLabTestDto {
  result?: string;
  notes?: string;
  status?: string;
}

export interface CompleteLabTestDto {
  result: string;
  completedBy: string;
}

export class LabTestService {
  private baseUrl = '/lab';

  // Get all lab tests for administrative monitoring (unified from both sources)
  async getAllLabTests(filters?: {
    status?: string;
    source?: string;
    patientId?: string;
    isPaid?: boolean;
  }): Promise<UnifiedLabTest[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.isPaid !== undefined)
      params.append('isPaid', filters.isPaid.toString());

    const queryString = params.toString();
    const url = `${this.baseUrl}/tests/all${
      queryString ? `?${queryString}` : ''
    }`;
    return http.get<UnifiedLabTest[]>(url);
  }

  // Add test to order
  async addTestToOrder(
    orderId: string,
    data: CreateLabTestDto
  ): Promise<LabTestResult> {
    return http.post<LabTestResult>(
      `${this.baseUrl}/orders/${orderId}/tests`,
      data
    );
  }

  // Update lab test
  async updateLabTest(
    testId: string,
    data: UpdateLabTestDto
  ): Promise<LabTestResult> {
    return http.patch<LabTestResult>(`${this.baseUrl}/tests/${testId}`, data);
  }

  // Start lab test
  async startLabTest(testId: string): Promise<LabTestResult> {
    return http.post<LabTestResult>(`${this.baseUrl}/tests/${testId}/start`);
  }

  // Complete lab test
  async completeLabTest(
    testId: string,
    data: CompleteLabTestDto
  ): Promise<LabTestResult> {
    return http.post<LabTestResult>(
      `${this.baseUrl}/tests/${testId}/complete`,
      data
    );
  }

  // Get patient lab test results
  async getPatientLabTestResults(patientId: string): Promise<LabTestResult[]> {
    return http.get<LabTestResult[]>(
      `${this.baseUrl}/tests/patient/${patientId}/results`
    );
  }
}

export const labTestService = new LabTestService();
