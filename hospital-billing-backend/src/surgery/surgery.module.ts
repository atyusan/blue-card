import { Module } from '@nestjs/common';
import { SurgeryService } from './surgery.service';
import { SurgeryController } from './surgery.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [SurgeryController],
  providers: [SurgeryService, PrismaService],
  exports: [SurgeryService],
})
export class SurgeryModule {}
