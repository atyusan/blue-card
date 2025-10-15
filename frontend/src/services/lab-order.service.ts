import { http } from './api';

export interface LabTest {
  id: string;
  orderId: string;
  serviceId: string;
  result?: string;
  status: string;
  totalPrice: number;
  unitPrice: number;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  service: {
    name: string;
    description?: string;
  };
}

export interface LabOrder {
  id: string;
  patientId: string;
  doctorId: string;
  orderDate: string;
  status: string;
  isPaid: boolean;
  notes?: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
  invoiceId?: string;
  patient: {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
  };
  doctor: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  tests: LabTest[];
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    issuedDate: string;
    dueDate?: string;
    paidDate?: string;
  };
}

export interface CreateLabOrderDto {
  patientId: string;
  doctorId: string;
  tests?: Array<{
    serviceId: string;
  }>;
  notes?: string;
}

export interface CreateLabOrderResponse {
  labOrder: LabOrder;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    balance: number;
    status: string;
  };
  message: string;
}

export interface UpdateLabOrderDto {
  notes?: string;
  status?: string;
}

export interface LabOrderQueryParams {
  patientId?: string;
  doctorId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export class LabOrderService {
  private baseUrl = '/lab';

  // Get all lab orders with optional filtering
  async getLabOrders(params?: LabOrderQueryParams): Promise<LabOrder[]> {
    const queryParams = new URLSearchParams();
    if (params?.patientId) queryParams.append('patientId', params.patientId);
    if (params?.doctorId) queryParams.append('doctorId', params.doctorId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    return http.get<LabOrder[]>(
      `${this.baseUrl}${queryString ? `?${queryString}` : ''}`
    );
  }

  // Get lab order by ID
  async getLabOrderById(id: string): Promise<LabOrder> {
    return http.get<LabOrder>(`${this.baseUrl}/orders/${id}`);
  }

  // Create a new lab order
  async createLabOrder(
    data: CreateLabOrderDto
  ): Promise<CreateLabOrderResponse> {
    return http.post<CreateLabOrderResponse>(`${this.baseUrl}/orders`, data);
  }

  // Update lab order
  async updateLabOrder(id: string, data: UpdateLabOrderDto): Promise<LabOrder> {
    return http.patch<LabOrder>(`${this.baseUrl}/orders/${id}`, data);
  }

  // Mark lab order as paid
  async markLabOrderAsPaid(id: string): Promise<LabOrder> {
    return http.post<LabOrder>(`${this.baseUrl}/orders/${id}/mark-paid`);
  }

  // Cancel lab order
  async cancelLabOrder(id: string, reason?: string): Promise<LabOrder> {
    return http.post<LabOrder>(`${this.baseUrl}/orders/${id}/cancel`, {
      reason,
    });
  }

  // Get ready for testing orders
  async getReadyForTestingOrders(): Promise<LabOrder[]> {
    return http.get<LabOrder[]>(`${this.baseUrl}/orders/ready-for-testing`);
  }

  // Get pending lab orders
  async getPendingLabOrders(): Promise<LabOrder[]> {
    return http.get<LabOrder[]>(`${this.baseUrl}/orders/pending`);
  }

  // Get lab orders by payment status
  async getLabOrdersByPaymentStatus(isPaid: boolean): Promise<LabOrder[]> {
    return http.get<LabOrder[]>(
      `${this.baseUrl}/orders/payment-status/${isPaid}`
    );
  }

  // Get patient lab order summary
  async getPatientLabOrderSummary(patientId: string): Promise<unknown> {
    return http.get(`${this.baseUrl}/orders/patient/${patientId}/summary`);
  }

  // Get lab orders for patient on specific date
  async getLabOrdersByPatientAndDate(
    patientId: string,
    date: string
  ): Promise<LabOrder[]> {
    return http.get<LabOrder[]>(
      `${this.baseUrl}/orders/patient/${patientId}/date`,
      { params: { date } }
    );
  }
}

export const labOrderService = new LabOrderService();
