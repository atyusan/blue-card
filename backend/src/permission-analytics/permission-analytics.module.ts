import { Module } from '@nestjs/common';
import { PermissionAnalyticsService } from './permission-analytics.service';
import { PermissionAnalyticsController } from './permission-analytics.controller';
import { PrismaModule } from '../database/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [PermissionAnalyticsController],
  providers: [PermissionAnalyticsService],
  exports: [PermissionAnalyticsService],
})
export class PermissionAnalyticsModule {}

