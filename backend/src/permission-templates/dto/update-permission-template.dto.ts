import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionTemplateDto } from './create-permission-template.dto';

export class UpdatePermissionTemplateDto extends PartialType(
  CreatePermissionTemplateDto,
) {}

