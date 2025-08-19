import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaystackController } from './paystack.controller';
import { PaystackService } from './paystack.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [PaystackController],
  providers: [PaystackService],
  exports: [PaystackService],
})
export class PaystackModule {}
