import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';

export enum RequestUrgency {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateCashRequestDto {
  @ApiProperty({
    description: 'Department ID making the request',
    example: 'dept_fin',
  })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({
    description: 'Purpose of the cash request',
    example: 'Office supplies purchase',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  purpose: string;

  @ApiProperty({
    description: 'Amount requested',
    example: 150.0,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Urgency level of the request',
    enum: RequestUrgency,
    default: RequestUrgency.NORMAL,
  })
  @IsEnum(RequestUrgency)
  @IsOptional()
  urgency?: RequestUrgency;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Need to purchase printer cartridges',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    description: 'File attachments (file paths/URLs)',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
