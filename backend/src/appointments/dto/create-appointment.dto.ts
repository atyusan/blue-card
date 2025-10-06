import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { AppointmentType, AppointmentPriority, SlotType } from '@prisma/client';

// Define enums first before using them in DTOs
enum RecurringPatternType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

enum BundleType {
  CONSULTATION_LAB = 'CONSULTATION_LAB',
  CONSULTATION_IMAGING = 'CONSULTATION_IMAGING',
  SURGERY_PACKAGE = 'SURGERY_PACKAGE',
  PREVENTIVE_PACKAGE = 'PREVENTIVE_PACKAGE',
  SPECIALIST_PACKAGE = 'SPECIALIST_PACKAGE',
}

enum WaitlistPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

enum PreferenceType {
  PROVIDER_PREFERENCE = 'PROVIDER_PREFERENCE',
  TIME_PREFERENCE = 'TIME_PREFERENCE',
  LOCATION_PREFERENCE = 'LOCATION_PREFERENCE',
  COMMUNICATION_PREFERENCE = 'COMMUNICATION_PREFERENCE',
  SPECIAL_NEEDS = 'SPECIAL_NEEDS',
}

enum TimeOffType {
  VACATION = 'VACATION',
  SICK_LEAVE = 'SICK_LEAVE',
  PERSONAL_LEAVE = 'PERSONAL_LEAVE',
  TRAINING = 'TRAINING',
  CONFERENCE = 'CONFERENCE',
  OTHER = 'OTHER',
}

enum ResourceType {
  CONSULTATION_ROOM = 'CONSULTATION_ROOM',
  LAB_ROOM = 'LAB_ROOM',
  IMAGING_ROOM = 'IMAGING_ROOM',
  OPERATING_ROOM = 'OPERATING_ROOM',
  RECOVERY_ROOM = 'RECOVERY_ROOM',
  EQUIPMENT = 'EQUIPMENT',
  VEHICLE = 'VEHICLE',
}

enum NotificationType {
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CANCELLATION = 'APPOINTMENT_CANCELLATION',
  APPOINTMENT_RESCHEDULE = 'APPOINTMENT_RESCHEDULE',
  PRE_VISIT_INSTRUCTIONS = 'PRE_VISIT_INSTRUCTIONS',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  WAITLIST_UPDATE = 'WAITLIST_UPDATE',
}

enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
  IN_APP = 'IN_APP',
  PHONE_CALL = 'PHONE_CALL',
}

export class CreateAppointmentDto {
  @IsString()
  patientId: string;

  @IsString()
  slotId: string;

  @IsEnum(AppointmentType)
  appointmentType: AppointmentType;

  @IsOptional()
  @IsEnum(AppointmentPriority)
  priority?: AppointmentPriority;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  symptoms?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  scheduledStart: string;

  @IsDateString()
  scheduledEnd: string;

  @IsOptional()
  @IsString()
  parentAppointmentId?: string;

  @IsOptional()
  @IsString()
  bundleId?: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsBoolean()
  requiresPrePayment?: boolean;
}

export class CreateAppointmentSlotDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsEnum([
    'CONSULTATION',
    'LAB_TEST',
    'IMAGING',
    'SURGERY',
    'PHARMACY',
    'FOLLOW_UP',
    'EMERGENCY',
  ])
  slotType: string;

  @IsOptional()
  @IsNumber()
  maxBookings?: number;

  @IsString()
  providerId: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @IsOptional()
  @IsNumber()
  bufferTimeBefore?: number;

  @IsOptional()
  @IsNumber()
  bufferTimeAfter?: number;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRecurringSlotDto {
  @IsString()
  slotId: string;

  @IsEnum(RecurringPatternType)
  patternType: RecurringPatternType;

  @IsNumber()
  interval: number;

  @IsArray()
  @IsNumber({}, { each: true })
  daysOfWeek: number[];

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  maxOccurrences?: number;
}

export class CreateAppointmentBundleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(BundleType)
  bundleType: BundleType;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  finalAmount?: number;
}

export class CreateWaitlistEntryDto {
  @IsString()
  patientId: string;

  @IsDateString()
  requestedDate: string;

  @IsArray()
  @IsString({ each: true })
  preferredTimeSlots: string[];

  @IsOptional()
  @IsEnum(WaitlistPriority)
  priority?: WaitlistPriority;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePatientPreferenceDto {
  @IsString()
  patientId: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsEnum(PreferenceType)
  preferenceType: PreferenceType;

  @IsString()
  preferenceValue: string;
}

export class CreateProviderScheduleDto {
  @IsString()
  providerId: string;

  @IsString()
  @IsIn([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ])
  dayOfWeek: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsString()
  breakStartTime?: string;

  @IsOptional()
  @IsString()
  breakEndTime?: string;

  @IsOptional()
  @IsBoolean()
  isWorking?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxAppointmentsPerHour?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateProviderTimeOffDto {
  @IsString()
  providerId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  reason: string;

  @IsEnum(TimeOffType)
  type: TimeOffType;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateResourceDto {
  @IsString()
  name: string;

  @IsEnum(ResourceType)
  type: ResourceType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  maintenanceSchedule?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateResourceScheduleDto {
  @IsString()
  resourceId: string;

  @IsNumber()
  dayOfWeek: number;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateNotificationDto {
  @IsString()
  appointmentId: string;

  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  recipient: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}

// Export the enums for use in other files
export {
  RecurringPatternType,
  BundleType,
  WaitlistPriority,
  PreferenceType,
  TimeOffType,
  ResourceType,
  NotificationType,
  NotificationChannel,
};
