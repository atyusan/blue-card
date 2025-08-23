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
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

@ApiTags('Consultations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new consultation' })
  @ApiResponse({
    status: 201,
    description: 'Consultation created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient or doctor not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Appointment time conflict',
  })
  create(@Body() createConsultationDto: CreateConsultationDto) {
    return this.consultationsService.create(createConsultationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all consultations' })
  @ApiResponse({
    status: 200,
    description: 'List of all consultations',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    description: 'Filter by patient ID',
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    description: 'Filter by doctor ID',
  })
  @ApiQuery({
    name: 'consultationType',
    required: false,
    description: 'Filter by consultation type',
  })
  @ApiQuery({
    name: 'isCompleted',
    required: false,
    description: 'Filter by completion status',
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
    description: 'Search by patient name, patient ID, or doctor name',
  })
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('consultationType') consultationType?: string,
    @Query('isCompleted') isCompleted?: boolean,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.consultationsService.findAll({
      patientId,
      doctorId,
      consultationType,
      isCompleted,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get consultation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Consultation found with complete details',
  })
  @ApiResponse({
    status: 404,
    description: 'Consultation not found',
  })
  findOne(@Param('id') id: string) {
    return this.consultationsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update consultation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Consultation updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Consultation not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateConsultationDto: UpdateConsultationDto,
  ) {
    return this.consultationsService.update(id, updateConsultationDto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a consultation' })
  @ApiResponse({
    status: 200,
    description: 'Consultation completed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Consultation not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Consultation is already completed',
  })
  completeConsultation(
    @Param('id') id: string,
    @Body()
    completionData: {
      diagnosis?: string;
      treatment?: string;
      notes?: string;
    },
  ) {
    return this.consultationsService.completeConsultation(id, completionData);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a consultation' })
  @ApiResponse({
    status: 200,
    description: 'Consultation cancelled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Consultation not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot cancel a completed consultation',
  })
  cancelConsultation(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.consultationsService.cancelConsultation(id, body.reason);
  }

  @Get('doctors/:doctorId/schedule')
  @ApiOperation({ summary: 'Get doctor schedule for a specific date' })
  @ApiResponse({
    status: 200,
    description: 'Doctor schedule for the date',
  })
  @ApiResponse({
    status: 404,
    description: 'Doctor not found',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date to get schedule for (YYYY-MM-DD)',
  })
  getDoctorSchedule(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.consultationsService.getDoctorSchedule(
      doctorId,
      new Date(date),
    );
  }

  @Get('patients/:patientId/history')
  @ApiOperation({ summary: 'Get consultation history for a patient' })
  @ApiResponse({
    status: 200,
    description: 'Patient consultation history',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  getPatientConsultationHistory(@Param('patientId') patientId: string) {
    return this.consultationsService.getPatientConsultationHistory(patientId);
  }

  @Get(':id/payment-status')
  @ApiOperation({ summary: 'Check payment status before allowing consultation completion' })
  @ApiResponse({
    status: 200,
    description: 'Payment status checked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Consultation not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Consultation is already completed',
  })
  checkPaymentStatus(@Param('id') id: string) {
    return this.consultationsService.checkPaymentStatusBeforeService(id);
  }

  @Get(':id/billing-details')
  @ApiOperation({ summary: 'Get detailed consultation billing information' })
  @ApiResponse({
    status: 200,
    description: 'Consultation billing details',
  })
  @ApiResponse({
    status: 404,
    description: 'Consultation not found',
  })
  getConsultationBillingDetails(@Param('id') id: string) {
    return this.consultationsService.getConsultationBillingDetails(id);
  }
}
