import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateChargeDto {
  @ApiProperty({
    description: 'Service ID',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Description of the charge',
    example: 'General consultation',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Quantity of the service',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity: number = 1;

  @ApiProperty({
    description: 'Unit price for the service',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  unitPrice: number;
}
