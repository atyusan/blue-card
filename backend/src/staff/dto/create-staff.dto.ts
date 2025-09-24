import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({
    description: 'Staff member email address',
    example: 'john.doe@hospital.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Staff member first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Staff member last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Unique employee ID',
    example: 'EMP001',
  })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'Department ID',
    example: 'clx1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({
    description: 'Department name (for backward compatibility)',
    example: 'Cardiology',
  })
  @IsString()
  @IsNotEmpty()
  department: string;

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
  })
  @IsDateString()
  @IsNotEmpty()
  hireDate: string;

  @ApiProperty({
    description: 'Whether the staff member is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
