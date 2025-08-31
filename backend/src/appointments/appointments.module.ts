import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentSlotsService } from './appointment-slots.service';
import { AppointmentBundlesService } from './appointment-bundles.service';
import { WaitlistService } from './waitlist.service';
import { PatientPreferencesService } from './patient-preferences.service';
import { ProviderSchedulesService } from './provider-schedules.service';
import { ProviderTimeOffService } from './provider-timeoff.service';
import { ResourcesService } from './resources.service';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AppointmentSlotsService,
    AppointmentBundlesService,
    WaitlistService,
    PatientPreferencesService,
    ProviderSchedulesService,
    ProviderTimeOffService,
    ResourcesService,
  ],
  exports: [
    AppointmentsService,
    AppointmentSlotsService,
    AppointmentBundlesService,
    WaitlistService,
    PatientPreferencesService,
    ProviderSchedulesService,
    ProviderTimeOffService,
    ResourcesService,
  ],
})
export class AppointmentsModule {}
