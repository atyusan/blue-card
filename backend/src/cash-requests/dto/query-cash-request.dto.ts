import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { RequestStatus, RequestUrgency } from '../entities/cash-request.enums';

export class QueryCashRequestDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Search term for request number, purpose, or department',
    example: 'office supplies',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by department',
    example: 'Finance',
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    description: 'Filter by urgency level',
    enum: RequestUrgency,
    required: false,
  })
  @IsOptional()
  @IsEnum(RequestUrgency)
  urgency?: RequestUrgency;

  @ApiProperty({
    description: 'Filter by status',
    enum: RequestStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiProperty({
    description: 'Filter by requester ID',
    example: 'cmem3u6vx000g1dpv68lmut2u',
    required: false,
  })
  @IsOptional()
  @IsString()
  requesterId?: string;

  @ApiProperty({
    description: 'Filter by start date (ISO string)',
    example: '2025-08-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Filter by end date (ISO string)',
    example: '2025-08-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
