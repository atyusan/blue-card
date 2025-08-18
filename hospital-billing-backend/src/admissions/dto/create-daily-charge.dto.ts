import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateDailyChargeDto {
  @ApiProperty({
    description: 'Service ID for the daily charge',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Quantity of the service',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    description: 'Date for the daily charge',
    example: '2024-12-20',
  })
  @IsDateString()
  @IsNotEmpty()
  chargeDate: Date;

  @ApiProperty({
    description: 'Notes for the daily charge',
    example: 'Daily ward fee',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
