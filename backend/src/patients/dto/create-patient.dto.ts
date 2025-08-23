import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum Genotype {
  AA = 'AA',
  AS = 'AS',
  AC = 'AC',
  SS = 'SS',
  SC = 'SC',
  CC = 'CC',
}

export class EmergencyContactDto {
  @ApiProperty({
    description: 'Emergency contact name',
    example: 'Jane Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Emergency contact relationship',
    example: 'Wife',
  })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({
    description: 'Emergency contact phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class MedicalHistoryDto {
  @ApiProperty({
    description: 'Patient allergies',
    example: 'Penicillin, Peanuts',
    required: false,
  })
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiProperty({
    description: 'Patient blood group',
    enum: BloodType,
    example: BloodType.B_NEGATIVE,
    required: false,
  })
  @IsEnum(BloodType)
  @IsOptional()
  bloodGroup?: BloodType;

  @ApiProperty({
    description: 'Patient genotype',
    enum: Genotype,
    example: Genotype.AC,
    required: false,
  })
  @IsEnum(Genotype)
  @IsOptional()
  genotype?: Genotype;

  @ApiProperty({
    description: 'Patient height',
    example: '6\'1"',
    required: false,
  })
  @IsString()
  @IsOptional()
  height?: string;
}

export class InsuranceDto {
  @ApiProperty({
    description: 'Insurance provider',
    example: 'Blue Cross',
    required: false,
  })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({
    description: 'Insurance policy number',
    example: 'POL123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  policyNumber?: string;

  @ApiProperty({
    description: 'Insurance group number',
    example: 'GRP789',
    required: false,
  })
  @IsString()
  @IsOptional()
  groupNumber?: string;
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
    description: 'Emergency contact information',
    type: EmergencyContactDto,
  })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsObject()
  emergencyContact: EmergencyContactDto;

  @ApiProperty({
    description: 'Medical history information',
    type: MedicalHistoryDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => MedicalHistoryDto)
  @IsObject()
  @IsOptional()
  medicalHistory?: MedicalHistoryDto;

  @ApiProperty({
    description: 'Insurance information',
    type: InsuranceDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => InsuranceDto)
  @IsObject()
  @IsOptional()
  insurance?: InsuranceDto;
}
