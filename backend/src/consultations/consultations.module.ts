import { Module } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';
import { PrismaService } from '../database/prisma.service';
import { UserPermissionsService } from '../users/user-permissions.service';

@Module({
  controllers: [ConsultationsController],
  providers: [ConsultationsService, PrismaService, UserPermissionsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
