import {
  TreatmentType,
  TreatmentStatus,
  TreatmentPriority,
  EmergencyLevel,
  ProviderRole,
  DiagnosisStatus,
  PrescriptionStatus,
  LabRequestStatus,
  ImagingRequestStatus,
  ProcedureStatus,
  AdmissionStatus,
  ReferralStatus,
  NoteType,
} from '@prisma/client';

export interface TreatmentProviderResponse {
  id: string;
  providerId: string;
  role: ProviderRole;
  isActive: boolean;
  joinedAt: Date;
  leftAt?: Date;
  transferAcknowledged: boolean;
  transferAcknowledgedAt?: Date;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    licenseNumber?: string;
  };
}

export interface PatientResponse {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  phoneNumber?: string;
  email?: string;
}

export interface PrimaryProviderResponse {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  licenseNumber?: string;
}

export interface AppointmentResponse {
  id: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: string;
  appointmentType: string;
  priority: string;
}

export interface DiagnosisResponse {
  id: string;
  diagnosisCode?: string;
  diagnosisName: string;
  description?: string;
  status: DiagnosisStatus;
  isPrimary: boolean;
  diagnosedAt: Date;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
}

export interface PrescriptionMedicationResponse {
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

export interface PrescriptionResponse {
  id: string;
  patientId: string;
  treatmentId?: string;
  prescriptionDate: Date;
  status: PrescriptionStatus;
  isPaid: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  balance: number;
  paidAmount: number;
  totalAmount: number;
  medications: PrescriptionMedicationResponse[];
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

export interface LabRequestResponse {
  id: string;
  testType: string;
  testName: string;
  description?: string;
  urgency: string;
  status: LabRequestStatus;
  requestedAt: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  specimenType?: string;
  collectionInstructions?: string;
  requestingProvider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  labProvider?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  results: LabResultResponse[];
}

export interface LabResultResponse {
  id: string;
  resultType: string;
  resultValue?: string;
  normalRange?: string;
  unit?: string;
  status: string;
  notes?: string;
  completedAt?: Date;
  reviewedAt?: Date;
}

export interface ImagingRequestResponse {
  id: string;
  imagingType: string;
  bodyPart: string;
  description?: string;
  urgency: string;
  status: ImagingRequestStatus;
  requestedAt: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  contrastRequired: boolean;
  preparationInstructions?: string;
  requestingProvider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  imagingProvider?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  results: ImagingResultResponse[];
}

export interface ImagingResultResponse {
  id: string;
  finding?: string;
  impression?: string;
  recommendation?: string;
  status: string;
  completedAt?: Date;
  reviewedAt?: Date;
  imageUrls: string[];
}

export interface ProcedureResponse {
  id: string;
  procedureName: string;
  procedureCode?: string;
  description?: string;
  status: ProcedureStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  anesthesia?: string;
  complications?: string;
  notes?: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
}

export interface AdmissionResponse {
  id: string;
  wardId?: string;
  bedNumber?: string;
  admissionType: string;
  status: AdmissionStatus;
  admittedAt: Date;
  dischargedAt?: Date;
  dischargeNotes?: string;
  ward?: {
    id: string;
    name: string;
    wardType: string;
  };
}

export interface ReferralResponse {
  id: string;
  referralType: string;
  reason: string;
  urgency: string;
  status: ReferralStatus;
  referredAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  notes?: string;
  fromProvider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  toProvider?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  toDepartment?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface TreatmentNoteResponse {
  id: string;
  noteType: NoteType;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
}

export interface TreatmentResponse {
  id: string;
  patientId: string;
  primaryProviderId: string;
  appointmentId?: string;
  title: string;
  description?: string;
  treatmentType: TreatmentType;
  status: TreatmentStatus;
  priority: TreatmentPriority;
  startDate: Date;
  endDate?: Date;
  lastUpdated: Date;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  allergies?: string;
  medications?: string;
  isEmergency: boolean;
  emergencyLevel?: EmergencyLevel;
  createdAt: Date;
  updatedAt: Date;
  patient?: PatientResponse;
  primaryProvider: PrimaryProviderResponse;
  appointment?: AppointmentResponse;
  providers: TreatmentProviderResponse[];
  diagnoses: DiagnosisResponse[];
  prescriptions: PrescriptionResponse[];
  labRequests: LabRequestResponse[];
  imagingRequests: ImagingRequestResponse[];
  procedures: ProcedureResponse[];
  admissions: AdmissionResponse[];
  referrals: ReferralResponse[];
  notes: TreatmentNoteResponse[];

  // Treatment Links
  linkedFromTreatments: TreatmentLinkResponse[];
  linkedToTreatments: TreatmentLinkResponse[];
}

export interface TreatmentSummaryResponse {
  id: string;
  title: string;
  treatmentType: TreatmentType;
  status: TreatmentStatus;
  priority: TreatmentPriority;
  startDate: Date;
  endDate?: Date;
  primaryProvider: {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  appointment?: {
    id: string;
    scheduledStart: Date;
    status: string;
  };
  diagnosisCount: number;
  prescriptionCount: number;
  isEmergency: boolean;
}

export interface TreatmentLinkResponse {
  id: string;
  fromTreatmentId: string;
  toTreatmentId: string;
  linkType: string;
  linkReason?: string;
  isActive: boolean;
  createdAt: Date;
  notes?: string;
  fromTreatment: {
    id: string;
    title: string;
    treatmentType: TreatmentType;
    status: TreatmentStatus;
    startDate: Date;
    primaryProvider: {
      id: string;
      firstName: string;
      lastName: string;
      specialization?: string;
    };
  };
  toTreatment: {
    id: string;
    title: string;
    treatmentType: TreatmentType;
    status: TreatmentStatus;
    startDate: Date;
    primaryProvider: {
      id: string;
      firstName: string;
      lastName: string;
      specialization?: string;
    };
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
