import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectCashRequestDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Amount exceeds department budget limit',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectionReason: string;

  @ApiProperty({
    description: 'Additional notes for rejection',
    example: 'Please revise the amount and resubmit',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  notes: string;
}
