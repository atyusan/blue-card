import { http } from './api';
import type {
  Appointment,
  AppointmentSlot,
  AppointmentBundle,
  ProviderSchedule,
  ProviderTimeOff,
  Resource,
  ResourceSchedule,
  PatientPreference,
  WaitlistEntry,
  PaginatedResponse,
} from '../types';

export interface AppointmentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  patientId?: string;
  providerId?: string;
  startDate?: string;
  endDate?: string;
  appointmentType?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAppointmentData {
  patientId: string;
  slotId: string;
  appointmentType: string;
  priority?: string;
  reason?: string;
  symptoms?: string;
  notes?: string;
  requiresPrePayment?: boolean;
}

export interface CreateAppointmentSlotData {
  providerId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxAppointments: number;
  slotType: string;
  isRecurring?: boolean;
  recurringPattern?: string;
}

export interface CreateRecurringSlotData {
  providerId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxAppointments: number;
  slotType: string;
  recurringPattern: string;
  daysOfWeek: number[];
}

export interface CreateBulkSlotsData {
  providerId: string;
  dates: string[];
  startTime: string;
  endTime: string;
  duration: number;
  maxAppointments: number;
  slotType: string;
}

export interface RescheduleAppointmentData {
  appointmentId: string;
  newSlotId: string;
  reason?: string;
}

export interface CancelAppointmentData {
  appointmentId: string;
  cancellationReason: string;
}

export interface CheckInAppointmentData {
  appointmentId: string;
}

export interface CompleteAppointmentData {
  appointmentId: string;
  followUpNotes?: string;
}

export interface ProcessPaymentData {
  appointmentId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export interface SearchAvailableSlotsData {
  providerId?: string;
  serviceId?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export interface GetProviderAvailabilityData {
  providerId: string;
  startDate: string;
  endDate: string;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  checkedIn: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  todayAppointments: number;
  upcomingAppointments: number;
  weeklyStats: Array<{
    date: string;
    count: number;
  }>;
  revenueStats: {
    totalRevenue: number;
    pendingRevenue: number;
    collectedRevenue: number;
  };
}

export interface AvailableSlot {
  id: string;
  providerId: string;
  providerName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  slotType: string;
}

export interface ProviderAvailabilityResponse {
  providerId: string;
  providerName: string;
  availability: Array<{
    date: string;
    slots: AvailableSlot[];
    conflicts: any[];
  }>;
}

export interface AppointmentSearchResult {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SlotSearchResult {
  slots: AppointmentSlot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProviderDateRangeAvailabilityResponse {
  providerId: string;
  providerName: string;
  availability: Array<{
    date: string;
    slots: AvailableSlot[];
    conflicts: any[];
  }>;
}

class AppointmentService {
  // ===== APPOINTMENT MANAGEMENT =====

  // Get all appointments with pagination and filtering
  async getAppointments(
    params: AppointmentQueryParams = {}
  ): Promise<AppointmentSearchResult> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<AppointmentSearchResult>(
      `/appointments?${queryParams.toString()}`
    );
    return response;
  }

  // Get appointment by ID
  async getAppointmentById(id: string): Promise<Appointment> {
    const response = await http.get<Appointment>(`/appointments/${id}`);
    return response;
  }

  // Create new appointment
  async createAppointment(
    appointmentData: CreateAppointmentData
  ): Promise<Appointment> {
    const response = await http.post<Appointment>(
      '/appointments',
      appointmentData
    );
    return response;
  }

  // Update appointment
  async updateAppointment(
    id: string,
    appointmentData: Partial<CreateAppointmentData>
  ): Promise<Appointment> {
    const response = await http.patch<Appointment>(
      `/appointments/${id}`,
      appointmentData
    );
    return response;
  }

  // Delete appointment
  async deleteAppointment(id: string): Promise<void> {
    await http.delete(`/appointments/${id}`);
  }

  // ===== APPOINTMENT OPERATIONS =====

  // Reschedule appointment
  async rescheduleAppointment(
    rescheduleData: RescheduleAppointmentData
  ): Promise<Appointment> {
    const response = await http.post<Appointment>(
      '/appointments/reschedule',
      rescheduleData
    );
    return response;
  }

  // Cancel appointment
  async cancelAppointment(
    cancelData: CancelAppointmentData
  ): Promise<Appointment> {
    const response = await http.post<Appointment>(
      '/appointments/cancel',
      cancelData
    );
    return response;
  }

  // Check in appointment
  async checkInAppointment(
    checkInData: CheckInAppointmentData
  ): Promise<Appointment> {
    const response = await http.post<Appointment>(
      '/appointments/check-in',
      checkInData
    );
    return response;
  }

  // Complete appointment
  async completeAppointment(
    completeData: CompleteAppointmentData
  ): Promise<Appointment> {
    const response = await http.post<Appointment>(
      '/appointments/complete',
      completeData
    );
    return response;
  }

  // Process payment
  async processPayment(paymentData: ProcessPaymentData): Promise<Appointment> {
    const response = await http.post<Appointment>(
      '/appointments/payment',
      paymentData
    );
    return response;
  }

  // ===== INVOICE MANAGEMENT =====

  // Get appointment invoice
  async getAppointmentInvoice(appointmentId: string): Promise<any> {
    const response = await http.get(`/appointments/invoices/${appointmentId}`);
    return response;
  }

  // Get all appointment invoices
  async getAllAppointmentInvoices(params: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get(
      `/appointments/invoices?${queryParams.toString()}`
    );
    return response;
  }

  // Regenerate appointment invoice
  async regenerateAppointmentInvoice(appointmentId: string): Promise<any> {
    const response = await http.post(
      `/appointments/invoices/${appointmentId}/regenerate`
    );
    return response;
  }

  // ===== INTELLIGENT SCHEDULING =====

  // Search available slots
  async searchAvailableSlots(
    searchData: SearchAvailableSlotsData
  ): Promise<AvailableSlot[]> {
    const response = await http.post<AvailableSlot[]>(
      '/appointments/slots/search',
      searchData
    );
    return response;
  }

  // Create recurring slots
  async createRecurringSlots(
    recurringData: CreateRecurringSlotData
  ): Promise<void> {
    await http.post('/appointments/slots/recurring', recurringData);
  }

  // Create bulk slots
  async createBulkSlots(bulkData: CreateBulkSlotsData): Promise<void> {
    await http.post('/appointments/slots/bulk', bulkData);
  }

  // Get provider availability
  async getProviderAvailability(
    availabilityData: GetProviderAvailabilityData
  ): Promise<ProviderAvailabilityResponse> {
    const response = await http.get<ProviderAvailabilityResponse>(
      `/appointments/provider-availability`,
      { params: availabilityData }
    );
    return response.data;
  }

  async getProviderDateRangeAvailability(
    availabilityData: GetProviderAvailabilityData & {
      includePastDates?: boolean;
    }
  ): Promise<ProviderDateRangeAvailabilityResponse> {
    const response = await http.get<ProviderDateRangeAvailabilityResponse>(
      `/appointments/provider-availability/date-range`,
      { params: availabilityData }
    );
    return response.data;
  }

  // ===== STATISTICS & ANALYTICS =====

  // Get appointment statistics
  async getAppointmentStatistics(): Promise<AppointmentStats> {
    const response = await http.get<AppointmentStats>(
      '/appointments/statistics/overview'
    );
    return response;
  }

  // ===== APPOINTMENT SLOTS MANAGEMENT =====

  // Create appointment slot
  async createAppointmentSlot(
    slotData: CreateAppointmentSlotData
  ): Promise<AppointmentSlot> {
    const response = await http.post<AppointmentSlot>(
      '/appointments/slots',
      slotData
    );
    return response;
  }

  // Get all slots
  async getAllSlots(params: any = {}): Promise<SlotSearchResult> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<SlotSearchResult>(
      `/appointments/slots?${queryParams.toString()}`
    );
    return response;
  }

  // Get slot by ID
  async getSlotById(id: string): Promise<AppointmentSlot> {
    const response = await http.get<AppointmentSlot>(
      `/appointments/slots/${id}`
    );
    return response;
  }

  // Update slot
  async updateSlot(
    id: string,
    slotData: Partial<CreateAppointmentSlotData>
  ): Promise<AppointmentSlot> {
    const response = await http.patch<AppointmentSlot>(
      `/appointments/slots/${id}`,
      slotData
    );
    return response;
  }

  // Delete slot
  async deleteSlot(id: string): Promise<void> {
    await http.delete(`/appointments/slots/${id}`);
  }

  // ===== BUNDLE MANAGEMENT =====

  // Create appointment bundle
  async createAppointmentBundle(bundleData: any): Promise<AppointmentBundle> {
    const response = await http.post<AppointmentBundle>(
      '/appointments/bundles',
      bundleData
    );
    return response;
  }

  // Get all bundles
  async getAllBundles(params: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get(
      `/appointments/bundles?${queryParams.toString()}`
    );
    return response;
  }

  // Get bundle by ID
  async getBundleById(id: string): Promise<AppointmentBundle> {
    const response = await http.get<AppointmentBundle>(
      `/appointments/bundles/${id}`
    );
    return response;
  }

  // Update bundle
  async updateBundle(
    id: string,
    bundleData: Partial<AppointmentBundle>
  ): Promise<AppointmentBundle> {
    const response = await http.patch<AppointmentBundle>(
      `/appointments/bundles/${id}`,
      bundleData
    );
    return response;
  }

  // Delete bundle
  async deleteBundle(id: string): Promise<void> {
    await http.delete(`/appointments/bundles/${id}`);
  }

  // ===== WAITLIST MANAGEMENT =====

  // Create waitlist entry
  async createWaitlistEntry(waitlistData: any): Promise<WaitlistEntry> {
    const response = await http.post<WaitlistEntry>(
      '/appointments/waitlist',
      waitlistData
    );
    return response;
  }

  // Get all waitlist entries
  async getAllWaitlistEntries(params: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get(
      `/appointments/waitlist?${queryParams.toString()}`
    );
    return response;
  }

  // Get waitlist entry by ID
  async getWaitlistEntryById(id: string): Promise<WaitlistEntry> {
    const response = await http.get<WaitlistEntry>(
      `/appointments/waitlist/${id}`
    );
    return response;
  }

  // Update waitlist entry
  async updateWaitlistEntry(
    id: string,
    waitlistData: Partial<WaitlistEntry>
  ): Promise<WaitlistEntry> {
    const response = await http.patch<WaitlistEntry>(
      `/appointments/waitlist/${id}`,
      waitlistData
    );
    return response;
  }

  // Delete waitlist entry
  async deleteWaitlistEntry(id: string): Promise<void> {
    await http.delete(`/appointments/waitlist/${id}`);
  }

  // ===== PATIENT PREFERENCES =====

  // Create patient preference
  async createPatientPreference(
    preferenceData: any
  ): Promise<PatientPreference> {
    const response = await http.post<PatientPreference>(
      '/appointments/preferences',
      preferenceData
    );
    return response;
  }

  // Get patient preferences
  async getPatientPreferences(patientId: string): Promise<PatientPreference[]> {
    const response = await http.get<PatientPreference[]>(
      `/appointments/preferences/${patientId}`
    );
    return response;
  }

  // Update patient preference
  async updatePatientPreference(
    id: string,
    preferenceData: Partial<PatientPreference>
  ): Promise<PatientPreference> {
    const response = await http.patch<PatientPreference>(
      `/appointments/preferences/${id}`,
      preferenceData
    );
    return response;
  }

  // Delete patient preference
  async deletePatientPreference(id: string): Promise<void> {
    await http.delete(`/appointments/preferences/${id}`);
  }

  // ===== PROVIDER SCHEDULE MANAGEMENT =====

  // Create provider schedule
  async createProviderSchedule(scheduleData: any): Promise<ProviderSchedule> {
    const response = await http.post<ProviderSchedule>(
      '/appointments/providers/schedules',
      scheduleData
    );
    return response;
  }

  // Get all provider schedules
  async getAllProviderSchedules(params: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get(
      `/appointments/providers/schedules?${queryParams.toString()}`
    );
    return response;
  }

  // Get provider schedule by ID
  async getProviderScheduleById(id: string): Promise<ProviderSchedule> {
    const response = await http.get<ProviderSchedule>(
      `/appointments/providers/schedules/${id}`
    );
    return response;
  }

  // Update provider schedule
  async updateProviderSchedule(
    id: string,
    scheduleData: Partial<ProviderSchedule>
  ): Promise<ProviderSchedule> {
    const response = await http.patch<ProviderSchedule>(
      `/appointments/providers/schedules/${id}`,
      scheduleData
    );
    return response;
  }

  // Delete provider schedule
  async deleteProviderSchedule(id: string): Promise<void> {
    await http.delete(`/appointments/providers/schedules/${id}`);
  }

  // ===== PROVIDER TIME OFF MANAGEMENT =====

  // Create provider time off
  async createProviderTimeOff(timeOffData: any): Promise<ProviderTimeOff> {
    const response = await http.post<ProviderTimeOff>(
      '/appointments/providers/time-off',
      timeOffData
    );
    return response;
  }

  // Get all provider time off
  async getAllProviderTimeOff(params: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get(
      `/appointments/providers/time-off?${queryParams.toString()}`
    );
    return response;
  }

  // Get provider time off by ID
  async getProviderTimeOffById(id: string): Promise<ProviderTimeOff> {
    const response = await http.get<ProviderTimeOff>(
      `/appointments/providers/time-off/${id}`
    );
    return response;
  }

  // Update provider time off
  async updateProviderTimeOff(
    id: string,
    timeOffData: Partial<ProviderTimeOff>
  ): Promise<ProviderTimeOff> {
    const response = await http.patch<ProviderTimeOff>(
      `/appointments/providers/time-off/${id}`,
      timeOffData
    );
    return response;
  }

  // Delete provider time off
  async deleteProviderTimeOff(id: string): Promise<void> {
    await http.delete(`/appointments/providers/time-off/${id}`);
  }

  // ===== RESOURCE MANAGEMENT =====

  // Create resource
  async createResource(resourceData: any): Promise<Resource> {
    const response = await http.post<Resource>(
      '/appointments/resources',
      resourceData
    );
    return response;
  }

  // Get all resources
  async getAllResources(params: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get(
      `/appointments/resources?${queryParams.toString()}`
    );
    return response;
  }

  // Get resource by ID
  async getResourceById(id: string): Promise<Resource> {
    const response = await http.get<Resource>(`/appointments/resources/${id}`);
    return response;
  }

  // Update resource
  async updateResource(
    id: string,
    resourceData: Partial<Resource>
  ): Promise<Resource> {
    const response = await http.patch<Resource>(
      `/appointments/resources/${id}`,
      resourceData
    );
    return response;
  }

  // Delete resource
  async deleteResource(id: string): Promise<void> {
    await http.delete(`/appointments/resources/${id}`);
  }

  // ===== RESOURCE SCHEDULE MANAGEMENT =====

  // Create resource schedule
  async createResourceSchedule(scheduleData: any): Promise<ResourceSchedule> {
    const response = await http.post<ResourceSchedule>(
      '/appointments/resources/schedules',
      scheduleData
    );
    return response;
  }

  // Get all resource schedules
  async getAllResourceSchedules(params: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get(
      `/appointments/resources/schedules?${queryParams.toString()}`
    );
    return response;
  }

  // Get resource schedule by ID
  async getResourceScheduleById(id: string): Promise<ResourceSchedule> {
    const response = await http.get<ResourceSchedule>(
      `/appointments/resources/schedules/${id}`
    );
    return response;
  }

  // Update resource schedule
  async updateResourceSchedule(
    id: string,
    scheduleData: Partial<ResourceSchedule>
  ): Promise<ResourceSchedule> {
    const response = await http.patch<ResourceSchedule>(
      `/appointments/resources/schedules/${id}`,
      scheduleData
    );
    return response;
  }

  // Delete resource schedule
  async deleteResourceSchedule(id: string): Promise<void> {
    await http.delete(`/appointments/resources/schedules/${id}`);
  }

  // ===== LEGACY METHODS (for backward compatibility) =====

  // Get today's appointments
  async getTodayAppointments(): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await this.getAppointments({
      startDate: today,
      endDate: today,
    });
    return response.appointments;
  }

  // Get upcoming appointments
  async getUpcomingAppointments(limit: number = 10): Promise<Appointment[]> {
    const response = await this.getAppointments({
      startDate: new Date().toISOString().split('T')[0],
      limit,
      sortBy: 'scheduledStart',
      sortOrder: 'asc',
    });
    return response.appointments;
  }

  // Get patient appointments
  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    const response = await this.getAppointments({ patientId });
    return response.appointments;
  }

  // Get provider appointments
  async getProviderAppointments(
    providerId: string,
    date?: string
  ): Promise<Appointment[]> {
    const params: any = { providerId };
    if (date) params.startDate = date;
    const response = await this.getAppointments(params);
    return response.appointments;
  }

  // Check appointment conflicts
  async checkConflicts(
    providerId: string,
    date: string,
    time: string,
    duration: number
  ): Promise<any[]> {
    const response = await this.searchAvailableSlots({
      providerId,
      date,
      startTime: time,
      duration,
    });
    return response.filter((slot) => !slot.isAvailable);
  }

  // Export appointments
  async exportAppointments(
    params: AppointmentQueryParams,
    format: 'csv' | 'pdf' | 'excel'
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    queryParams.append('format', format);

    const response = await http.get(
      `/appointments/export?${queryParams.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response as unknown as Blob;
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
