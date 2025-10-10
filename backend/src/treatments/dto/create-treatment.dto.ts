import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TreatmentType,
  TreatmentPriority,
  EmergencyLevel,
  ProviderRole,
} from '@prisma/client';

export class AdditionalProviderDto {
  @IsString()
  providerId: string;

  @IsOptional()
  @IsEnum(ProviderRole)
  role?: ProviderRole;
}

export class CreateTreatmentDto {
  @IsString()
  patientId: string;

  @IsString()
  primaryProviderId: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TreatmentType)
  treatmentType: TreatmentType;

  @IsOptional()
  @IsEnum(TreatmentPriority)
  priority?: TreatmentPriority;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  historyOfPresentIllness?: string;

  @IsOptional()
  @IsString()
  pastMedicalHistory?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  medications?: string;

  @IsOptional()
  @IsBoolean()
  isEmergency?: boolean;

  @IsOptional()
  @IsEnum(EmergencyLevel)
  emergencyLevel?: EmergencyLevel;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalProviderDto)
  additionalProviders?: AdditionalProviderDto[];
}
