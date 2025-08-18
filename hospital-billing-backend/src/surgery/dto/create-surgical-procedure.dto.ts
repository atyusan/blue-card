import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDecimal } from 'class-validator';

export class CreateSurgicalProcedureDto {
  @ApiProperty({
    description: 'Name of the surgical procedure',
    example: 'Laparoscopic Appendectomy',
  })
  @IsString()
  @IsNotEmpty()
  procedureName: string;

  @ApiProperty({
    description: 'Detailed description of the procedure',
    example: 'Minimally invasive removal of the appendix using laparoscope',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Cost of the surgical procedure',
    example: 1500.0,
  })
  @IsDecimal()
  @IsNotEmpty()
  cost: number;

  @ApiProperty({
    description: 'Additional notes for the procedure',
    example: 'Requires special instruments and video equipment',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
