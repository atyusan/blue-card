import { ApiProperty } from '@nestjs/swagger';

export class ChartDatasetDto {
  @ApiProperty({ description: 'Dataset label' })
  label: string;

  @ApiProperty({ description: 'Data values array' })
  data: number[];

  @ApiProperty({ description: 'Background color', required: false })
  backgroundColor?: string;

  @ApiProperty({ description: 'Border color', required: false })
  borderColor?: string;

  @ApiProperty({ description: 'Border width', required: false })
  borderWidth?: number;
}

export class ChartDataDto {
  @ApiProperty({ description: 'Chart labels' })
  labels: string[];

  @ApiProperty({ description: 'Chart datasets', type: [ChartDatasetDto] })
  datasets: ChartDatasetDto[];
}
