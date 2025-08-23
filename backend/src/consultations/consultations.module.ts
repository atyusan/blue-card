import { Module } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [ConsultationsController],
  providers: [ConsultationsService, PrismaService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
