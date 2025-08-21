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
  category: string;
  price: number;
  duration?: number;
  code?: string;
  currency?: string;
  active?: boolean;
  isActive?: boolean;
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
}

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

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
  currency?: string;
  status: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
