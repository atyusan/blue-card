import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMedicationInventoryDto {
  @ApiProperty({
    description: 'Medication ID',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  medicationId: string;

  @ApiProperty({
    description: 'Unique batch number',
    example: 'BATCH001-2024',
  })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({
    description: 'Expiry date',
    example: '2025-12-31T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  expiryDate: Date;

  @ApiProperty({
    description: 'Quantity in stock',
    example: 1000,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({
    description: 'Unit cost (cost per unit)',
    example: 0.25,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unitCost: number;

  @ApiProperty({
    description: 'Selling price per unit',
    example: 0.50,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  sellingPrice: number;

  @ApiProperty({
    description: 'Supplier name',
    example: 'ABC Medical Supplies',
    required: false,
  })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiProperty({
    description: 'Purchase date',
    example: '2024-01-15T00:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  purchaseDate?: Date;
}
