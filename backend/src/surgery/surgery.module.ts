import { Module } from '@nestjs/common';
import { SurgeryService } from './surgery.service';
import { SurgeryController } from './surgery.controller';
import { PrismaService } from '../database/prisma.service';
import { UserPermissionsService } from '../users/user-permissions.service';

@Module({
  controllers: [SurgeryController],
  providers: [SurgeryService, PrismaService, UserPermissionsService],
  exports: [SurgeryService],
})
export class SurgeryModule {}
