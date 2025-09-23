import { Module } from '@nestjs/common';
import { PermissionTemplatesService } from './permission-templates.service';
import { PermissionTemplatesController } from './permission-templates.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PermissionTemplatesController],
  providers: [PermissionTemplatesService],
  exports: [PermissionTemplatesService],
})
export class PermissionTemplatesModule {}

