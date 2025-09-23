import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaService } from '../database/prisma.service';
import { UserPermissionsService } from '../users/user-permissions.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService, PrismaService, UserPermissionsService],
  exports: [RolesService],
})
export class RolesModule {}
