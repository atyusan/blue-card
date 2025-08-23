import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
} from 'class-validator';

enum WardType {
  GENERAL = 'GENERAL',
  PRIVATE = 'PRIVATE',
  ICU = 'ICU',
  NURSERY = 'NURSERY',
  MATERNITY = 'MATERNITY',
  PEDIATRIC = 'PEDIATRIC',
}

export class CreateAdmissionDto {
  @ApiProperty({
    description: 'Patient ID',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({
    description: 'Doctor ID (staff member)',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({
    description:
      'Ward ID (optional - will be assigned automatically if not provided)',
    example: 'clx1234567890abcdef',
    required: false,
  })
  @IsString()
  @IsOptional()
  wardId?: string;

  @ApiProperty({
    description: 'Ward type',
    example: 'GENERAL',
    enum: WardType,
  })
  @IsEnum(WardType)
  @IsNotEmpty()
  wardType: WardType;

  @ApiProperty({
    description: 'Bed number (optional)',
    example: 'A101',
    required: false,
  })
  @IsString()
  @IsOptional()
  bedNumber?: string;

  @ApiProperty({
    description: 'Deposit amount',
    example: 1000.0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  depositAmount?: number;

  @ApiProperty({
    description: 'Admission notes',
    example: 'Patient admitted for emergency surgery',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
