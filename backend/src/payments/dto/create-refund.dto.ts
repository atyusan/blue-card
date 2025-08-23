import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsPositive,
} from 'class-validator';

export class CreateRefundDto {
  @ApiProperty({
    description: 'Payment ID to refund',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({
    description: 'Refund amount',
    example: 50.0,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Reason for refund',
    example: 'Patient requested refund due to service cancellation',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Additional notes for the refund',
    example: 'Service was cancelled by patient',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Reference number for the refund',
    example: 'REF123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  referenceNumber?: string;
}
