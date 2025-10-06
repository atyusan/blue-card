import {
  AppointmentStatus,
  AppointmentType,
  AppointmentPriority,
  SlotType,
  NotificationStatus,
} from '@prisma/client';

export interface AppointmentResponse {
  id: string;
  patientId: string;
  slotId: string;
  status: AppointmentStatus;
  appointmentType: AppointmentType;
  priority: AppointmentPriority;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  isPaid: boolean;
  requiresPrePayment: boolean;
  reason?: string;
  symptoms?: string;
  notes?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  checkInTime?: Date;
  parentAppointmentId?: string;
  bundleId?: string;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientId: string;
    phoneNumber?: string;
    email?: string;
  };
  slot: {
    id: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    slotType: SlotType;
    specialty?: string;
    provider: {
      id: string;
      firstName: string;
      lastName: string;
      specialization?: string;
    };
    resource?: {
      id: string;
      name: string;
      type: string;
      location?: string;
    };
  };
}

export interface AppointmentSlotResponse {
  id: string;
  providerId: string;
  resourceId?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  slotType: SlotType;
  isAvailable: boolean;
  isBookable: boolean;
  maxBookings: number;
  currentBookings: number;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  specialty?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    department: string;
  };
  resource?: {
    id: string;
    name: string;
    type: string;
    location?: string;
    capacity: number;
  };
  appointments: AppointmentResponse[];
}

export interface ProviderAvailabilityResponse {
  providerId: string;
  providerName: string;
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isAvailable: boolean;
  maxAppointments: number;
  slotDuration: number;
  bufferTime: number;
  availableSlots: AppointmentSlotResponse[];
  bookedSlots: AppointmentSlotResponse[];
  timeOff: {
    startDate: Date;
    endDate: Date;
    reason: string;
    type: string;
  }[];
}

// New interface for date range availability
export interface ProviderDateRangeAvailabilityResponse {
  providerId: string;
  providerName: string;
  availability: DateAvailability[];
}

export interface DateAvailability {
  date: string;
  dayOfWeek: string;
  isAvailable: boolean;
  isPast: boolean;
  isToday: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  maxAppointments: number;
  slotDuration: number;
  bufferTime: number;
  availableSlots: AppointmentSlotResponse[];
  bookedSlots: AppointmentSlotResponse[];
  timeOff: {
    startDate: Date;
    endDate: Date;
    reason: string;
    type: string;
  }[];
  // New fields for enhanced availability
  totalSlots: number;
  availableSlotsCount: number;
  availabilityPercentage: number;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  time: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  isBreak: boolean;
  duration: number;
}

export interface ResourceAvailabilityResponse {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  capacity: number;
  availableSlots: AppointmentSlotResponse[];
  bookedSlots: AppointmentSlotResponse[];
  maintenanceSchedule?: string;
}

export interface AppointmentBundleResponse {
  id: string;
  name: string;
  description?: string;
  bundleType: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  appointments: AppointmentResponse[];
}

export interface WaitlistEntryResponse {
  id: string;
  appointmentId: string;
  patientId: string;
  requestedDate: Date;
  preferredTimeSlots: string[];
  priority: string;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientId: string;
    phoneNumber?: string;
    email?: string;
  };
  appointment: AppointmentResponse;
}

export interface PatientPreferenceResponse {
  id: string;
  patientId: string;
  appointmentId?: string;
  preferenceType: string;
  preferenceValue: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationResponse {
  id: string;
  appointmentId: string;
  notificationType: string;
  channel: string;
  recipient: string;
  content: string;
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchedulingConflict {
  type:
    | 'PROVIDER_UNAVAILABLE'
    | 'RESOURCE_UNAVAILABLE'
    | 'TIME_CONFLICT'
    | 'OVERBOOKING';
  message: string;
  conflictingSlots?: AppointmentSlotResponse[];
  conflictingAppointments?: AppointmentResponse[];
}

export interface AvailableSlot {
  slotId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  slotType: SlotType;
  specialty?: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  resource?: {
    id: string;
    name: string;
    type: string;
    location?: string;
  };
  isAvailable: boolean;
  currentBookings: number;
  maxBookings: number;
}

export interface AppointmentSearchResult {
  appointments: AppointmentResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SlotSearchResult {
  slots: AppointmentSlotResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SchedulingRule {
  id: string;
  name: string;
  description?: string;
  providerId?: string;
  resourceId?: string;
  slotType?: SlotType;
  specialty?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  minDuration: number;
  maxDuration: number;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  maxBookings: number;
  isActive: boolean;
  priority: number;
}

export interface RecurringSlotPatternResponse {
  id: string;
  slotId: string;
  patternType: string;
  interval: number;
  daysOfWeek: number[];
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  slot: AppointmentSlotResponse;
}

export interface ProviderScheduleResponse {
  id: string;
  providerId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isWorking: boolean;
  maxAppointmentsPerHour: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    department: string;
  };
}

export interface ResourceScheduleResponse {
  id: string;
  resourceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  resource: {
    id: string;
    name: string;
    type: string;
    location?: string;
    capacity: number;
  };
}

export interface TimeOffResponse {
  id: string;
  providerId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: string;
  status: string;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    department: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AppointmentStatistics {
  totalAppointments: number;
  scheduledAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalRevenue: number;
  pendingPayments: number;
  averageAppointmentDuration: number;
  providerUtilization: {
    providerId: string;
    providerName: string;
    totalSlots: number;
    bookedSlots: number;
    utilizationRate: number;
  }[];
  resourceUtilization: {
    resourceId: string;
    resourceName: string;
    totalSlots: number;
    bookedSlots: number;
    utilizationRate: number;
  }[];
}
