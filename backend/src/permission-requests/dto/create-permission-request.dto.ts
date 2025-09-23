import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
} from 'class-validator';

export enum PermissionRequestUrgency {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreatePermissionRequestDto {
  @IsString()
  @IsNotEmpty()
  permission: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsEnum(PermissionRequestUrgency)
  @IsOptional()
  urgency?: PermissionRequestUrgency = PermissionRequestUrgency.NORMAL;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  approverIds?: string[];

  @IsOptional()
  attachments?: any;

  @IsOptional()
  metadata?: any;
}
