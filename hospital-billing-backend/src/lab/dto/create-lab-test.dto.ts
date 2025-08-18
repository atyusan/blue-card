import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateLabTestDto {
  @ApiProperty({
    description: 'Service ID for the lab test',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;
}
