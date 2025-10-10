import { PartialType } from '@nestjs/mapped-types';
import { CreateTreatmentLinkDto } from './create-treatment-link.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateTreatmentLinkDto extends PartialType(
  CreateTreatmentLinkDto,
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
