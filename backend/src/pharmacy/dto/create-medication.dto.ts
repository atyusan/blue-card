import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateMedicationDto {
  @ApiProperty({
    description: 'Unique drug code identifier',
    example: 'PARA500',
  })
  @IsString()
  @IsNotEmpty()
  drugCode: string;

  @ApiProperty({
    description: 'Medication name',
    example: 'Paracetamol',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Generic name of the medication',
    example: 'Acetaminophen',
    required: false,
  })
  @IsString()
  @IsOptional()
  genericName?: string;

  @ApiProperty({
    description: 'Medication strength',
    example: '500mg',
    required: false,
  })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiProperty({
    description: 'Medication form',
    example: 'Tablet',
    required: false,
  })
  @IsString()
  @IsOptional()
  form?: string;

  @ApiProperty({
    description: 'Manufacturer name',
    example: 'ABC Pharmaceuticals',
    required: false,
  })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({
    description: 'Medication category',
    example: 'Painkiller',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Whether this is a controlled substance',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  controlledDrug?: boolean;

  @ApiProperty({
    description: 'Whether this medication requires a prescription',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  requiresPrescription?: boolean;
}
