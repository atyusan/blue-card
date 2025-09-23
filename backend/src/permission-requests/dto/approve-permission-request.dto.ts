import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { PermissionApprovalStatus } from '@prisma/client';

export class ApprovePermissionRequestDto {
  @IsEnum(PermissionApprovalStatus)
  @IsNotEmpty()
  status: PermissionApprovalStatus;

  @IsString()
  @IsOptional()
  comments?: string;
}
