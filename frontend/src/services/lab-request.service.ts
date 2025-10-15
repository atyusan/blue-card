import { http } from './api';

export interface LabRequestItem {
  testType: string;
  testName: string;
  description?: string;
  specimenType?: string;
  collectionInstructions?: string;
}

export interface CreateLabRequestDto {
  treatmentId: string;
  requestingProviderId: string;
  tests: LabRequestItem[];
  urgency?: 'STAT' | 'URGENT' | 'ROUTINE';
  scheduledAt?: string;
  notes?: string;
}

export interface LabResultItem {
  resultType: string;
  resultValue?: string;
  normalRange?: string;
  unit?: string;
  status?: 'PENDING' | 'COMPLETED' | 'CRITICAL' | 'CANCELLED';
  notes?: string;
}

export interface CompleteLabRequestDto {
  results: LabResultItem[];
  notes?: string;
  labProviderId?: string;
}

export interface LabRequest {
  id: string;
  treatmentId: string;
  requestingProviderId: string;
  testType: string;
  testName: string;
  description?: string;
  urgency: 'STAT' | 'URGENT' | 'ROUTINE';
  status:
    | 'REQUESTED'
    | 'CLAIMED'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';
  requestedAt: string;
  scheduledAt?: string;
  completedAt?: string;
  labProviderId?: string;
  specimenType?: string;
  collectionInstructions?: string;
  treatment?: any;
  requestingProvider?: any;
  labProvider?: any;
  results?: LabResult[];
}

export interface LabResult {
  id: string;
  labRequestId: string;
  resultType: string;
  resultValue?: string;
  normalRange?: string;
  unit?: string;
  status: 'PENDING' | 'COMPLETED' | 'CRITICAL' | 'CANCELLED';
  notes?: string;
  completedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export class LabRequestService {
  private baseUrl = '/lab/requests';

  // Create lab requests for a treatment
  async createLabRequests(data: CreateLabRequestDto): Promise<LabRequest[]> {
    return http.post<LabRequest[]>('/lab/requests', data);
  }

  // Get lab requests pool (for lab staff)
  async getLabRequestsPool(params?: {
    status?: string;
    urgency?: string;
  }): Promise<LabRequest[]> {
    return http.get<LabRequest[]>('/lab/requests/pool', { params });
  }

  // Get all completed lab requests with results
  async getLabResults(status?: string): Promise<LabRequest[]> {
    return http.get<LabRequest[]>('/lab/requests/results', {
      params: { status },
    });
  }

  // Get all lab results from both lab orders and lab requests
  async getAllLabResults(filters?: {
    status?: string;
    patientId?: string;
  }): Promise<any[]> {
    return http.get<any[]>('/lab/results/all', { params: filters });
  }

  // Get lab requests for a specific treatment
  async getLabRequestsByTreatment(treatmentId: string): Promise<LabRequest[]> {
    return http.get<LabRequest[]>(`/lab/requests/treatment/${treatmentId}`);
  }

  // Get lab request by ID
  async getLabRequestById(id: string): Promise<LabRequest> {
    return http.get<LabRequest>(`/lab/requests/${id}`);
  }

  // Claim a lab request
  async claimLabRequest(
    id: string,
    labProviderId: string
  ): Promise<LabRequest> {
    return http.post<LabRequest>(`/lab/requests/${id}/claim`, {
      labProviderId,
    });
  }

  // Start processing a lab request
  async startLabRequest(id: string): Promise<LabRequest> {
    return http.post<LabRequest>(`/lab/requests/${id}/start`);
  }

  // Complete lab request with results
  async completeLabRequest(
    id: string,
    data: CompleteLabRequestDto
  ): Promise<LabRequest> {
    return http.post<LabRequest>(`/lab/requests/${id}/complete`, data);
  }

  // Cancel a lab request
  async cancelLabRequest(id: string, reason?: string): Promise<LabRequest> {
    return http.post<LabRequest>(`/lab/requests/${id}/cancel`, { reason });
  }

  // Get assigned lab requests for a provider
  async getAssignedLabRequests(providerId: string): Promise<LabRequest[]> {
    return http.get<LabRequest[]>(
      `/lab/requests/provider/${providerId}/assigned`
    );
  }
}

export const labRequestService = new LabRequestService();
