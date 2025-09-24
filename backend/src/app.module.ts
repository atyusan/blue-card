import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';

// Database and Core Modules
import { DatabaseModule } from './database/database.module';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
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
import { CashRequestsModule } from './cash-requests/cash-requests.module';
import { CashReportsModule } from './cash-reports/cash-reports.module';
import { ReportingModule } from './reporting/reporting.module';
import { PaystackModule } from './paystack/paystack.module';
import { LoggingModule } from './logging/logging.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DepartmentsModule } from './departments/departments.module';
import { StaffModule } from './staff/staff.module';
import { RolesModule } from './roles/roles.module';
import { PermissionTemplatesModule } from './permission-templates/permission-templates.module';
import { TemporaryPermissionsModule } from './temporary-permissions/temporary-permissions.module';
import { PermissionAnalyticsModule } from './permission-analytics/permission-analytics.module';
import { PermissionRequestsModule } from './permission-requests/permission-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('rateLimit.ttl') || 60000, // 1 minute
          limit: configService.get<number>('rateLimit.limit') || 100, // 100 requests per minute
        },
      ],
      inject: [ConfigService],
    }),
    // LoggingModule,
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
    CashRequestsModule,
    CashReportsModule,
    ReportingModule,
    PaystackModule,
    DashboardModule,
    AppointmentsModule,
    NotificationsModule,
    DepartmentsModule,
    StaffModule,
    RolesModule,
    PermissionTemplatesModule,
    TemporaryPermissionsModule,
    PermissionAnalyticsModule,
    PermissionRequestsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
