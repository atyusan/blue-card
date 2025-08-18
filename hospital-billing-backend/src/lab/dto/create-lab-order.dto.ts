import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateLabTestDto } from './create-lab-test.dto';

export class CreateLabOrderDto {
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
    description: 'Array of lab tests to be performed',
    type: [CreateLabTestDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLabTestDto)
  @IsOptional()
  tests?: CreateLabTestDto[];

  @ApiProperty({
    description: 'Notes for the lab order',
    example: 'Fasting required for blood tests',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
