import { http } from './api';

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  dosageForm: 'TABLET' | 'CAPSULE' | 'LIQUID' | 'INJECTION' | 'CREAM' | 'DROPS';
  strength: string;
  manufacturer: string;
  isActive: boolean;
  price: number;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationData {
  name: string;
  genericName?: string;
  category: string;
  dosageForm: 'TABLET' | 'CAPSULE' | 'LIQUID' | 'INJECTION' | 'CREAM' | 'DROPS';
  strength: string;
  manufacturer: string;
  price: number;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
}

export interface UpdateMedicationData {
  name?: string;
  genericName?: string;
  category?: string;
  dosageForm?:
    | 'TABLET'
    | 'CAPSULE'
    | 'LIQUID'
    | 'INJECTION'
    | 'CREAM'
    | 'DROPS';
  strength?: string;
  manufacturer?: string;
  price?: number;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
}

export interface MedicationInventory {
  id: string;
  medicationId: string;
  medication: Medication;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  supplier: string;
  purchaseDate: string;
  isActive: boolean;
  location: string;
  notes?: string;
}

export interface CreateMedicationInventoryData {
  medicationId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  supplier: string;
  purchaseDate: string;
  location: string;
  notes?: string;
}

export interface Prescription {
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
  prescriptionDate: string;
  status: 'PENDING' | 'APPROVED' | 'DISPENSED' | 'CANCELLED';
  diagnosis?: string;
  notes?: string;
  items: PrescriptionItem[];
  totalAmount: number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  id: string;
  medicationId: string;
  medication: Medication;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface CreatePrescriptionData {
  patientId: string;
  doctorId: string;
  diagnosis?: string;
  notes?: string;
  items: {
    medicationId: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions?: string;
  }[];
}

export interface UpdatePrescriptionData {
  diagnosis?: string;
  notes?: string;
  items?: {
    medicationId: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions?: string;
  }[];
}

export interface DispenseMedicationData {
  prescriptionId: string;
  items: {
    prescriptionItemId: string;
    quantityDispensed: number;
    notes?: string;
  }[];
  dispensedBy: string;
  dispenseDate: string;
}

export interface PharmacyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
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

class PharmacyService {
  // ===== MEDICATION MANAGEMENT =====

  // Create new medication
  async createMedication(
    medicationData: CreateMedicationData
  ): Promise<Medication> {
    const response = await http.post<Medication>(
      '/pharmacy/medications',
      medicationData
    );
    return response;
  }

  // Get all medications with pagination and filtering
  async getMedications(
    params: PharmacyQueryParams = {}
  ): Promise<PaginatedResponse<Medication>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<Medication>>(
      `/pharmacy/medications?${queryParams.toString()}`
    );
    return response;
  }

  // Get medication by ID
  async getMedicationById(id: string): Promise<Medication> {
    const response = await http.get<Medication>(`/pharmacy/medications/${id}`);
    return response;
  }

  // Update medication
  async updateMedication(
    id: string,
    medicationData: UpdateMedicationData
  ): Promise<Medication> {
    const response = await http.patch<Medication>(
      `/pharmacy/medications/${id}`,
      medicationData
    );
    return response;
  }

  // Deactivate medication
  async deactivateMedication(id: string): Promise<void> {
    await http.patch(`/pharmacy/medications/${id}/deactivate`);
  }

  // ===== INVENTORY MANAGEMENT =====

  // Add medication to inventory
  async addToInventory(
    inventoryData: CreateMedicationInventoryData
  ): Promise<MedicationInventory> {
    const response = await http.post<MedicationInventory>(
      '/pharmacy/inventory',
      inventoryData
    );
    return response;
  }

  // Update inventory item
  async updateInventory(
    id: string,
    inventoryData: Partial<CreateMedicationInventoryData>
  ): Promise<MedicationInventory> {
    const response = await http.patch<MedicationInventory>(
      `/pharmacy/inventory/${id}`,
      inventoryData
    );
    return response;
  }

  // Get inventory summary
  async getInventorySummary(): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    expiringItems: number;
    byCategory: Record<string, { count: number; value: number }>;
  }> {
    const response = await http.get('/pharmacy/inventory/summary');
    return response as {
      totalItems: number;
      totalValue: number;
      lowStockItems: number;
      expiringItems: number;
      byCategory: Record<string, { count: number; value: number }>;
    };
  }

  // Get low stock alerts
  async getLowStockAlerts(): Promise<MedicationInventory[]> {
    const response = await http.get<MedicationInventory[]>(
      '/pharmacy/inventory/low-stock'
    );
    return response;
  }

  // Get expiring medications
  async getExpiringMedications(
    days: number = 30
  ): Promise<MedicationInventory[]> {
    const response = await http.get<MedicationInventory[]>(
      `/pharmacy/inventory/expiring?days=${days}`
    );
    return response;
  }

  // ===== PRESCRIPTION MANAGEMENT =====

  // Create new prescription
  async createPrescription(
    prescriptionData: CreatePrescriptionData
  ): Promise<Prescription> {
    const response = await http.post<Prescription>(
      '/pharmacy/prescriptions',
      prescriptionData
    );
    return response;
  }

  // Get all prescriptions with pagination and filtering
  async getPrescriptions(
    params: PharmacyQueryParams & {
      patientId?: string;
      doctorId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<PaginatedResponse<Prescription>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<Prescription>>(
      `/pharmacy/prescriptions?${queryParams.toString()}`
    );
    return response;
  }

  // Get prescription by ID
  async getPrescriptionById(id: string): Promise<Prescription> {
    const response = await http.get<Prescription>(
      `/pharmacy/prescriptions/${id}`
    );
    return response;
  }

  // Update prescription
  async updatePrescription(
    id: string,
    prescriptionData: UpdatePrescriptionData
  ): Promise<Prescription> {
    const response = await http.patch<Prescription>(
      `/pharmacy/prescriptions/${id}`,
      prescriptionData
    );
    return response;
  }

  // ===== DISPENSING & BILLING =====

  // Create invoice for prescription
  async createPrescriptionInvoice(prescriptionId: string): Promise<any> {
    const response = await http.post(
      `/pharmacy/prescriptions/${prescriptionId}/invoice`
    );
    return response;
  }

  // Dispense prescription
  async dispensePrescription(
    dispenseData: DispenseMedicationData
  ): Promise<any> {
    const response = await http.post(
      '/pharmacy/prescriptions/dispense',
      dispenseData
    );
    return response;
  }

  // ===== ADDITIONAL FEATURES =====

  // Get medication categories
  async getMedicationCategories(): Promise<string[]> {
    const response = await http.get<string[]>(
      '/pharmacy/medications/categories'
    );
    return response;
  }

  // Get medications by category
  async getMedicationsByCategory(category: string): Promise<Medication[]> {
    const response = await http.get<Medication[]>(
      `/pharmacy/medications/category/${category}`
    );
    return response;
  }

  // Search medications
  async searchMedications(query: string): Promise<Medication[]> {
    const response = await http.get<Medication[]>(
      `/pharmacy/medications/search?q=${query}`
    );
    return response;
  }

  // Get pharmacy statistics
  async getPharmacyStats(): Promise<{
    totalMedications: number;
    totalPrescriptions: number;
    totalInventoryValue: number;
    prescriptionsByStatus: Record<string, number>;
    topMedications: Array<{
      medication: Medication;
      prescriptionCount: number;
    }>;
  }> {
    const response = await http.get('/pharmacy/stats');
    return response as {
      totalMedications: number;
      totalPrescriptions: number;
      totalInventoryValue: number;
      prescriptionsByStatus: Record<string, number>;
      topMedications: Array<{
        medication: Medication;
        prescriptionCount: number;
      }>;
    };
  }

  // Get patient prescription history
  async getPatientPrescriptionHistory(
    patientId: string
  ): Promise<Prescription[]> {
    const response = await http.get<Prescription[]>(
      `/pharmacy/prescriptions/patient/${patientId}/history`
    );
    return response;
  }

  // Get doctor prescriptions
  async getDoctorPrescriptions(
    doctorId: string,
    params: { startDate?: string; endDate?: string; status?: string } = {}
  ): Promise<Prescription[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<Prescription[]>(
      `/pharmacy/prescriptions/doctor/${doctorId}?${queryParams.toString()}`
    );
    return response;
  }
}

export const pharmacyService = new PharmacyService();
export default pharmacyService;
