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

export interface PatientStats {
  totalPatients: number;
  malePatients: number;
  femalePatients: number;
  activePatients: number;
  admittedPatients: number;
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
  serviceId?: string;
  service?: Service;
  serviceName?: string;
  providerId?: string;
  provider?: User;
  providerName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
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
  slot?: AppointmentSlot;
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
  provider?: {
    id: string;
    userId: string;
    employeeId: string;
    departmentId?: string;
    specialization?: string;
    licenseNumber?: string;
    serviceProvider: boolean;
    hireDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  date?: string;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  maxAppointments?: number;
  currentAppointments?: number;
  currentBookings?: number;
  maxBookings?: number;
  slotType: string;
  isRecurring?: boolean;
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
  provider?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    department: string;
  };
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isWorking: boolean;
  maxAppointmentsPerHour: number;
  breakStartTime?: string;
  breakEndTime?: string;
  notes?: string;
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

// Treatment System Types
export interface Treatment {
  id: string;
  patientId: string;
  primaryProviderId: string;
  appointmentId?: string;
  title: string;
  description?: string;
  treatmentType: TreatmentType;
  status: TreatmentStatus;
  priority: TreatmentPriority;
  startDate: string;
  endDate?: string;
  lastUpdated: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  allergies?: string;
  medications?: string;
  isEmergency: boolean;
  emergencyLevel?: EmergencyLevel;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  primaryProvider: TreatmentProvider;
  appointment?: Appointment;
  providers: TreatmentProviderRole[];
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
  labRequests: LabRequest[];
  imagingRequests: ImagingRequest[];
  procedures: Procedure[];
  admissions: Admission[];
  referrals: Referral[];
  notes: TreatmentNote[];

  // Treatment Links
  linkedFromTreatments: TreatmentLink[];
  linkedToTreatments: TreatmentLink[];
}

export interface TreatmentProviderRole {
  id: string;
  providerId: string;
  role: ProviderRole;
  isActive: boolean;
  joinedAt: string;
  leftAt?: string;
  transferAcknowledged: boolean;
  transferAcknowledgedAt?: string;
  provider: TreatmentProvider;
}

export interface TreatmentProvider {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  licenseNumber?: string;
}

export interface Diagnosis {
  id: string;
  diagnosisCode?: string;
  diagnosisName: string;
  description?: string;
  status: DiagnosisStatus;
  isPrimary: boolean;
  diagnosedAt: string;
  provider: TreatmentProvider;
}

export interface PrescriptionMedication {
  id: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  totalPrice: number;
  unitPrice: number;
  isPaid: boolean;
  medication: {
    id: string;
    name: string;
    genericName?: string;
    manufacturer?: string;
  };
  dispensedItems: any[]; // Can be expanded later
}

export interface Prescription {
  id: string;
  patientId: string;
  treatmentId?: string;
  prescriptionDate: string;
  status: PrescriptionStatus;
  isPaid: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  balance: number;
  paidAmount: number;
  totalAmount: number;
  medications: PrescriptionMedication[];
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    licenseNumber?: string;
  };
  patient: {
    id: string;
    patientId?: string;
    firstName: string;
    lastName: string;
  };
}

export interface LabRequest {
  id: string;
  testType: string;
  testName: string;
  description?: string;
  urgency: LabUrgency;
  status: LabRequestStatus;
  requestedAt: string;
  scheduledAt?: string;
  completedAt?: string;
  specimenType?: string;
  collectionInstructions?: string;
  requestingProvider: TreatmentProvider;
  labProvider?: TreatmentProvider;
  results: LabResult[];
}

export interface LabResult {
  id: string;
  resultType: string;
  resultValue?: string;
  normalRange?: string;
  unit?: string;
  status: LabResultStatus;
  notes?: string;
  completedAt?: string;
  reviewedAt?: string;
}

export interface ImagingRequest {
  id: string;
  imagingType: ImagingType;
  bodyPart: string;
  description?: string;
  urgency: ImagingUrgency;
  status: ImagingRequestStatus;
  requestedAt: string;
  scheduledAt?: string;
  completedAt?: string;
  contrastRequired: boolean;
  preparationInstructions?: string;
  requestingProvider: TreatmentProvider;
  imagingProvider?: TreatmentProvider;
  results: ImagingResult[];
}

export interface ImagingResult {
  id: string;
  finding?: string;
  impression?: string;
  recommendation?: string;
  status: ImagingResultStatus;
  completedAt?: string;
  reviewedAt?: string;
  imageUrls: string[];
}

export interface Procedure {
  id: string;
  procedureName: string;
  procedureCode?: string;
  description?: string;
  status: ProcedureStatus;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  anesthesia?: string;
  complications?: string;
  notes?: string;
  provider: TreatmentProvider;
}

export interface Admission {
  id: string;
  wardId?: string;
  bedNumber?: string;
  admissionType: AdmissionType;
  status: AdmissionStatus;
  admittedAt: string;
  dischargedAt?: string;
  dischargeNotes?: string;
  ward?: Ward;
}

export interface Ward {
  id: string;
  name: string;
  wardType: WardType;
  capacity: number;
  currentOccupancy: number;
  isActive: boolean;
}

export interface Referral {
  id: string;
  referralType: ReferralType;
  reason: string;
  urgency: ReferralUrgency;
  status: ReferralStatus;
  referredAt: string;
  acceptedAt?: string;
  completedAt?: string;
  notes?: string;
  fromProvider: TreatmentProvider;
  toProvider?: TreatmentProvider;
  toDepartment?: Department;
}

export interface TreatmentNote {
  id: string;
  noteType: NoteType;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  provider: TreatmentProvider;
}

export interface TreatmentSummary {
  id: string;
  title: string;
  treatmentType: TreatmentType;
  status: TreatmentStatus;
  priority: TreatmentPriority;
  startDate: string;
  endDate?: string;
  primaryProvider: TreatmentProvider;
  appointment?: {
    id: string;
    scheduledStart: string;
    status: string;
  };
  diagnosisCount: number;
  prescriptionCount: number;
  isEmergency: boolean;
}

export interface TreatmentLink {
  id: string;
  fromTreatmentId: string;
  toTreatmentId: string;
  linkType: TreatmentLinkType;
  linkReason?: string;
  isActive: boolean;
  createdAt: string;
  notes?: string;
  fromTreatment: {
    id: string;
    title: string;
    treatmentType: TreatmentType;
    status: TreatmentStatus;
    startDate: string;
    primaryProvider: TreatmentProvider;
  };
  toTreatment: {
    id: string;
    title: string;
    treatmentType: TreatmentType;
    status: TreatmentStatus;
    startDate: string;
    primaryProvider: TreatmentProvider;
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Treatment Enums
export enum TreatmentType {
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  SURGERY = 'SURGERY',
  THERAPY = 'THERAPY',
  REHABILITATION = 'REHABILITATION',
  PREVENTIVE = 'PREVENTIVE',
  DIAGNOSTIC = 'DIAGNOSTIC',
}

export enum TreatmentStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  COMPLETED = 'COMPLETED',
  TRANSFERRED = 'TRANSFERRED',
  CANCELLED = 'CANCELLED',
}

export enum TreatmentPriority {
  EMERGENCY = 'EMERGENCY',
  URGENT = 'URGENT',
  ROUTINE = 'ROUTINE',
  FOLLOW_UP = 'FOLLOW_UP',
}

export enum EmergencyLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MODERATE = 'MODERATE',
  LOW = 'LOW',
}

export enum ProviderRole {
  PRIMARY = 'PRIMARY',
  CONSULTANT = 'CONSULTANT',
  SPECIALIST = 'SPECIALIST',
  ASSISTANT = 'ASSISTANT',
  SUPERVISOR = 'SUPERVISOR',
}

export enum DiagnosisStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  CHRONIC = 'CHRONIC',
  RULED_OUT = 'RULED_OUT',
}

export enum PrescriptionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISCONTINUED = 'DISCONTINUED',
}

export enum LabRequestStatus {
  REQUESTED = 'REQUESTED',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum LabUrgency {
  STAT = 'STAT',
  URGENT = 'URGENT',
  ROUTINE = 'ROUTINE',
}

export enum LabResultStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CRITICAL = 'CRITICAL',
  CANCELLED = 'CANCELLED',
}

export enum ImagingRequestStatus {
  REQUESTED = 'REQUESTED',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ImagingType {
  XRAY = 'XRAY',
  CT_SCAN = 'CT_SCAN',
  MRI = 'MRI',
  ULTRASOUND = 'ULTRASOUND',
  MAMMOGRAM = 'MAMMOGRAM',
  PET_SCAN = 'PET_SCAN',
  NUCLEAR_MEDICINE = 'NUCLEAR_MEDICINE',
  FLUOROSCOPY = 'FLUOROSCOPY',
}

export enum ImagingUrgency {
  STAT = 'STAT',
  URGENT = 'URGENT',
  ROUTINE = 'ROUTINE',
}

export enum ImagingResultStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CRITICAL = 'CRITICAL',
  CANCELLED = 'CANCELLED',
}

export enum ProcedureStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
}

export enum AdmissionType {
  EMERGENCY = 'EMERGENCY',
  ELECTIVE = 'ELECTIVE',
  TRANSFER = 'TRANSFER',
  OBSERVATION = 'OBSERVATION',
}

export enum AdmissionStatus {
  ADMITTED = 'ADMITTED',
  DISCHARGED = 'DISCHARGED',
  TRANSFERRED = 'TRANSFERRED',
}

export enum ReferralType {
  SPECIALIST = 'SPECIALIST',
  SECOND_OPINION = 'SECOND_OPINION',
  DIAGNOSTIC = 'DIAGNOSTIC',
  THERAPY = 'THERAPY',
  SURGERY = 'SURGERY',
  EMERGENCY = 'EMERGENCY',
}

export enum ReferralUrgency {
  EMERGENCY = 'EMERGENCY',
  URGENT = 'URGENT',
  ROUTINE = 'ROUTINE',
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum NoteType {
  PROGRESS = 'PROGRESS',
  ASSESSMENT = 'ASSESSMENT',
  PLAN = 'PLAN',
  EDUCATION = 'EDUCATION',
  COMMUNICATION = 'COMMUNICATION',
  INCIDENT = 'INCIDENT',
}

export enum WardType {
  GENERAL = 'GENERAL',
  ICU = 'ICU',
  EMERGENCY = 'EMERGENCY',
  SURGICAL = 'SURGICAL',
  MEDICAL = 'MEDICAL',
  PEDIATRIC = 'PEDIATRIC',
  MATERNITY = 'MATERNITY',
  PSYCHIATRIC = 'PSYCHIATRIC',
  REHABILITATION = 'REHABILITATION',
}

export enum TreatmentLinkType {
  FOLLOW_UP = 'FOLLOW_UP',
  ESCALATION = 'ESCALATION',
  REFERRAL = 'REFERRAL',
  CONTINUATION = 'CONTINUATION',
  PREPROCEDURE = 'PREPROCEDURE',
  POSTPROCEDURE = 'POSTPROCEDURE',
  SERIES = 'SERIES',
  PARALLEL = 'PARALLEL',
  REPLACEMENT = 'REPLACEMENT',
  CANCELLATION = 'CANCELLATION',
}

// Treatment DTOs
export interface CreateTreatmentDto {
  patientId: string;
  primaryProviderId: string;
  appointmentId?: string;
  title: string;
  description?: string;
  treatmentType: TreatmentType;
  priority?: TreatmentPriority;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  allergies?: string;
  medications?: string;
  isEmergency?: boolean;
  emergencyLevel?: EmergencyLevel;
  additionalProviders?: {
    providerId: string;
    role?: ProviderRole;
  }[];
}

export interface UpdateTreatmentDto {
  title?: string;
  description?: string;
  treatmentType?: TreatmentType;
  priority?: TreatmentPriority;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  allergies?: string;
  medications?: string;
  isEmergency?: boolean;
  emergencyLevel?: EmergencyLevel;
  status?: TreatmentStatus;
  endDate?: string;
}

export interface TreatmentQueryParams {
  page?: number;
  limit?: number;
  patientId?: string;
  providerId?: string;
  appointmentId?: string;
  status?: TreatmentStatus;
  treatmentType?: TreatmentType;
  isEmergency?: boolean;
}

export interface CreateTreatmentLinkDto {
  fromTreatmentId: string;
  toTreatmentId: string;
  linkType: TreatmentLinkType;
  linkReason?: string;
  notes?: string;
}

export interface UpdateTreatmentLinkDto {
  linkReason?: string;
  notes?: string;
  isActive?: boolean;
}
