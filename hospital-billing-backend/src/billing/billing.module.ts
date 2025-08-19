import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { DatabaseModule } from '../database/database.module';
import { PaystackModule } from '../paystack/paystack.module';

@Module({
  imports: [DatabaseModule, PaystackModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
