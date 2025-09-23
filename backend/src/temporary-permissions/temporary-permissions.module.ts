import { Module } from '@nestjs/common';
import { TemporaryPermissionsService } from './temporary-permissions.service';
import { TemporaryPermissionsController } from './temporary-permissions.controller';
import { PrismaModule } from '../database/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [TemporaryPermissionsController],
  providers: [TemporaryPermissionsService],
  exports: [TemporaryPermissionsService],
})
export class TemporaryPermissionsModule {}

