import { PartialType } from '@nestjs/mapped-types';
import { CreateTreatmentDto } from './create-treatment.dto';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TreatmentStatus } from '@prisma/client';

export class UpdateTreatmentDto extends PartialType(CreateTreatmentDto) {
  @IsOptional()
  @IsEnum(TreatmentStatus)
  status?: TreatmentStatus;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
