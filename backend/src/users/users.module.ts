import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../database/prisma.service';
import { UserPermissionsService } from './user-permissions.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, UserPermissionsService],
  exports: [UsersService, UserPermissionsService],
})
export class UsersModule {}
