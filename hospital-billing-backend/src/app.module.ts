import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Database
import { DatabaseModule } from './database/database.module';

// Core modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

// Feature modules
import { PatientsModule } from './patients/patients.module';
import { ServicesModule } from './services/services.module';
import { BillingModule } from './billing/billing.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { LabModule } from './lab/lab.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { SurgeryModule } from './surgery/surgery.module';
import { PaymentsModule } from './payments/payments.module';
import { CashOfficeModule } from './cash-office/cash-office.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    ServicesModule,
    BillingModule,
    ConsultationsModule,
    LabModule,
    PharmacyModule,
    AdmissionsModule,
    SurgeryModule,
    PaymentsModule,
    CashOfficeModule,
    ReportingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
