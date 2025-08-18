import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrescriptionMedicationDto {
  @ApiProperty({
    description: 'Medication ID',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  medicationId: string;

  @ApiProperty({
    description: 'Dosage instructions',
    example: '1 tablet',
  })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({
    description: 'Frequency of administration',
    example: 'Every 6 hours',
  })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({
    description: 'Duration of treatment',
    example: '7 days',
  })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiProperty({
    description: 'Quantity to dispense',
    example: 28,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Special instructions for the patient',
    example: 'Take with food, avoid alcohol',
    required: false,
  })
  @IsString()
  @IsOptional()
  instructions?: string;
}
