import { Module } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { PharmacyController } from './pharmacy.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [PharmacyController],
  providers: [PharmacyService, PrismaService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
