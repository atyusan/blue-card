import { Module } from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { AdmissionsController } from './admissions.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [AdmissionsController],
  providers: [AdmissionsService, PrismaService],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
