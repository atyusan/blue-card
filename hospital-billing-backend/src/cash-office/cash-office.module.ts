import { Module } from '@nestjs/common';
import { CashOfficeService } from './cash-office.service';
import { CashOfficeController } from './cash-office.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [CashOfficeController],
  providers: [CashOfficeService, PrismaService],
  exports: [CashOfficeService],
})
export class CashOfficeModule {}
