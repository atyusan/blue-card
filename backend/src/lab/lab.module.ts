import { Module } from '@nestjs/common';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [LabController],
  providers: [LabService, PrismaService],
  exports: [LabService],
})
export class LabModule {}
