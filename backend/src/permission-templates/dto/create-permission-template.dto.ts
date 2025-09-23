import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';

export class CreatePermissionTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsArray()
  @ArrayMinSize(1)
  permissions: string[];

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @IsString()
  @IsOptional()
  version?: string;
}

