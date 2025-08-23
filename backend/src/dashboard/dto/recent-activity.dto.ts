import { ApiProperty } from '@nestjs/swagger';

export class RecentActivityDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({
    description: 'Activity type',
    enum: ['patient', 'appointment', 'invoice', 'payment'],
  })
  type: 'patient' | 'appointment' | 'invoice' | 'payment';

  @ApiProperty({ description: 'Activity title' })
  title: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'Activity timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'User who performed the action' })
  user: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  metadata?: any;
}
