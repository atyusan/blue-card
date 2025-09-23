import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class ExtendTemporaryPermissionDto {
  @IsDateString()
  @IsNotEmpty()
  newExpiresAt: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

