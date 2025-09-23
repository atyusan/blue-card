import { Module } from '@nestjs/common';
import { CashOfficeService } from './cash-office.service';
import { CashOfficeController } from './cash-office.controller';
import { PrismaService } from '../database/prisma.service';
import { UserPermissionsService } from '../users/user-permissions.service';

@Module({
  controllers: [CashOfficeController],
  providers: [CashOfficeService, PrismaService, UserPermissionsService],
  exports: [CashOfficeService],
})
export class CashOfficeModule {}
