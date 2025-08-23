import { http } from './api';
import type { Appointment, PaginatedResponse } from '../types';

export interface AppointmentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  patientId?: string;
  providerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAppointmentData {
  patientId: string;
  providerId: string;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  notes?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  todayAppointments: number;
  upcomingAppointments: number;
  weeklyStats: Array<{
    date: string;
    count: number;
  }>;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  duration: number;
}

export interface ProviderSchedule {
  providerId: string;
  providerName: string;
  date: string;
  slots: TimeSlot[];
}

class AppointmentService {
  // Get all appointments with pagination and filtering
  async getAppointments(
    params: AppointmentQueryParams = {}
  ): Promise<PaginatedResponse<Appointment>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await http.get<PaginatedResponse<Appointment>>(
      `/consultations?${queryParams.toString()}`
    );
    return response;
  }

  // Get appointment by ID
  async getAppointmentById(id: string): Promise<Appointment> {
    const response = await http.get<Appointment>(`/consultations/${id}`);
    return response;
  }

  // Create new appointment
  async createAppointment(
    appointmentData: CreateAppointmentData
  ): Promise<Appointment> {
    const response = await http.post<Appointment>(
      '/consultations',
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
      `/consultations/${id}`,
      appointmentData
    );
    return response;
  }

  // Cancel appointment
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const payload = reason ? { reason } : {};
    const response = await http.post<Appointment>(
      `/consultations/${id}/cancel`,
      payload
    );
    return response;
  }

  // Complete appointment
  async completeAppointment(id: string, notes?: string): Promise<Appointment> {
    const payload = notes ? { notes } : {};
    const response = await http.post<Appointment>(
      `/consultations/${id}/complete`,
      payload
    );
    return response;
  }

  // Mark as no-show
  async markNoShow(id: string): Promise<Appointment> {
    const response = await http.post<Appointment>(
      `/consultations/${id}/no-show`
    );
    return response;
  }

  // Reschedule appointment
  async rescheduleAppointment(
    id: string,
    newDate: string,
    newTime: string
  ): Promise<Appointment> {
    const payload = { appointmentDate: newDate, appointmentTime: newTime };
    const response = await http.post<Appointment>(
      `/consultations/${id}/reschedule`,
      payload
    );
    return response;
  }

  // Get appointment statistics
  async getAppointmentStats(): Promise<AppointmentStats> {
    const response = await http.get<AppointmentStats>('/consultations/stats');
    return response;
  }

  // Get available time slots
  async getAvailableSlots(
    providerId: string,
    date: string,
    serviceId?: string
  ): Promise<TimeSlot[]> {
    const params = new URLSearchParams({ providerId, date });
    if (serviceId) params.append('serviceId', serviceId);

    const response = await http.get<TimeSlot[]>(
      `/consultations/slots?${params.toString()}`
    );
    return response;
  }

  // Get provider schedule
  async getProviderSchedule(
    providerId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<ProviderSchedule[]> {
    const params = new URLSearchParams({ providerId, dateFrom, dateTo });
    const response = await http.get<ProviderSchedule[]>(
      `/consultations/schedule?${params.toString()}`
    );
    return response;
  }

  // Get today's appointments
  async getTodayAppointments(): Promise<Appointment[]> {
    const response = await http.get<Appointment[]>('/consultations/today');
    return response;
  }

  // Get upcoming appointments
  async getUpcomingAppointments(limit: number = 10): Promise<Appointment[]> {
    const response = await http.get<Appointment[]>(
      `/consultations/upcoming?limit=${limit}`
    );
    return response;
  }

  // Get patient appointments
  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    const response = await http.get<Appointment[]>(
      `/consultations/patient/${patientId}`
    );
    return response;
  }

  // Get provider appointments
  async getProviderAppointments(
    providerId: string,
    date?: string
  ): Promise<Appointment[]> {
    const params = date ? `?date=${date}` : '';
    const response = await http.get<Appointment[]>(
      `/consultations/provider/${providerId}${params}`
    );
    return response;
  }

  // Send appointment reminder
  async sendReminder(id: string, type: 'sms' | 'email'): Promise<void> {
    await http.post(`/consultations/${id}/reminder`, { type });
  }

  // Get appointment conflicts
  async checkConflicts(
    providerId: string,
    date: string,
    time: string,
    duration: number
  ): Promise<any[]> {
    const params = new URLSearchParams({
      providerId,
      date,
      time,
      duration: duration.toString(),
    });
    const response = await http.get<any[]>(
      `/consultations/conflicts?${params.toString()}`
    );
    return response;
  }

  // Bulk reschedule appointments
  async bulkReschedule(
    appointmentIds: string[],
    newDate: string
  ): Promise<Appointment[]> {
    const response = await http.post<Appointment[]>(
      '/consultations/bulk-reschedule',
      {
        appointmentIds,
        newDate,
      }
    );
    return response;
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
      `/consultations/export?${queryParams.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response as unknown as Blob;
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
