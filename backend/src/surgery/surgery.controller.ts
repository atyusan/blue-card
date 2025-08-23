import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SurgeryService } from './surgery.service';
import { CreateSurgeryDto } from './dto/create-surgery.dto';
import { UpdateSurgeryDto } from './dto/update-surgery.dto';
import { CreateSurgicalProcedureDto } from './dto/create-surgical-procedure.dto';
import { CreateOperatingRoomBookingDto } from './dto/create-operating-room-booking.dto';

@Controller('surgery')
@ApiTags('Surgical Services')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class SurgeryController {
  constructor(private readonly surgeryService: SurgeryService) {}

  // Surgery Management
  @Post()
  @ApiOperation({ summary: 'Create a new surgery' })
  @ApiResponse({
    status: 201,
    description: 'Surgery created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient or surgeon not found',
  })
  createSurgery(
    @Body() createSurgeryDto: CreateSurgeryDto,
    @Query('patientId') patientId: string,
    @Query('surgeonId') surgeonId: string,
  ) {
    return this.surgeryService.createSurgery(
      createSurgeryDto,
      patientId,
      surgeonId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all surgeries with optional filtering' })
  @ApiResponse({
    status: 200,
    description: 'List of surgeries retrieved successfully',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    description: 'Filter by patient ID',
  })
  @ApiQuery({
    name: 'surgeonId',
    required: false,
    description: 'Filter by surgeon ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by surgery status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by start date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by end date',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by patient name, patient ID, or surgeon name',
  })
  findAllSurgeries(
    @Query('patientId') patientId?: string,
    @Query('surgeonId') surgeonId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.surgeryService.findAllSurgeries({
      patientId,
      surgeonId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get all upcoming surgeries' })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming surgeries',
  })
  getUpcomingSurgeries() {
    return this.surgeryService.findAllSurgeries({
      startDate: new Date(),
      status: 'SCHEDULED',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get surgery by ID' })
  @ApiResponse({
    status: 200,
    description: 'Surgery found with complete details',
  })
  @ApiResponse({
    status: 404,
    description: 'Surgery not found',
  })
  findSurgeryById(@Param('id') id: string) {
    return this.surgeryService.findSurgeryById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update surgery by ID' })
  @ApiResponse({
    status: 200,
    description: 'Surgery updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Surgery not found',
  })
  updateSurgery(
    @Param('id') id: string,
    @Body() updateSurgeryDto: UpdateSurgeryDto,
  ) {
    return this.surgeryService.updateSurgery(id, updateSurgeryDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a surgery' })
  @ApiResponse({
    status: 200,
    description: 'Surgery cancelled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Surgery not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot cancel a completed surgery',
  })
  cancelSurgery(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.surgeryService.cancelSurgery(id, body.reason);
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a surgery' })
  @ApiResponse({
    status: 200,
    description: 'Surgery rescheduled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Surgery not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot reschedule this surgery or time slot not available',
  })
  rescheduleSurgery(
    @Param('id') id: string,
    @Body()
    body: {
      newSurgeryDate: string;
      newStartTime?: string;
      newEndTime?: string;
      reason?: string;
    },
  ) {
    return this.surgeryService.rescheduleSurgery(
      id,
      new Date(body.newSurgeryDate),
      body.newStartTime ? new Date(body.newStartTime) : undefined,
      body.newEndTime ? new Date(body.newEndTime) : undefined,
      body.reason,
    );
  }

  // Surgery Status Management
  @Post(':id/start')
  @ApiOperation({ summary: 'Start a surgery' })
  @ApiResponse({
    status: 200,
    description: 'Surgery started successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Surgery not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Surgery must be in preparing status to start',
  })
  startSurgery(@Param('id') id: string) {
    return this.surgeryService.startSurgery(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark surgery as completed' })
  @ApiResponse({
    status: 200,
    description: 'Surgery completed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Surgery not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Surgery cannot be completed in current status',
  })
  completeSurgery(
    @Param('id') id: string,
    @Body() completionData: { notes?: string },
  ) {
    return this.surgeryService.completeSurgery(id, completionData.notes);
  }

  // OR Management
  @Get('or/schedule/:date')
  @ApiOperation({ summary: 'Get operating room schedule for a specific date' })
  @ApiResponse({
    status: 200,
    description: 'Operating room schedule',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date to get schedule for (YYYY-MM-DD)',
  })
  getOperatingRoomSchedule(@Query('date') date: string) {
    return this.surgeryService.getOperatingRoomSchedule(new Date(date));
  }

  // Billing and Financial Management
  @Get(':id/billing-summary')
  @ApiOperation({ summary: 'Get surgery billing summary' })
  @ApiResponse({
    status: 200,
    description: 'Surgery billing summary',
  })
  @ApiResponse({
    status: 404,
    description: 'Surgery not found',
  })
  getSurgeryBillingSummary(@Param('id') id: string) {
    return this.surgeryService.getSurgeryBillingSummary(id);
  }

  @Get('patient/:patientId/history')
  @ApiOperation({ summary: 'Get patient surgery history' })
  @ApiResponse({
    status: 200,
    description: 'Patient surgery history',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  getPatientSurgeryHistory(@Param('patientId') patientId: string) {
    return this.surgeryService.getPatientSurgeryHistory(patientId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get surgery statistics for a date range' })
  @ApiResponse({
    status: 200,
    description: 'Surgery statistics',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for statistics (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for statistics (YYYY-MM-DD)',
  })
  getSurgeryStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.surgeryService.getSurgeryStatistics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('performance-analytics')
  @ApiOperation({ summary: 'Get surgery performance analytics by surgeon' })
  @ApiResponse({
    status: 200,
    description: 'Surgery performance analytics',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for analytics (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for analytics (YYYY-MM-DD)',
  })
  getSurgeryPerformanceAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.surgeryService.getSurgeryPerformanceAnalytics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Enhanced Surgery Management Endpoints
  @Post(':id/procedures')
  @ApiOperation({ summary: 'Add a surgical procedure to surgery' })
  @ApiResponse({
    status: 201,
    description: 'Surgical procedure added successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Surgery not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot add procedures to this surgery',
  })
  addSurgicalProcedure(
    @Param('id') id: string,
    @Body() createSurgicalProcedureDto: CreateSurgicalProcedureDto,
  ) {
    return this.surgeryService.addSurgicalProcedure(
      id,
      createSurgicalProcedureDto,
    );
  }

  @Post(':id/book-room')
  @ApiOperation({ summary: 'Book operating room for surgery' })
  @ApiResponse({
    status: 201,
    description: 'Operating room booked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Surgery not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot book room for this surgery or room not available',
  })
  bookOperatingRoom(
    @Param('id') id: string,
    @Body() createOperatingRoomBookingDto: CreateOperatingRoomBookingDto,
  ) {
    return this.surgeryService.bookOperatingRoom(
      id,
      createOperatingRoomBookingDto,
    );
  }

  @Get(':id/billing-details')
  @ApiOperation({ summary: 'Get detailed surgery billing information' })
  @ApiResponse({
    status: 200,
    description: 'Surgery billing details',
  })
  @ApiResponse({
    status: 404,
    description: 'Surgery not found',
  })
  getSurgeryBillingDetails(@Param('id') id: string) {
    return this.surgeryService.getSurgeryBillingDetails(id);
  }
}
