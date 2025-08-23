import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CompleteLabTestDto {
  @ApiProperty({
    description: 'Test result details',
    example: 'Hemoglobin: 14.2 g/dL (Normal range: 12.0-15.5 g/dL)',
  })
  @IsString()
  @IsNotEmpty()
  result: string;

  @ApiProperty({
    description: 'Name or ID of the person completing the test',
    example: 'Dr. Smith',
  })
  @IsString()
  @IsNotEmpty()
  completedBy: string;
}
