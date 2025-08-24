import { Module } from '@nestjs/common';
import { CashReportsController } from './cash-reports.controller';
import { CashReportsService } from './cash-reports.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CashReportsController],
  providers: [CashReportsService],
  exports: [CashReportsService],
})
export class CashReportsModule {}
