import { PartialType } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {
  @ApiProperty({
    description: 'Unique employee ID',
    example: 'EMP001',
    required: false,
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({
    description: 'Department ID',
    example: 'clx1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({
    description: 'Staff member specialization',
    example: 'Cardiologist',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiProperty({
    description: 'Professional license number',
    example: 'MD12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiProperty({
    description: 'Hire date',
    example: '2020-01-15T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiProperty({
    description: 'Whether the staff member is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Whether the staff member can provide services',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  serviceProvider?: boolean;

  // User fields (for frontend compatibility, but not used in staff update)
  @ApiProperty({
    description: 'Email address (read-only, cannot be updated)',
    example: 'john.doe@hospital.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'First name (read-only, cannot be updated)',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Last name (read-only, cannot be updated)',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;
}
