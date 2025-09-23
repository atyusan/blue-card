import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateTemporaryPermissionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  permission: string;

  @IsDateString()
  @IsNotEmpty()
  expiresAt: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

