import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { AppointmentSlotsService } from './appointment-slots.service';
import { AppointmentBundlesService } from './appointment-bundles.service';
import { WaitlistService } from './waitlist.service';
import { PatientPreferencesService } from './patient-preferences.service';
import { ProviderSchedulesService } from './provider-schedules.service';
import { ProviderTimeOffService } from './provider-timeoff.service';
import { ResourcesService } from './resources.service';
import {
  CreateAppointmentDto,
  CreateAppointmentSlotDto,
  CreateRecurringSlotDto,
  CreateProviderScheduleDto,
} from './dto/create-appointment.dto';
import {
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
  CheckInAppointmentDto,
  CompleteAppointmentDto,
  ProcessPaymentDto,
  UpdateAppointmentStatusDto,
  UpdateAppointmentPaymentDto,
  UpdateAppointmentSlotDto,
  UpdateProviderScheduleDto,
} from './dto/update-appointment.dto';
import {
  QueryAppointmentDto,
  SearchAvailableSlotsDto,
  GetProviderAvailabilityDto,
  CreateBulkSlotsDto,
  QueryAppointmentSlotDto,
  QueryWaitlistDto,
  QueryProviderScheduleDto,
  QueryResourceDto,
  GetProviderDateRangeAvailabilityDto,
} from './dto/query-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AppointmentResponse,
  AppointmentSearchResult,
  AvailableSlot,
  ProviderAvailabilityResponse,
  AppointmentStatistics,
  AppointmentSlotResponse,
  SlotSearchResult,
  ProviderDateRangeAvailabilityResponse,
  ProviderScheduleResponse,
} from './interfaces/appointment.interface';

@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly appointmentSlotsService: AppointmentSlotsService,
    private readonly bundlesService: AppointmentBundlesService,
    private readonly waitlistService: WaitlistService,
    private readonly preferencesService: PatientPreferencesService,
    private readonly providerSchedulesService: ProviderSchedulesService,
    private readonly providerTimeOffService: ProviderTimeOffService,
    private readonly resourcesService: ResourcesService,
  ) {}

  // ===== APPOINTMENT OPERATIONS =====

  @Post('reschedule')
  @ApiOperation({
    summary: 'Reschedule appointment',
    description:
      'Reschedules an existing appointment with conflict detection and slot availability checking',
  })
  @ApiBody({ type: RescheduleAppointmentDto })
  @ApiResponse({
    status: 200,
    description: 'Appointment rescheduled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  @ApiResponse({
    status: 409,
    description: 'New slot not available or scheduling conflict',
  })
  async rescheduleAppointment(
    @Body() rescheduleDto: RescheduleAppointmentDto,
  ): Promise<AppointmentResponse> {
    return this.appointmentsService.rescheduleAppointment(rescheduleDto);
  }

  @Post('cancel')
  @ApiOperation({
    summary: 'Cancel appointment',
    description:
      'Cancels an appointment with optional cancellation reason and refund processing',
  })
  @ApiBody({ type: CancelAppointmentDto })
  @ApiResponse({
    status: 200,
    description: 'Appointment cancelled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  async cancelAppointment(
    @Body() cancelDto: CancelAppointmentDto,
  ): Promise<AppointmentResponse> {
    return this.appointmentsService.cancelAppointment(cancelDto);
  }

  @Post('check-in')
  @ApiOperation({
    summary: 'Check in appointment',
    description: 'Marks an appointment as checked in with timestamp recording',
  })
  @ApiBody({ type: CheckInAppointmentDto })
  @ApiResponse({
    status: 200,
    description: 'Appointment checked in successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  async checkInAppointment(
    @Body() checkInDto: CheckInAppointmentDto,
  ): Promise<AppointmentResponse> {
    // This would update appointment status to CHECKED_IN
    return this.appointmentsService.updateAppointment(
      checkInDto.appointmentId,
      {
        status: 'CHECKED_IN',
        checkInTime: new Date().toISOString(),
      } as UpdateAppointmentDto,
    );
  }

  @Post('complete')
  @ApiOperation({
    summary: 'Complete appointment',
    description:
      'Marks an appointment as completed with follow-up notes and actual end time',
  })
  @ApiBody({ type: CompleteAppointmentDto })
  @ApiResponse({
    status: 200,
    description: 'Appointment completed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  async completeAppointment(
    @Body() completeDto: CompleteAppointmentDto,
  ): Promise<AppointmentResponse> {
    // This would update appointment status to COMPLETED
    return this.appointmentsService.updateAppointment(
      completeDto.appointmentId,
      {
        status: 'COMPLETED',
        actualEnd: new Date().toISOString(),
        notes: completeDto.followUpNotes,
      } as UpdateAppointmentDto,
    );
  }

  @Post('payment')
  @ApiOperation({
    summary: 'Process appointment payment',
    description:
      'Processes payment for an appointment with invoice integration and refund handling',
  })
  @ApiBody({ type: ProcessPaymentDto })
  @ApiResponse({
    status: 200,
    description: 'Payment processed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payment data or insufficient funds',
  })
  async processPayment(
    @Body() paymentDto: ProcessPaymentDto,
  ): Promise<AppointmentResponse> {
    // Use the enhanced payment processing with invoice integration
    return this.appointmentsService.processPayment(paymentDto);
  }

  // ===== INVOICE MANAGEMENT =====

  @Get('invoices/:appointmentId')
  @ApiOperation({
    summary: 'Get appointment invoice',
    description: 'Retrieves the invoice associated with a specific appointment',
  })
  @ApiParam({ name: 'appointmentId', description: 'Appointment ID' })
  @ApiResponse({
    status: 200,
    description: 'Appointment invoice retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment or invoice not found',
  })
  async getAppointmentInvoice(
    @Param('appointmentId') appointmentId: string,
  ): Promise<any> {
    return this.appointmentsService.getAppointmentInvoice(appointmentId);
  }

  @Get('invoices')
  @ApiOperation({
    summary: 'Get all appointment invoices',
    description:
      'Retrieves all appointment invoices with filtering and pagination',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    description: 'Filter by patient ID',
  })
  @ApiQuery({
    name: 'providerId',
    required: false,
    description: 'Filter by provider ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by invoice status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointment invoices retrieved successfully',
  })
  async getAllAppointmentInvoices(@Query() queryDto: any): Promise<any> {
    return this.appointmentsService.getAllAppointmentInvoices(queryDto);
  }

  @Post('invoices/:appointmentId/regenerate')
  @ApiOperation({
    summary: 'Regenerate appointment invoice',
    description:
      'Regenerates the invoice for a specific appointment with updated billing information',
  })
  @ApiParam({ name: 'appointmentId', description: 'Appointment ID' })
  @ApiResponse({
    status: 200,
    description: 'Appointment invoice regenerated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  async regenerateAppointmentInvoice(
    @Param('appointmentId') appointmentId: string,
  ): Promise<any> {
    return this.appointmentsService.regenerateAppointmentInvoice(appointmentId);
  }

  // ===== INTELLIGENT SCHEDULING =====

  @Post('slots/search')
  @ApiOperation({
    summary: 'Search available appointment slots',
    description:
      'Intelligent slot search with provider availability, resource constraints, and patient preferences',
  })
  @ApiBody({ type: SearchAvailableSlotsDto })
  @ApiResponse({
    status: 200,
    description: 'Available slots found successfully',
  })
  async searchAvailableSlots(
    @Body() searchDto: SearchAvailableSlotsDto,
  ): Promise<AvailableSlot[]> {
    return this.appointmentsService.searchAvailableSlots(searchDto);
  }

  @Post('slots/recurring')
  @ApiOperation({
    summary: 'Create recurring appointment slots',
    description:
      'Creates multiple appointment slots based on recurring pattern and provider availability',
  })
  @ApiBody({ type: CreateRecurringSlotDto })
  @ApiResponse({
    status: 200,
    description: 'Recurring slots created successfully',
  })
  async createRecurringSlots(
    @Body() createRecurringSlotDto: CreateRecurringSlotDto,
  ): Promise<void> {
    return this.appointmentsService.createRecurringSlots(
      createRecurringSlotDto,
    );
  }

  @Post('slots/bulk')
  @ApiOperation({
    summary: 'Create bulk appointment slots',
    description:
      'Creates multiple appointment slots in bulk for efficient scheduling',
  })
  @ApiBody({ type: CreateBulkSlotsDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk slots created successfully',
  })
  async createBulkSlots(
    @Body() bulkSlotsDto: CreateBulkSlotsDto,
  ): Promise<void> {
    return this.appointmentsService.createBulkSlots(bulkSlotsDto);
  }

  @Get('availability/provider')
  @ApiOperation({
    summary: 'Get provider availability',
    description:
      'Retrieves provider availability with schedule conflicts and time-off considerations',
  })
  @ApiQuery({ name: 'providerId', required: true, description: 'Provider ID' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider availability retrieved successfully',
  })
  async getProviderAvailability(
    @Query() availabilityDto: GetProviderAvailabilityDto,
  ): Promise<ProviderAvailabilityResponse> {
    return this.appointmentsService.getProviderAvailability(availabilityDto);
  }

  @Get('provider-availability/date-range')
  @ApiOperation({
    summary: 'Get provider availability across a date range',
    description:
      'Retrieves provider availability across multiple dates for the date-time picker, including past dates, availability status, and time slots',
  })
  @ApiQuery({
    name: 'providerId',
    description: 'Provider ID',
    example: 'provider-123',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-01-27',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date (YYYY-MM-DD)',
    example: '2025-02-27',
  })
  @ApiQuery({
    name: 'includePastDates',
    description: 'Include past dates in response',
    required: false,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Provider date range availability retrieved successfully',
  })
  async getProviderDateRangeAvailability(
    @Query() availabilityDto: GetProviderDateRangeAvailabilityDto,
  ): Promise<ProviderDateRangeAvailabilityResponse> {
    return this.appointmentsService.getProviderDateRangeAvailability(
      availabilityDto,
    );
  }

  // ===== STATISTICS & ANALYTICS =====

  @Get('statistics/overview')
  @ApiOperation({
    summary: 'Get appointment statistics',
    description:
      'Retrieves comprehensive appointment statistics including scheduling metrics, billing data, and provider performance',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointment statistics retrieved successfully',
  })
  async getAppointmentStatistics(): Promise<AppointmentStatistics> {
    return this.appointmentsService.getAppointmentStatistics();
  }

  // ===== APPOINTMENT SLOTS MANAGEMENT =====

  @Post('slots')
  @HttpCode(HttpStatus.CREATED)
  async createAppointmentSlot(
    @Body() createSlotDto: CreateAppointmentSlotDto,
  ): Promise<AppointmentSlotResponse> {
    return this.appointmentSlotsService.createAppointmentSlot(createSlotDto);
  }

  @Get('slots')
  async findAllSlots(
    @Query() queryDto: QueryAppointmentSlotDto,
  ): Promise<SlotSearchResult> {
    return this.appointmentSlotsService.findAllSlots(queryDto);
  }

  @Get('slots/:id')
  async findOneSlot(@Param('id') id: string): Promise<AppointmentSlotResponse> {
    return this.appointmentSlotsService.findOneSlot(id);
  }

  @Patch('slots/:id')
  async updateSlot(
    @Param('id') id: string,
    @Body() updateSlotDto: UpdateAppointmentSlotDto,
  ): Promise<AppointmentSlotResponse> {
    return this.appointmentSlotsService.updateSlot(id, updateSlotDto);
  }

  @Delete('slots/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSlot(@Param('id') id: string): Promise<void> {
    return this.appointmentSlotsService.removeSlot(id);
  }

  // ===== BUNDLE MANAGEMENT =====

  @Post('bundles')
  @HttpCode(HttpStatus.CREATED)
  async createAppointmentBundle(@Body() createBundleDto: any): Promise<any> {
    return this.bundlesService.create(createBundleDto);
  }

  @Get('bundles')
  async findAllBundles(@Query() queryDto: any): Promise<any> {
    return this.bundlesService.findAll(queryDto);
  }

  @Get('bundles/:id')
  async findOneBundle(@Param('id') id: string): Promise<any> {
    return this.bundlesService.findOne(id);
  }

  @Patch('bundles/:id')
  async updateBundle(
    @Param('id') id: string,
    @Body() updateBundleDto: any,
  ): Promise<any> {
    return this.bundlesService.update(id, updateBundleDto);
  }

  @Delete('bundles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBundle(@Param('id') id: string): Promise<void> {
    await this.bundlesService.remove(id);
  }

  // ===== WAITLIST MANAGEMENT =====

  @Post('waitlist')
  @HttpCode(HttpStatus.CREATED)
  async createWaitlistEntry(@Body() createWaitlistDto: any): Promise<any> {
    return this.waitlistService.create(createWaitlistDto);
  }

  @Get('waitlist')
  async findAllWaitlistEntries(
    @Query() queryDto: QueryWaitlistDto,
  ): Promise<any> {
    return this.waitlistService.findAll(queryDto);
  }

  @Get('waitlist/:id')
  async findOneWaitlistEntry(@Param('id') id: string): Promise<any> {
    return this.waitlistService.findOne(id);
  }

  @Patch('waitlist/:id')
  async updateWaitlistEntry(
    @Param('id') id: string,
    @Body() updateWaitlistDto: any,
  ): Promise<any> {
    return this.waitlistService.update(id, updateWaitlistDto);
  }

  @Delete('waitlist/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeWaitlistEntry(@Param('id') id: string): Promise<void> {
    await this.waitlistService.remove(id);
  }

  // ===== PATIENT PREFERENCES =====

  @Post('preferences')
  @HttpCode(HttpStatus.CREATED)
  async createPatientPreference(
    @Body() createPreferenceDto: any,
  ): Promise<any> {
    return this.preferencesService.create(createPreferenceDto);
  }

  @Get('preferences/:patientId')
  async findPatientPreferences(
    @Param('patientId') patientId: string,
  ): Promise<any> {
    return this.preferencesService.findAll({ patientId });
  }

  @Patch('preferences/:id')
  async updatePatientPreference(
    @Param('id') id: string,
    @Body() updatePreferenceDto: any,
  ): Promise<any> {
    return this.preferencesService.update(id, updatePreferenceDto);
  }

  @Delete('preferences/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePatientPreference(@Param('id') id: string): Promise<void> {
    await this.preferencesService.remove(id);
  }

  // ===== NOTIFICATION MANAGEMENT =====
  // (Left as-is; centralized notifications module handles this)

  // ===== PROVIDER SCHEDULE MANAGEMENT =====

  @Post('providers/schedules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create provider schedule' })
  @ApiResponse({
    status: 201,
    description: 'Provider schedule created successfully',
  })
  async createProviderSchedule(
    @Body() createScheduleDto: CreateProviderScheduleDto,
  ): Promise<ProviderScheduleResponse> {
    return this.providerSchedulesService.create(createScheduleDto);
  }

  @Get('providers/schedules')
  @ApiOperation({ summary: 'Get all provider schedules' })
  @ApiResponse({
    status: 200,
    description: 'Provider schedules retrieved successfully',
  })
  async findAllProviderSchedules(
    @Query() queryDto: QueryProviderScheduleDto,
  ): Promise<{
    schedules: ProviderScheduleResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.providerSchedulesService.findAll(queryDto);
  }

  @Get('providers/schedules/:id')
  @ApiOperation({ summary: 'Get provider schedule by ID' })
  @ApiResponse({
    status: 200,
    description: 'Provider schedule retrieved successfully',
  })
  async findOneProviderSchedule(
    @Param('id') id: string,
  ): Promise<ProviderScheduleResponse> {
    return this.providerSchedulesService.findOne(id);
  }

  @Patch('providers/schedules/:id')
  @ApiOperation({ summary: 'Update provider schedule' })
  @ApiResponse({
    status: 200,
    description: 'Provider schedule updated successfully',
  })
  async updateProviderSchedule(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateProviderScheduleDto,
  ): Promise<ProviderScheduleResponse> {
    return this.providerSchedulesService.update(id, updateScheduleDto);
  }

  @Delete('providers/schedules/:id')
  @ApiOperation({ summary: 'Delete provider schedule' })
  @ApiResponse({
    status: 204,
    description: 'Provider schedule deleted successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeProviderSchedule(@Param('id') id: string): Promise<void> {
    await this.providerSchedulesService.remove(id);
  }

  // ===== PROVIDER TIME OFF MANAGEMENT =====

  @Post('providers/time-off')
  @HttpCode(HttpStatus.CREATED)
  async createProviderTimeOff(@Body() createTimeOffDto: any): Promise<any> {
    return this.providerTimeOffService.create(createTimeOffDto);
  }

  @Get('providers/time-off')
  async findAllProviderTimeOff(@Query() queryDto: any): Promise<any> {
    return this.providerTimeOffService.findAll(queryDto);
  }

  @Get('providers/time-off/:id')
  async findOneProviderTimeOff(@Param('id') id: string): Promise<any> {
    return this.providerTimeOffService.findOne(id);
  }

  @Patch('providers/time-off/:id')
  async updateProviderTimeOff(
    @Param('id') id: string,
    @Body() updateTimeOffDto: any,
  ): Promise<any> {
    return this.providerTimeOffService.update(id, updateTimeOffDto);
  }

  @Delete('providers/time-off/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeProviderTimeOff(@Param('id') id: string): Promise<void> {
    await this.providerTimeOffService.remove(id);
  }

  @Post('providers/time-off/:id/approve')
  @ApiOperation({ summary: 'Approve time off request' })
  @ApiResponse({
    status: 200,
    description: 'Time off request approved successfully',
  })
  async approveProviderTimeOff(
    @Param('id') id: string,
    @Body() body: { approvedBy: string; notes?: string },
  ): Promise<any> {
    return this.providerTimeOffService.approve(id, body.approvedBy, body.notes);
  }

  @Post('providers/time-off/:id/reject')
  @ApiOperation({ summary: 'Reject time off request' })
  @ApiResponse({
    status: 200,
    description: 'Time off request rejected successfully',
  })
  async rejectProviderTimeOff(
    @Param('id') id: string,
    @Body() body: { approvedBy: string; notes?: string },
  ): Promise<any> {
    return this.providerTimeOffService.reject(id, body.approvedBy, body.notes);
  }

  // ===== RESOURCE MANAGEMENT =====

  @Post('resources')
  @HttpCode(HttpStatus.CREATED)
  async createResource(@Body() createResourceDto: any): Promise<any> {
    return this.resourcesService.createResource(createResourceDto);
  }

  @Get('resources')
  async findAllResources(@Query() queryDto: QueryResourceDto): Promise<any> {
    return this.resourcesService.findAllResources(queryDto);
  }

  @Get('resources/:id')
  async findOneResource(@Param('id') id: string): Promise<any> {
    return this.resourcesService.findOneResource(id);
  }

  @Patch('resources/:id')
  async updateResource(
    @Param('id') id: string,
    @Body() updateResourceDto: any,
  ): Promise<any> {
    return this.resourcesService.updateResource(id, updateResourceDto);
  }

  @Delete('resources/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeResource(@Param('id') id: string): Promise<void> {
    await this.resourcesService.removeResource(id);
  }

  // ===== RESOURCE SCHEDULE MANAGEMENT =====

  @Post('resources/schedules')
  @HttpCode(HttpStatus.CREATED)
  async createResourceSchedule(
    @Body() createResourceScheduleDto: any,
  ): Promise<any> {
    return this.resourcesService.createResourceSchedule(
      createResourceScheduleDto,
    );
  }

  @Get('resources/schedules')
  async findAllResourceSchedules(@Query() queryDto: any): Promise<any> {
    return this.resourcesService.findAllResourceSchedules(queryDto);
  }

  @Get('resources/schedules/:id')
  async findOneResourceSchedule(@Param('id') id: string): Promise<any> {
    return this.resourcesService.findOneResourceSchedule(id);
  }

  @Patch('resources/schedules/:id')
  async updateResourceSchedule(
    @Param('id') id: string,
    @Body() updateResourceScheduleDto: any,
  ): Promise<any> {
    return this.resourcesService.updateResourceSchedule(
      id,
      updateResourceScheduleDto,
    );
  }

  @Delete('resources/schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeResourceSchedule(@Param('id') id: string): Promise<void> {
    await this.resourcesService.removeResourceSchedule(id);
  }

  // ===== SERVICE PROVIDER MANAGEMENT =====

  @Get('providers/:providerId/services')
  @ApiOperation({
    summary: 'Get services available to a provider',
    description:
      'Retrieves all services that a specific provider can offer based on their department',
  })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  @ApiResponse({
    status: 200,
    description: 'Services available to provider retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Provider is not authorized to provide services',
  })
  async getProviderServices(
    @Param('providerId') providerId: string,
  ): Promise<any[]> {
    return await this.appointmentsService.getProviderServices(providerId);
  }

  @Post('providers/:providerId/services/:serviceId/validate')
  @ApiOperation({
    summary: 'Validate provider access to service',
    description:
      'Validates that a provider can offer a specific service based on department constraints',
  })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiResponse({
    status: 200,
    description: 'Provider access validated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider or service not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Provider cannot access this service',
  })
  async validateProviderServiceAccess(
    @Param('providerId') providerId: string,
    @Param('serviceId') serviceId: string,
  ): Promise<{ valid: boolean; message: string }> {
    await this.appointmentsService.validateServiceProviderAccess(
      providerId,
      serviceId,
    );
    return { valid: true, message: 'Provider can access this service' };
  }

  // ===== APPOINTMENT MANAGEMENT =====

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new appointment',
    description:
      'Creates a new appointment with intelligent scheduling, conflict detection, and automatic billing integration',
  })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiResponse({
    status: 201,
    description: 'Appointment created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid appointment data or scheduling conflict',
  })
  @ApiResponse({
    status: 409,
    description: 'Appointment slot not available or provider unavailable',
  })
  async createAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<AppointmentResponse> {
    return this.appointmentsService.createAppointment(createAppointmentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all appointments',
    description:
      'Retrieves appointments with advanced filtering, pagination, and search capabilities',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    description: 'Filter by patient ID',
  })
  @ApiQuery({
    name: 'providerId',
    required: false,
    description: 'Filter by provider ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by appointment status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by end date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Appointments retrieved successfully',
  })
  async findAll(
    @Query() queryDto: QueryAppointmentDto,
  ): Promise<AppointmentSearchResult> {
    return this.appointmentsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get appointment by ID',
    description:
      'Retrieves a specific appointment with complete details including patient, provider, and billing information',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({
    status: 200,
    description: 'Appointment found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  async findOne(@Param('id') id: string): Promise<AppointmentResponse> {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update appointment',
    description:
      'Updates appointment details with validation and conflict checking',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiBody({ type: UpdateAppointmentDto })
  @ApiResponse({
    status: 200,
    description: 'Appointment updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data or scheduling conflict',
  })
  async updateAppointment(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<AppointmentResponse> {
    return this.appointmentsService.updateAppointment(id, updateAppointmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete appointment',
    description: 'Soft deletes an appointment by setting status to cancelled',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({
    status: 204,
    description: 'Appointment deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Appointment not found',
  })
  async removeAppointment(@Param('id') id: string): Promise<void> {
    // This would typically call a soft delete or status update
    await this.appointmentsService.cancelAppointment({
      appointmentId: id,
      cancellationReason: 'Deleted by user',
    });
  }
}
