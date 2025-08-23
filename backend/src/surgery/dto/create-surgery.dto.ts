import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsDecimal,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSurgeryDto {
  @ApiProperty({
    description: 'Scheduled surgery date',
    example: '2024-12-25T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  surgeryDate: Date;

  @ApiProperty({
    description: 'Surgery type',
    example: 'Laparoscopic Appendectomy',
  })
  @IsString()
  @IsNotEmpty()
  surgeryType: string;

  @ApiProperty({
    description: 'Operating room',
    example: 'OR-1',
    required: false,
  })
  @IsString()
  @IsOptional()
  operatingRoom?: string;

  @ApiProperty({
    description: 'Expected duration in minutes',
    example: 120,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  duration?: number;

  @ApiProperty({
    description: 'Base surgery fee',
    example: 1500.0,
    required: false,
  })
  @IsDecimal()
  @IsOptional()
  surgeryFee?: number;

  @ApiProperty({
    description: 'Anesthesia service fee',
    example: 500.0,
    required: false,
  })
  @IsDecimal()
  @IsOptional()
  anesthesiaFee?: number;

  @ApiProperty({
    description: 'Post-anesthesia care unit charges',
    example: 300.0,
    required: false,
  })
  @IsDecimal()
  @IsOptional()
  pacuCharges?: number;

  @ApiProperty({
    description: 'Whether inpatient stay is required',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  requiresInpatient?: boolean;

  @ApiProperty({
    description: 'Operating room booking start time',
    example: '2024-12-25T09:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  roomBookingStart?: Date;

  @ApiProperty({
    description: 'Operating room booking end time',
    example: '2024-12-25T12:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  roomBookingEnd?: Date;

  @ApiProperty({
    description: 'Type of anesthesia to be used',
    example: 'General Anesthesia',
    required: false,
  })
  @IsString()
  @IsOptional()
  anesthesiaType?: string;

  @ApiProperty({
    description: 'Anesthesiologist ID',
    example: 'clx1234567890abcdef',
    required: false,
  })
  @IsString()
  @IsOptional()
  anesthesiologistId?: string;

  @ApiProperty({
    description: 'Pre-operative notes',
    example: 'Patient prepared for laparoscopic appendectomy',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
