import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateOperatingRoomBookingDto {
  @ApiProperty({
    description: 'Operating room number',
    example: 'OR-1',
  })
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @ApiProperty({
    description: 'Date of the room booking',
    example: '2024-12-25T00:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  bookingDate: Date;

  @ApiProperty({
    description: 'Start time of the room booking',
    example: '2024-12-25T09:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: Date;

  @ApiProperty({
    description: 'End time of the room booking',
    example: '2024-12-25T12:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: Date;

  @ApiProperty({
    description: 'Additional notes for the room booking',
    example: 'Requires specialized equipment setup',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
