import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';
import { PrismaService } from '../database/prisma.service';
import { UserPermissionsService } from '../users/user-permissions.service';
import { BillingModule } from '../billing/billing.module';
import { BillingService } from '../billing/billing.service';

@Module({
  imports: [forwardRef(() => BillingModule)],
  controllers: [LabController],
  providers: [LabService, PrismaService, UserPermissionsService],
  exports: [LabService],
})
export class LabModule implements OnModuleInit {
  constructor(
    private readonly labService: LabService,
    private readonly billingService: BillingService,
  ) {}

  onModuleInit() {
    // Set up bidirectional link
    this.billingService.setLabService(this.labService);
  }
}
