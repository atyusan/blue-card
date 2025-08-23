import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ApproveCashRequestDto {
  @ApiProperty({
    description: 'Additional notes for approval',
    example: 'Approved for office supplies purchase',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
