import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum BloodType {
  A_POSITIVE = 'A_POSITIVE',
  A_NEGATIVE = 'A_NEGATIVE',
  B_POSITIVE = 'B_POSITIVE',
  B_NEGATIVE = 'B_NEGATIVE',
  AB_POSITIVE = 'AB_POSITIVE',
  AB_NEGATIVE = 'AB_NEGATIVE',
  O_POSITIVE = 'O_POSITIVE',
  O_NEGATIVE = 'O_NEGATIVE',
}

export class CreatePatientDto {
  @ApiProperty({
    description: 'Patient first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Patient last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Patient date of birth',
    example: '1990-01-01',
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Patient gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({
    description: 'Patient phone number',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Patient email address',
    example: 'john.doe@email.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Patient address',
    example: '123 Main St, City, State 12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Emergency contact name',
    example: 'Jane Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiProperty({
    description: 'Emergency contact phone number',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiProperty({
    description: 'Patient blood type',
    enum: BloodType,
    example: BloodType.O_POSITIVE,
    required: false,
  })
  @IsEnum(BloodType)
  @IsOptional()
  bloodType?: BloodType;

  @ApiProperty({
    description: 'Patient allergies',
    example: 'Penicillin, Peanuts',
    required: false,
  })
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiProperty({
    description: 'Patient medical history',
    example: 'Diabetes Type 2, Hypertension',
    required: false,
  })
  @IsString()
  @IsOptional()
  medicalHistory?: string;
}
