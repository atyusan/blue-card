// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UserRole = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  RECEPTIONIST: 'RECEPTIONIST',
  ACCOUNTANT: 'ACCOUNTANT',
  CASHIER: 'CASHIER',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  PHARMACIST: 'PHARMACIST',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Patient Types
export interface Patient {
  id: string;
  patientId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phoneNumber: string;
  email?: string;
  address: string;
  emergencyContact?: EmergencyContact;
  medicalHistory?: MedicalHistory;
  insurance?: InsuranceInfo;
  status?: string;
  lastVisit?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface MedicalHistory {
  allergies?: string;
  bloodGroup?: string;
  genotype?: string;
  height?: string;
}

export interface InsuranceInfo {
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string | { id: string; name: string };
  basePrice: number;
  currentPrice: number;
  serviceCode?: string;
  isActive?: boolean;
  requiresPrePayment?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ServiceCategory = {
  CONSULTATION: 'CONSULTATION',
  LABORATORY: 'LABORATORY',
  RADIOLOGY: 'RADIOLOGY',
  SURGERY: 'SURGERY',
  PHARMACY: 'PHARMACY',
  OTHER: 'OTHER',
} as const;

export type ServiceCategory =
  (typeof ServiceCategory)[keyof typeof ServiceCategory];

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  patientName?: string;
  serviceId: string;
  service?: Service;
  serviceName?: string;
  providerId: string;
  provider?: User;
  providerName?: string;
  appointmentDate: string;
  appointmentTime: string;
  date?: string;
  time?: string;
  duration?: number;
  status: string;
  priority?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Enhanced appointment fields
  slotId?: string;
  appointmentType?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  checkInTime?: string;
  totalAmount?: number;
  paidAmount?: number;
  balance?: number;
  isPaid?: boolean;
  requiresPrePayment?: boolean;
  invoiceId?: string;
  reason?: string;
  symptoms?: string;
  followUpNotes?: string;
  parentAppointmentId?: string;
  bundleId?: string;
}

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  RESCHEDULED: 'RESCHEDULED',
} as const;

export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const AppointmentType = {
  CONSULTATION: 'CONSULTATION',
  FOLLOW_UP: 'FOLLOW_UP',
  EMERGENCY: 'EMERGENCY',
  ROUTINE_CHECKUP: 'ROUTINE_CHECKUP',
  SPECIALIST: 'SPECIALIST',
  LAB_TEST: 'LAB_TEST',
  IMAGING: 'IMAGING',
  PROCEDURE: 'PROCEDURE',
  SURGERY: 'SURGERY',
} as const;

export type AppointmentType =
  (typeof AppointmentType)[keyof typeof AppointmentType];

export const AppointmentPriority = {
  ROUTINE: 'ROUTINE',
  URGENT: 'URGENT',
  EMERGENCY: 'EMERGENCY',
  FOLLOW_UP: 'FOLLOW_UP',
} as const;

export type AppointmentPriority =
  (typeof AppointmentPriority)[keyof typeof AppointmentPriority];

// Appointment Slot Types
export interface AppointmentSlot {
  id: string;
  providerId: string;
  provider?: User;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  maxAppointments: number;
  currentAppointments: number;
  slotType: string;
  isRecurring: boolean;
  recurringPattern?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Appointment Bundle Types
export interface AppointmentBundle {
  id: string;
  name: string;
  description?: string;
  appointments: Appointment[];
  totalAmount: number;
  discountPercentage: number;
  finalAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentSearchResult {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Provider Schedule Types
export interface ProviderSchedule {
  id: string;
  providerId: string;
  provider?: User;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  maxAppointments: number;
  breakStartTime?: string;
  breakEndTime?: string;
  createdAt: string;
  updatedAt: string;
}

// Provider Time Off Types
export interface ProviderTimeOff {
  id: string;
  providerId: string;
  provider?: User;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Resource Types
export interface Resource {
  id: string;
  name: string;
  type: string;
  location: string;
  capacity: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceSchedule {
  id: string;
  resourceId: string;
  resource?: Resource;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  appointmentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Patient Preference Types
export interface PatientPreference {
  id: string;
  patientId: string;
  patient?: Patient;
  preferredProviderId?: string;
  preferredProvider?: User;
  preferredTimeSlots: string[];
  preferredDays: string[];
  communicationPreference: 'SMS' | 'EMAIL' | 'PHONE' | 'IN_APP';
  reminderPreference: '24HR' | '2HR' | '1HR' | 'NONE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Waitlist Types
export interface WaitlistEntry {
  id: string;
  patientId: string;
  patient?: Patient;
  serviceId: string;
  service?: Service;
  preferredDate: string;
  preferredTime?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  reason: string;
  status: 'WAITING' | 'CONTACTED' | 'SCHEDULED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH_NOTIFICATION' | 'IN_APP';
  recipientId: string;
  recipientType: 'PATIENT' | 'STAFF' | 'SYSTEM';
  subject: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  channel: NotificationChannel;
  subject?: string;
  content: string;
  variables?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSearchResult {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SendNotificationData {
  templateId?: string;
  type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH_NOTIFICATION' | 'IN_APP';
  recipientId: string;
  recipientType: 'PATIENT' | 'STAFF' | 'SYSTEM';
  subject: string;
  content: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  scheduledAt?: string;
  metadata?: Record<string, any>;
}

// Billing Types
export interface Invoice {
  id: string;
  patientId: string;
  patient?: Patient;
  patientName?: string;
  number: string;
  invoiceNumber?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  balance?: number;
  currency?: string;
  status: string;
  dueDate: string;
  issuedDate?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  charges?: any[];
  payments?: any[];
}

export interface InvoiceItem {
  id: string;
  serviceId: string;
  service: Service;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

// Payment Types
export interface Payment {
  id: string;
  invoiceId: string;
  invoice: Invoice;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  reference: string;
  status: PaymentStatus;
  processedBy: string;
  processedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  MOBILE_MONEY: 'MOBILE_MONEY',
  PAYSTACK_TERMINAL: 'PAYSTACK_TERMINAL',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUND_REQUESTED: 'REFUND_REQUESTED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
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

// Form Types
export interface LoginFormData {
  username: string;
  password: string;
}

export interface CreatePatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  phoneNumber: string;
  email?: string;
  address: string;
  emergencyContact: EmergencyContact;
  medicalHistory?: MedicalHistory;
  insurance?: InsuranceInfo;
}

export interface CreateInvoiceFormData {
  patientId: string;
  items: {
    serviceId: string;
    quantity: number;
    description?: string;
  }[];
  notes?: string;
  dueDate: string;
}

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  children?: NavigationItem[];
  permission?: UserRole[];
}

// Common Types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
}

export interface FilterOption {
  field: string;
  operator:
    | 'eq'
    | 'ne'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'contains'
    | 'startsWith'
    | 'endsWith';
  value: any;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}
