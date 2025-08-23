import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class DispenseMedicationDto {
  @ApiProperty({
    description: 'Staff member ID who is dispensing the medication',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  dispensedBy: string;

  @ApiProperty({
    description: 'Notes about the dispensing',
    example: 'Patient instructed to take with food',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
