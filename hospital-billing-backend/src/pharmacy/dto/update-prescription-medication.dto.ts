import { PartialType } from '@nestjs/swagger';
import { CreatePrescriptionMedicationDto } from './create-prescription-medication.dto';

export class UpdatePrescriptionMedicationDto extends PartialType(
  CreatePrescriptionMedicationDto,
) {}
