import { Module } from '@nestjs/common';
import { CashRequestsService } from './cash-requests.service';
import { CashRequestsController } from './cash-requests.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CashRequestsController],
  providers: [CashRequestsService],
  exports: [CashRequestsService],
})
export class CashRequestsModule {}
