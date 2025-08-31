import { PartialType } from '@nestjs/mapped-types';
import {
  CreateAppointmentDto,
  CreateAppointmentSlotDto,
  CreateRecurringSlotDto,
  CreateAppointmentBundleDto,
  CreateWaitlistEntryDto,
  CreatePatientPreferenceDto,
  CreateProviderScheduleDto,
  CreateProviderTimeOffDto,
  CreateResourceDto,
  CreateResourceScheduleDto,
  CreateNotificationDto,
} from './create-appointment.dto';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import {
  PaymentMethod,
  AppointmentStatus,
  AppointmentPriority,
  AppointmentType,
} from '@prisma/client';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}
export class UpdateAppointmentSlotDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsEnum([
    'CONSULTATION',
    'LAB_TEST',
    'IMAGING',
    'SURGERY',
    'PHARMACY',
    'FOLLOW_UP',
    'EMERGENCY',
  ])
  slotType?: string;

  @IsOptional()
  @IsNumber()
  maxBookings?: number;

  @IsOptional()
  @IsUUID()
  providerId?: string;

  @IsOptional()
  @IsUUID()
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
export class UpdateRecurringSlotDto extends PartialType(
  CreateRecurringSlotDto,
) {}
export class UpdateAppointmentBundleDto extends PartialType(
  CreateAppointmentBundleDto,
) {}
export class UpdateWaitlistEntryDto extends PartialType(
  CreateWaitlistEntryDto,
) {}
export class UpdatePatientPreferenceDto extends PartialType(
  CreatePatientPreferenceDto,
) {}
export class UpdateProviderScheduleDto extends PartialType(
  CreateProviderScheduleDto,
) {}
export class UpdateProviderTimeOffDto extends PartialType(
  CreateProviderTimeOffDto,
) {}
export class UpdateResourceDto extends PartialType(CreateResourceDto) {}
export class UpdateResourceScheduleDto extends PartialType(
  CreateResourceScheduleDto,
) {}
export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {}

// Special update DTOs for specific operations
export class RescheduleAppointmentDto {
  @IsString()
  appointmentId: string;

  @IsDateString()
  newStartTime: string;

  @IsDateString()
  newEndTime: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CancelAppointmentDto {
  @IsString()
  appointmentId: string;

  @IsString()
  cancellationReason: string;

  @IsOptional()
  @IsBoolean()
  refundRequired?: boolean;
}

export class CheckInAppointmentDto {
  @IsString()
  appointmentId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteAppointmentDto {
  @IsString()
  appointmentId: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  followUpNotes?: string;
}

export class ProcessPaymentDto {
  @IsString()
  appointmentId: string;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Extended update DTOs that include status and payment fields
export class UpdateAppointmentStatusDto {
  @IsString()
  appointmentId: string;

  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentPaymentDto {
  @IsString()
  appointmentId: string;

  @IsNumber()
  paidAmount: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
