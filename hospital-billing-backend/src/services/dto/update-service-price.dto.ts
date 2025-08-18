import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateServicePriceDto {
  @ApiProperty({ description: 'New price for the service', example: 75.0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;
}
