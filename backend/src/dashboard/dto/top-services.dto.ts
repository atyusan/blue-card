import { ApiProperty } from '@nestjs/swagger';

export class TopServiceDto {
  @ApiProperty({ description: 'Service ID' })
  id: string;

  @ApiProperty({ description: 'Service name' })
  name: string;

  @ApiProperty({ description: 'Service category' })
  category: string;

  @ApiProperty({ description: 'Number of times used' })
  count: number;

  @ApiProperty({ description: 'Revenue generated' })
  revenue: number;
}
