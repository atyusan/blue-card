import { http } from './api';

export interface Surgery {
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
  surgeryDate: string;
  surgeryTime: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  surgeryType: string;
  diagnosis: string;
  procedure: string;
  estimatedDuration: number; // in minutes
  operatingRoomId?: string;
  operatingRoom?: {
    id: string;
    name: string;
    type: string;
    isAvailable: boolean;
  };
  notes?: string;
  totalAmount: number;
  isPaid: boolean;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSurgeryData {
  patientId: string;
  doctorId: string;
  surgeryDate: string;
  surgeryTime: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  surgeryType: string;
  diagnosis: string;
  procedure: string;
  estimatedDuration: number;
  operatingRoomId?: string;
  notes?: string;
}

export interface UpdateSurgeryData {
  surgeryDate?: string;
  surgeryTime?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  surgeryType?: string;
  diagnosis?: string;
  procedure?: string;
  estimatedDuration?: number;
  operatingRoomId?: string;
  notes?: string;
}

export interface SurgicalProcedure {
  id: string;
  surgeryId: string;
  procedureName: string;
  procedureCode: string;
  description: string;
  duration: number; // in minutes
  cost: number;
  notes?: string;
}

export interface CreateSurgicalProcedureData {
  procedureName: string;
  procedureCode: string;
  description: string;
  duration: number;
  cost: number;
  notes?: string;
}

export interface OperatingRoom {
  id: string;
  name: string;
  type:
    | 'GENERAL'
    | 'CARDIAC'
    | 'NEURO'
    | 'ORTHOPEDIC'
    | 'PEDIATRIC'
    | 'EMERGENCY';
  floor: number;
  building: string;
  isAvailable: boolean;
  equipment: string[];
  capacity: number;
  dailyRate: number;
  description?: string;
}

export interface CreateOperatingRoomBookingData {
  operatingRoomId: string;
  surgeryDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface SurgeryQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  surgeryType?: string;
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

class SurgeryService {
  // ===== SURGERY MANAGEMENT =====

  // Create new surgery
  async createSurgery(surgeryData: CreateSurgeryData): Promise<Surgery> {
    const response = await http.post<Surgery>('/surgery', surgeryData);
    return response;
  }

  // Get all surgeries with pagination and filtering
  async getSurgeries(
    params: SurgeryQueryParams = {}
  ): Promise<PaginatedResponse<Surgery>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<Surgery>>(
      `/surgery?${queryParams.toString()}`
    );
    return response;
  }

  // Get upcoming surgeries
  async getUpcomingSurgeries(): Promise<Surgery[]> {
    const response = await http.get<Surgery[]>('/surgery/upcoming');
    return response;
  }

  // Get surgery by ID
  async getSurgeryById(id: string): Promise<Surgery> {
    const response = await http.get<Surgery>(`/surgery/${id}`);
    return response;
  }

  // Update surgery
  async updateSurgery(
    id: string,
    surgeryData: UpdateSurgeryData
  ): Promise<Surgery> {
    const response = await http.patch<Surgery>(`/surgery/${id}`, surgeryData);
    return response;
  }

  // Cancel surgery
  async cancelSurgery(id: string, reason?: string): Promise<Surgery> {
    const payload = reason ? { reason } : {};
    const response = await http.post<Surgery>(`/surgery/${id}/cancel`, payload);
    return response;
  }

  // Reschedule surgery
  async rescheduleSurgery(
    id: string,
    rescheduleData: {
      newDate: string;
      newTime: string;
      reason: string;
      notes?: string;
    }
  ): Promise<Surgery> {
    const response = await http.post<Surgery>(
      `/surgery/${id}/reschedule`,
      rescheduleData
    );
    return response;
  }

  // ===== SURGERY STATUS MANAGEMENT =====

  // Start surgery
  async startSurgery(id: string): Promise<Surgery> {
    const response = await http.post<Surgery>(`/surgery/${id}/start`);
    return response;
  }

  // Complete surgery
  async completeSurgery(
    id: string,
    completionData: { notes?: string }
  ): Promise<Surgery> {
    const response = await http.post<Surgery>(
      `/surgery/${id}/complete`,
      completionData
    );
    return response;
  }

  // ===== ENHANCED FEATURES =====

  // Add surgical procedure
  async addSurgicalProcedure(
    surgeryId: string,
    procedureData: CreateSurgicalProcedureData
  ): Promise<SurgicalProcedure> {
    const response = await http.post<SurgicalProcedure>(
      `/surgery/${surgeryId}/procedures`,
      procedureData
    );
    return response;
  }

  // Book operating room
  async bookOperatingRoom(
    surgeryId: string,
    bookingData: CreateOperatingRoomBookingData
  ): Promise<any> {
    const response = await http.post<any>(
      `/surgery/${surgeryId}/book-room`,
      bookingData
    );
    return response;
  }

  // Get detailed billing info
  async getSurgeryBillingDetails(id: string): Promise<{
    totalAmount: number;
    procedures: SurgicalProcedure[];
    operatingRoomCost: number;
    additionalCharges: any[];
    paymentStatus: string;
    outstandingAmount: number;
  }> {
    const response = await http.get(`/surgery/${id}/billing-details`);
    return response as {
      totalAmount: number;
      procedures: SurgicalProcedure[];
      operatingRoomCost: number;
      additionalCharges: any[];
      paymentStatus: string;
      outstandingAmount: number;
    };
  }

  // ===== OPERATING ROOM MANAGEMENT =====

  // Get all operating rooms
  async getOperatingRooms(): Promise<OperatingRoom[]> {
    const response = await http.get<OperatingRoom[]>(
      '/surgery/operating-rooms'
    );
    return response;
  }

  // Get operating room availability
  async getOperatingRoomAvailability(
    roomId: string,
    date: string
  ): Promise<{
    isAvailable: boolean;
    availableSlots: Array<{
      startTime: string;
      endTime: string;
    }>;
    bookedSlots: Array<{
      startTime: string;
      endTime: string;
      surgeryId: string;
      patientName: string;
    }>;
  }> {
    const response = await http.get(
      `/surgery/operating-rooms/${roomId}/availability?date=${date}`
    );
    return response as {
      isAvailable: boolean;
      availableSlots: Array<{
        startTime: string;
        endTime: string;
      }>;
      bookedSlots: Array<{
        startTime: string;
        endTime: string;
        surgeryId: string;
        patientName: string;
      }>;
    };
  }

  // ===== ADDITIONAL FEATURES =====

  // Get surgery types
  async getSurgeryTypes(): Promise<string[]> {
    const response = await http.get<string[]>('/surgery/types');
    return response;
  }

  // Get surgeries by type
  async getSurgeriesByType(type: string): Promise<Surgery[]> {
    const response = await http.get<Surgery[]>(`/surgery/type/${type}`);
    return response;
  }

  // Search surgeries
  async searchSurgeries(query: string): Promise<Surgery[]> {
    const response = await http.get<Surgery[]>(`/surgery/search?q=${query}`);
    return response;
  }

  // Get surgery statistics
  async getSurgeryStats(): Promise<{
    totalSurgeries: number;
    surgeriesByStatus: Record<string, number>;
    surgeriesByPriority: Record<string, number>;
    surgeriesByType: Record<string, number>;
    revenue: number;
    averageDuration: number;
    operatingRoomUtilization: number;
  }> {
    const response = await http.get('/surgery/stats');
    return response as {
      totalSurgeries: number;
      surgeriesByStatus: Record<string, number>;
      surgeriesByPriority: Record<string, number>;
      surgeriesByType: Record<string, number>;
      revenue: number;
      averageDuration: number;
      operatingRoomUtilization: number;
    };
  }

  // Get patient surgery history
  async getPatientSurgeryHistory(patientId: string): Promise<Surgery[]> {
    const response = await http.get<Surgery[]>(
      `/surgery/patient/${patientId}/history`
    );
    return response;
  }

  // Get doctor surgeries
  async getDoctorSurgeries(
    doctorId: string,
    params: { startDate?: string; endDate?: string; status?: string } = {}
  ): Promise<Surgery[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<Surgery[]>(
      `/surgery/doctor/${doctorId}?${queryParams.toString()}`
    );
    return response;
  }

  // Get urgent surgeries
  async getUrgentSurgeries(): Promise<Surgery[]> {
    const response = await http.get<Surgery[]>('/surgery/urgent');
    return response;
  }

  // Get surgeries by date range
  async getSurgeriesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Surgery[]> {
    const response = await http.get<Surgery[]>(
      `/surgery/date-range?startDate=${startDate}&endDate=${endDate}`
    );
    return response;
  }

  // Export surgery schedule
  async exportSurgerySchedule(
    params: SurgeryQueryParams,
    format: 'pdf' | 'csv' | 'excel'
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    queryParams.append('format', format);

    const response = await http.get(
      `/surgery/export?${queryParams.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response as unknown as Blob;
  }

  // Get surgery conflicts
  async checkSurgeryConflicts(
    doctorId: string,
    date: string,
    time: string,
    duration: number
  ): Promise<{
    hasConflicts: boolean;
    conflicts: Array<{
      surgeryId: string;
      patientName: string;
      conflictType: 'DOCTOR' | 'OPERATING_ROOM' | 'TIME_OVERLAP';
      details: string;
    }>;
  }> {
    const params = new URLSearchParams({
      doctorId,
      date,
      time,
      duration: duration.toString(),
    });

    const response = await http.get(`/surgery/conflicts?${params.toString()}`);
    return response as {
      hasConflicts: boolean;
      conflicts: Array<{
        surgeryId: string;
        patientName: string;
        conflictType: 'DOCTOR' | 'OPERATING_ROOM' | 'TIME_OVERLAP';
        details: string;
      }>;
    };
  }
}

export const surgeryService = new SurgeryService();
export default surgeryService;
