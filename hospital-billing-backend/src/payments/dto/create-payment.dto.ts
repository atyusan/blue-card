import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  INSURANCE = 'INSURANCE',
  CREDIT = 'CREDIT',
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Invoice ID',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({
    description: 'Patient ID',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 150.0,
    minimum: 0.01,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Reference number for the payment',
    example: 'REF123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiProperty({
    description: 'Notes for the payment',
    example: 'Payment for consultation services',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Transaction ID from payment gateway',
    example: 'TXN123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  transactionId?: string;
}
