import { PartialType } from '@nestjs/swagger';
import { CreateCashRequestDto } from './create-cash-request.dto';

export class UpdateCashRequestDto extends PartialType(CreateCashRequestDto) {}
