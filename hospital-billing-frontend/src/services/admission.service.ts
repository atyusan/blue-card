import { http } from './api';

export interface Admission {
  id: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientId: string;
  };
  wardId: string;
  ward: {
    id: string;
    name: string;
    type: string;
    capacity: number;
  };
  admissionDate: string;
  dischargeDate?: string;
  status: 'ACTIVE' | 'DISCHARGED' | 'TRANSFERRED' | 'CANCELLED';
  admissionType: 'EMERGENCY' | 'ELECTIVE' | 'TRANSFER';
  diagnosis?: string;
  notes?: string;
  doctorId: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  dailyRate: number;
  totalCharges: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdmissionData {
  patientId: string;
  wardId: string;
  admissionDate: string;
  admissionType: 'EMERGENCY' | 'ELECTIVE' | 'TRANSFER';
  diagnosis?: string;
  notes?: string;
  doctorId: string;
  dailyRate: number;
}

export interface UpdateAdmissionData {
  wardId?: string;
  diagnosis?: string;
  notes?: string;
  doctorId?: string;
  dailyRate?: number;
}

export interface AdmissionQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  admissionType?: string;
  doctorId?: string;
  wardId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Ward {
  id: string;
  name: string;
  type: 'GENERAL' | 'PRIVATE' | 'ICU' | 'NICU' | 'MATERNITY' | 'PEDIATRIC';
  capacity: number;
  occupied: number;
  floor: number;
  building: string;
  isActive: boolean;
  dailyRate: number;
  description?: string;
}

export interface DailyCharge {
  id: string;
  admissionId: string;
  date: string;
  amount: number;
  description: string;
  category: 'ROOM' | 'MEDICATION' | 'PROCEDURE' | 'OTHER';
  notes?: string;
  createdAt: string;
}

export interface CreateDailyChargeData {
  date: string;
  amount: number;
  description: string;
  category: 'ROOM' | 'MEDICATION' | 'PROCEDURE' | 'OTHER';
  notes?: string;
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

class AdmissionService {
  // Create new admission
  async createAdmission(
    admissionData: CreateAdmissionData
  ): Promise<Admission> {
    const response = await http.post<Admission>('/admissions', admissionData);
    return response;
  }

  // Get all admissions with pagination and filtering
  async getAdmissions(
    params: AdmissionQueryParams = {}
  ): Promise<PaginatedResponse<Admission>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<Admission>>(
      `/admissions?${queryParams.toString()}`
    );
    return response;
  }

  // Get active admissions
  async getActiveAdmissions(): Promise<Admission[]> {
    const response = await http.get<Admission[]>('/admissions/active');
    return response;
  }

  // Get admission by ID
  async getAdmissionById(id: string): Promise<Admission> {
    const response = await http.get<Admission>(`/admissions/${id}`);
    return response;
  }

  // Update admission
  async updateAdmission(
    id: string,
    admissionData: UpdateAdmissionData
  ): Promise<Admission> {
    const response = await http.patch<Admission>(
      `/admissions/${id}`,
      admissionData
    );
    return response;
  }

  // Discharge patient
  async dischargePatient(
    id: string,
    dischargeData: {
      dischargeDate: string;
      dischargeNotes?: string;
      finalDiagnosis?: string;
    }
  ): Promise<Admission> {
    const response = await http.post<Admission>(
      `/admissions/${id}/discharge`,
      dischargeData
    );
    return response;
  }

  // Add daily charge to admission
  async addDailyCharge(
    admissionId: string,
    chargeData: CreateDailyChargeData
  ): Promise<DailyCharge> {
    const response = await http.post<DailyCharge>(
      `/admissions/${admissionId}/daily-charges`,
      chargeData
    );
    return response;
  }

  // Update daily charge
  async updateDailyCharge(
    chargeId: string,
    chargeData: Partial<CreateDailyChargeData>
  ): Promise<DailyCharge> {
    const response = await http.patch<DailyCharge>(
      `/admissions/daily-charges/${chargeId}`,
      chargeData
    );
    return response;
  }

  // Remove daily charge
  async removeDailyCharge(
    admissionId: string,
    chargeId: string
  ): Promise<void> {
    await http.delete(`/admissions/${admissionId}/daily-charges/${chargeId}`);
  }

  // Get all wards
  async getWards(): Promise<Ward[]> {
    const response = await http.get<Ward[]>('/admissions/wards');
    return response;
  }

  // Get ward availability
  async getWardAvailability(wardId: string): Promise<{
    available: boolean;
    availableBeds: number;
    nextAvailableDate?: string;
  }> {
    const response = await http.get(`/admissions/wards/${wardId}/availability`);
    return response as {
      available: boolean;
      availableBeds: number;
      nextAvailableDate?: string;
    };
  }

  // Get admission statistics
  async getAdmissionStats(): Promise<{
    total: number;
    active: number;
    discharged: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    averageLengthOfStay: number;
  }> {
    const response = await http.get('/admissions/stats');
    return response as {
      total: number;
      active: number;
      discharged: number;
      byType: Record<string, number>;
      byStatus: Record<string, number>;
      averageLengthOfStay: number;
    };
  }

  // Get admission billing summary
  async getAdmissionBillingSummary(admissionId: string): Promise<{
    totalCharges: number;
    dailyCharges: DailyCharge[];
    roomCharges: number;
    medicationCharges: number;
    procedureCharges: number;
    otherCharges: number;
  }> {
    const response = await http.get(
      `/admissions/${admissionId}/billing-summary`
    );
    return response as {
      totalCharges: number;
      dailyCharges: DailyCharge[];
      roomCharges: number;
      medicationCharges: number;
      procedureCharges: number;
      otherCharges: number;
    };
  }

  // Transfer patient to different ward
  async transferPatient(
    admissionId: string,
    transferData: {
      newWardId: string;
      transferDate: string;
      reason: string;
      notes?: string;
    }
  ): Promise<Admission> {
    const response = await http.post<Admission>(
      `/admissions/${admissionId}/transfer`,
      transferData
    );
    return response;
  }

  // Get patient admission history
  async getPatientAdmissionHistory(patientId: string): Promise<Admission[]> {
    const response = await http.get<Admission[]>(
      `/admissions/patient/${patientId}/history`
    );
    return response;
  }

  // Get doctor admissions
  async getDoctorAdmissions(
    doctorId: string,
    params: { startDate?: string; endDate?: string; status?: string } = {}
  ): Promise<Admission[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<Admission[]>(
      `/admissions/doctor/${doctorId}?${queryParams.toString()}`
    );
    return response;
  }
}

export const admissionService = new AdmissionService();
export default admissionService;
