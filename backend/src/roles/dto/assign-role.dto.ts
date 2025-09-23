import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
} from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    description: 'Role ID to assign',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({
    description: 'Scope of the role assignment',
    example: 'GLOBAL',
    enum: ['GLOBAL', 'DEPARTMENT', 'SERVICE', 'PATIENT'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['GLOBAL', 'DEPARTMENT', 'SERVICE', 'PATIENT'])
  scope?: 'GLOBAL' | 'DEPARTMENT' | 'SERVICE' | 'PATIENT';

  @ApiProperty({
    description: 'ID of the scoped entity (department, service, patient)',
    example: 'clx1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  scopeId?: string;

  @ApiProperty({
    description: 'Array of role conditions',
    example: [],
    required: false,
  })
  @IsOptional()
  @IsArray()
  conditions?: any[];

  @ApiProperty({
    description: 'Expiration date for the role assignment',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
