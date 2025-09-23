import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePermissionPresetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsArray()
  @IsOptional()
  customizations?: any[];
}

