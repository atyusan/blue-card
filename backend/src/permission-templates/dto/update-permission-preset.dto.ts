import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionPresetDto } from './create-permission-preset.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePermissionPresetDto extends PartialType(
  CreatePermissionPresetDto,
) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

