import { http } from './api';
import type {
  Treatment,
  TreatmentSummary,
  CreateTreatmentDto,
  UpdateTreatmentDto,
  TreatmentQueryParams,
  TreatmentStatus,
  ProviderRole,
  TreatmentLink,
  CreateTreatmentLinkDto,
  UpdateTreatmentLinkDto,
} from '../types';

export class TreatmentService {
  private baseUrl = '/treatments';

  async createTreatment(data: CreateTreatmentDto): Promise<Treatment> {
    return http.post<Treatment>(`${this.baseUrl}`, data);
  }

  async getTreatments(params?: TreatmentQueryParams): Promise<{
    treatments: Treatment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await http.get<{
      treatments: Treatment[];
      total: number;
      page: number;
      limit: number;
    }>(`${this.baseUrl}`, { params });
    return response; // http.get already extracts response.data
  }

  async getTreatmentById(id: string): Promise<Treatment> {
    return http.get<Treatment>(`${this.baseUrl}/${id}`);
  }

  async updateTreatment(
    id: string,
    data: UpdateTreatmentDto
  ): Promise<Treatment> {
    return http.patch<Treatment>(`${this.baseUrl}/${id}`, data);
  }

  async deleteTreatment(id: string): Promise<void> {
    await http.delete(`${this.baseUrl}/${id}`);
  }

  async getTreatmentHistory(patientId: string): Promise<TreatmentSummary[]> {
    return http.get<TreatmentSummary[]>(
      `${this.baseUrl}/patient/${patientId}/history`
    );
  }

  async addProviderToTreatment(
    treatmentId: string,
    providerId: string,
    role: ProviderRole
  ): Promise<void> {
    await http.post(`${this.baseUrl}/${treatmentId}/providers`, {
      providerId,
      role,
    });
  }

  async removeProviderFromTreatment(
    treatmentId: string,
    providerId: string
  ): Promise<void> {
    await http.delete(`${this.baseUrl}/${treatmentId}/providers/${providerId}`);
  }

  async updateTreatmentStatus(
    treatmentId: string,
    status: TreatmentStatus
  ): Promise<Treatment> {
    return http.patch<Treatment>(`${this.baseUrl}/${treatmentId}/status`, {
      status,
    });
  }

  // Treatment Linking Methods
  async createTreatmentLink(
    data: CreateTreatmentLinkDto
  ): Promise<TreatmentLink> {
    return http.post<TreatmentLink>(`${this.baseUrl}/links`, data);
  }

  async getTreatmentLinks(treatmentId: string): Promise<{
    linkedFrom: TreatmentLink[];
    linkedTo: TreatmentLink[];
  }> {
    return http.get<{
      linkedFrom: TreatmentLink[];
      linkedTo: TreatmentLink[];
    }>(`${this.baseUrl}/${treatmentId}/links`);
  }

  async getTreatmentChain(treatmentId: string): Promise<{
    chain: TreatmentLink[];
    allTreatments: TreatmentSummary[];
  }> {
    return http.get<{
      chain: TreatmentLink[];
      allTreatments: TreatmentSummary[];
    }>(`${this.baseUrl}/${treatmentId}/chain`);
  }

  async updateTreatmentLink(
    linkId: string,
    data: UpdateTreatmentLinkDto
  ): Promise<TreatmentLink> {
    return http.patch<TreatmentLink>(`${this.baseUrl}/links/${linkId}`, data);
  }

  async deleteTreatmentLink(linkId: string): Promise<void> {
    await http.delete(`${this.baseUrl}/links/${linkId}`);
  }

  // Transfer Treatment
  async transferTreatment(
    treatmentId: string,
    data: {
      newProviderId: string;
      reason: string;
      notes?: string;
    }
  ): Promise<Treatment> {
    return http.post<Treatment>(
      `${this.baseUrl}/${treatmentId}/transfer`,
      data
    );
  }

  // Get Transferred Treatments
  async getTransferredTreatments(params?: { acknowledged?: boolean }): Promise<{
    treatments: Treatment[];
    total: number;
    unacknowledged: number;
  }> {
    return http.get<{
      treatments: Treatment[];
      total: number;
      unacknowledged: number;
    }>(`${this.baseUrl}/transferred-to-me`, { params });
  }

  // Acknowledge Transfer
  async acknowledgeTransfer(treatmentId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return http.post<{
      success: boolean;
      message: string;
    }>(`${this.baseUrl}/${treatmentId}/acknowledge-transfer`);
  }
}

export const treatmentService = new TreatmentService();
