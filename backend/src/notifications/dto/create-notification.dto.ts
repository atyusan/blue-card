import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
} from 'class-validator';
import { NotificationChannel, NotificationPriority } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  type: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  recipientId: string;

  @IsString()
  recipientType: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;
}
