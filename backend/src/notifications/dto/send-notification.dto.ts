import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
} from 'class-validator';
import { NotificationChannel, NotificationPriority } from '@prisma/client';

export class SendNotificationDto {
  @IsString()
  templateName: string;

  @IsString()
  type: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  recipientId: string;

  @IsString()
  recipientType: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}
