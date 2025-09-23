import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionRequestDto } from './create-permission-request.dto';
import { IsOptional, IsEnum } from 'class-validator';

export enum PermissionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export class UpdatePermissionRequestDto extends PartialType(
  CreatePermissionRequestDto,
) {
  @IsEnum(PermissionRequestStatus)
  @IsOptional()
  status?: PermissionRequestStatus;
}
