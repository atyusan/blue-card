import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiProperty({
    description: 'Service category name',
    example: 'Consultation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Service category description',
    example: 'Medical consultation services',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
