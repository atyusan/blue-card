import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { TreatmentLinkType } from '@prisma/client';

export class CreateTreatmentLinkDto {
  @IsNotEmpty()
  fromTreatmentId: string;

  @IsNotEmpty()
  toTreatmentId: string;

  @IsEnum(TreatmentLinkType)
  linkType: TreatmentLinkType;

  @IsOptional()
  @IsString()
  linkReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
