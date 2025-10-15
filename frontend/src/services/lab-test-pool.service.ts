import api from './api';

export interface LabTestPool {
  id: string;
  orderId: string;
  serviceId: string;
  status: string;
  result?: string;
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  isCritical: boolean;
  isPaid: boolean;
  notes?: string;
  totalPrice: number;
  unitPrice: number;
  labTechnicianId?: string;
  claimedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    orderDate: string;
    status: string;
    patient: {
      id: string;
      patientId: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email?: string;
    };
    doctor: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
  service: {
    id: string;
    name: string;
    category: string;
    price: number;
  };
  labTechnician?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface CompleteTestData {
  technicianId: string;
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  isCritical?: boolean;
  notes?: string;
}

class LabTestPoolService {
  // Get available tests from paid orders
  async getAvailableTests(status?: string): Promise<LabTestPool[]> {
    const params = status ? { status } : {};
    const response = await api.get('/lab/tests/pool/available', { params });
    return response.data;
  }

  // Get my claimed/assigned tests
  async getMyTests(
    technicianId: string,
    status?: string
  ): Promise<LabTestPool[]> {
    const params: any = { technicianId };
    if (status) {
      params.status = status;
    }
    const response = await api.get('/lab/tests/my-tests', { params });
    return response.data;
  }

  // Claim a test
  async claimTest(testId: string, technicianId: string): Promise<LabTestPool> {
    const response = await api.post(`/lab/tests/${testId}/claim`, {
      technicianId,
    });
    return response.data;
  }

  // Start processing a test
  async startTest(testId: string, technicianId: string): Promise<LabTestPool> {
    const response = await api.post(`/lab/tests/${testId}/start-processing`, {
      technicianId,
    });
    return response.data;
  }

  // Complete a test with results
  async completeTest(
    testId: string,
    data: CompleteTestData
  ): Promise<LabTestPool> {
    const response = await api.post(
      `/lab/tests/${testId}/complete-with-results`,
      data
    );
    return response.data;
  }

  // Cancel a test
  async cancelTest(
    testId: string,
    technicianId: string,
    reason: string
  ): Promise<LabTestPool> {
    const response = await api.post(`/lab/tests/${testId}/cancel`, {
      technicianId,
      reason,
    });
    return response.data;
  }
}

export const labTestPoolService = new LabTestPoolService();
