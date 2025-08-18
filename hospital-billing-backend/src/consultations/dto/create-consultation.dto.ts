import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  IsDecimal,
} from 'class-validator';

export enum ConsultationType {
  GENERAL = 'GENERAL',
  SPECIALIST = 'SPECIALIST',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
}

export class CreateConsultationDto {
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
    description: 'Appointment date and time',
    example: '2024-12-25T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @ApiProperty({
    description: 'Type of consultation',
    enum: ConsultationType,
    example: ConsultationType.GENERAL,
  })
  @IsEnum(ConsultationType)
  @IsNotEmpty()
  consultationType: ConsultationType;

  @ApiProperty({
    description: 'Consultation fee',
    example: 50.00,
    required: false,
  })
  @IsDecimal()
  @IsOptional()
  consultationFee?: number;

  @ApiProperty({
    description: 'Notes for the consultation',
    example: 'Patient complains of headache',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
