import { Module } from '@nestjs/common';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';
import { PrismaService } from '../database/prisma.service';
import { UserPermissionsService } from '../users/user-permissions.service';

@Module({
  controllers: [LabController],
  providers: [LabService, PrismaService, UserPermissionsService],
  exports: [LabService],
})
export class LabModule {}
