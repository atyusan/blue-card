import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePettyCashDto {
  @ApiProperty({
    description: 'Requester ID (staff member)',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  requesterId: string;

  @ApiProperty({
    description: 'Amount requested',
    example: 50.0,
    minimum: 0.01,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Purpose of the petty cash request',
    example: 'Office supplies purchase',
  })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({
    description: 'Detailed description of the request',
    example: 'Need to purchase printer paper, pens, and other office supplies',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Expected date when the petty cash will be used',
    example: '2024-12-25',
    required: false,
  })
  @IsOptional()
  expectedDate?: Date;

  @ApiProperty({
    description: 'Additional notes for the request',
    example: 'Urgent request for department operations',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
