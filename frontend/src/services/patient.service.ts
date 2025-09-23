import { http } from './api';
import type {
  Patient,
  CreatePatientFormData,
  PaginatedResponse,
} from '../types';

export interface PatientQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  gender?: string;
  isActive?: boolean;
}

export interface PatientStats {
  totalPatients: number;
  malePatients: number;
  femalePatients: number;
  activePatients: number;
  admittedPatients: number;
}

class PatientService {
  // Get all patients with pagination and filtering
  async getPatients(
    params: PatientQueryParams = {}
  ): Promise<PaginatedResponse<Patient>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<Patient>>(
      `/patients?${queryParams.toString()}`
    );
    return response;
  }

  // Get patient by ID
  async getPatientById(id: string): Promise<Patient> {
    const response = await http.get<Patient>(`/patients/${id}`);
    return response;
  }

  // Get patient by ID for editing (frontend format)
  async getPatientByIdForEdit(id: string): Promise<Patient> {
    const response = await http.get<Patient>(`/patients/${id}/edit`);
    return response;
  }

  // Create new patient
  async createPatient(patientData: CreatePatientFormData): Promise<Patient> {
    const response = await http.post<Patient>('/patients', patientData);
    return response;
  }

  // Update patient
  async updatePatient(
    id: string,
    patientData: Partial<CreatePatientFormData>
  ): Promise<Patient> {
    const response = await http.patch<Patient>(`/patients/${id}`, patientData);
    return response;
  }

  // Delete patient
  async deletePatient(id: string): Promise<void> {
    await http.delete(`/patients/${id}`);
  }

  // Get patient statistics
  async getPatientStats(): Promise<PatientStats> {
    const response = await http.get<PatientStats>('/patients/stats');
    return response;
  }

  // Get patient medical history
  async getPatientMedicalHistory(patientId: string): Promise<any[]> {
    const response = await http.get<any[]>(
      `/patients/${patientId}/medical-history`
    );
    return response;
  }

  // Add medical history entry
  async addMedicalHistoryEntry(patientId: string, entry: any): Promise<any> {
    const response = await http.post<any>(
      `/patients/${patientId}/medical-history`,
      entry
    );
    return response;
  }

  // Search patients
  async searchPatients(query: string): Promise<Patient[]> {
    const response = await http.get<Patient[]>(
      `/patients/search?q=${encodeURIComponent(query)}`
    );
    return response;
  }

  // Get recent patients
  async getRecentPatients(limit: number = 10): Promise<Patient[]> {
    const response = await http.get<Patient[]>(
      `/patients/recent?limit=${limit}`
    );
    return response;
  }

  // Upload patient documents
  async uploadDocument(
    patientId: string,
    file: File,
    type: string
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await http.post<any>(
      `/patients/${patientId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  }

  // Get patient documents
  async getPatientDocuments(patientId: string): Promise<any[]> {
    const response = await http.get<any[]>(`/patients/${patientId}/documents`);
    return response;
  }

  // Get patient account balance
  async getPatientAccountBalance(patientId: string): Promise<any> {
    const response = await http.get<any>(`/patients/${patientId}/account`);
    return response;
  }

  // Get patient financial summary
  async getPatientFinancialSummary(patientId: string): Promise<any> {
    const response = await http.get<any>(
      `/patients/${patientId}/financial-summary`
    );
    return response;
  }

  // Get patient outstanding balance
  async getPatientOutstandingBalance(patientId: string): Promise<any> {
    const response = await http.get<any>(
      `/patients/${patientId}/outstanding-balance`
    );
    return response;
  }

  // Get patient recent activity
  async getPatientRecentActivity(
    patientId: string,
    days: number = 30
  ): Promise<any[]> {
    const response = await http.get<any[]>(
      `/patients/${patientId}/recent-activity?days=${days}`
    );
    return response;
  }

  // Create registration invoice
  async createRegistrationInvoice(
    patientId: string,
    registrationFee: number = 50.0
  ): Promise<any> {
    const response = await http.post<any>(
      `/patients/${patientId}/registration-invoice?registrationFee=${registrationFee}`
    );
    return response;
  }

  // Get patient billing history
  async getPatientBillingHistory(
    patientId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await http.get<any[]>(
      `/patients/${patientId}/billing-history?${params.toString()}`
    );
    return response;
  }
}

export const patientService = new PatientService();
export default patientService;
