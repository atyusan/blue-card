import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { NotificationChannel } from '@prisma/client';

export class NotificationTemplateDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
