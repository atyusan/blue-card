import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTemporaryPermissionDto {
  @IsString()
  @IsOptional()
  reason?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

