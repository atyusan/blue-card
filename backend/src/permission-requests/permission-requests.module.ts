import { Module } from '@nestjs/common';
import { PermissionRequestsService } from './permission-requests.service';
import { PermissionRequestsController } from './permission-requests.controller';
import { PrismaModule } from '../database/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [PermissionRequestsController],
  providers: [PermissionRequestsService],
  exports: [PermissionRequestsService],
})
export class PermissionRequestsModule {}
