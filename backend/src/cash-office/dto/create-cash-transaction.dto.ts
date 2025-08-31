import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';

export enum TransactionType {
  CASH_IN = 'CASH_IN',
  CASH_OUT = 'CASH_OUT',
}

export class CreateCashTransactionDto {
  @ApiProperty({
    description: 'Cashier ID (staff member)',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  cashierId: string;

  @ApiProperty({
    description: 'Patient ID (optional for non-patient transactions)',
    example: 'clx1234567890abcdef',
    required: false,
  })
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.CASH_IN,
  })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  transactionType: TransactionType;

  @ApiProperty({
    description: 'Transaction amount',
    example: 100.0,
    minimum: 0.01,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Description of the transaction',
    example: 'Payment for consultation services',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Reference number for the transaction',
    example: 'REF123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiProperty({
    description: 'Additional notes for the transaction',
    example: 'Cash payment received',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
