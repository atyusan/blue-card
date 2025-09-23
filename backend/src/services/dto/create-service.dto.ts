import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'General Consultation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Service description',
    example: 'General medical consultation with a doctor',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Service category ID',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    description: 'Base price for the service',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  basePrice: number;

  @ApiProperty({
    description: 'Service code (ICD-10, CPT codes)',
    example: '99213',
    required: false,
  })
  @IsString()
  @IsOptional()
  serviceCode?: string;

  @ApiProperty({
    description: 'Department ID (optional)',
    example: 'clx1234567890abcdef',
    required: false,
  })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({
    description: 'Whether the service requires pre-payment',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requiresPrePayment?: boolean = false;
}
