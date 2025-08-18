import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateLabTestDto {
  @ApiProperty({
    description: 'Test result',
    example: 'Normal range: 70-100 mg/dL',
    required: false,
  })
  @IsString()
  @IsOptional()
  result?: string;
}
