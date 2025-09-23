import { Module } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { PharmacyController } from './pharmacy.controller';
import { PrismaService } from '../database/prisma.service';
import { UserPermissionsService } from '../users/user-permissions.service';

@Module({
  controllers: [PharmacyController],
  providers: [PharmacyService, PrismaService, UserPermissionsService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
