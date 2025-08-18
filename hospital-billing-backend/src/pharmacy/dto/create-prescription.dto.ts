import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreatePrescriptionMedicationDto } from './create-prescription-medication.dto';

export class CreatePrescriptionDto {
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
    description: 'Array of medications to be prescribed',
    type: [CreatePrescriptionMedicationDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionMedicationDto)
  @IsOptional()
  medications?: CreatePrescriptionMedicationDto[];

  @ApiProperty({
    description: 'Notes for the prescription',
    example: 'Take with food, avoid alcohol',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
