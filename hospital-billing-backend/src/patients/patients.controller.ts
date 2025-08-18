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
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({
    status: 201,
    description: 'Patient created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Patient with this email or phone number already exists',
  })
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all patients' })
  @ApiResponse({
    status: 200,
    description: 'List of all patients',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, patient ID, email, or phone',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  findAll(
    @Query('search') search?: string,
    @Query('isActive', ParseBoolPipe) isActive?: boolean,
  ) {
    return this.patientsService.findAll({ search, isActive });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiResponse({
    status: 200,
    description: 'Patient found with complete details',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  findOne(@Param('id') id: string) {
    return this.patientsService.findById(id);
  }

  @Get('by-patient-id/:patientId')
  @ApiOperation({ summary: 'Get patient by patient ID' })
  @ApiResponse({
    status: 200,
    description: 'Patient found',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  findByPatientId(@Param('patientId') patientId: string) {
    return this.patientsService.findByPatientId(patientId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient by ID' })
  @ApiResponse({
    status: 200,
    description: 'Patient updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Patient with this email or phone number already exists',
  })
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate patient by ID' })
  @ApiResponse({
    status: 200,
    description: 'Patient deactivated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }

  @Get(':id/account')
  @ApiOperation({ summary: 'Get patient account balance' })
  @ApiResponse({
    status: 200,
    description: 'Patient account information',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  getAccountBalance(@Param('id') id: string) {
    return this.patientsService.getAccountBalance(id);
  }

  // Enhanced Patient Management Endpoints
  @Get(':id/financial-summary')
  @ApiOperation({ summary: 'Get comprehensive patient financial summary' })
  @ApiResponse({
    status: 200,
    description: 'Patient financial summary retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  getPatientFinancialSummary(@Param('id') id: string) {
    return this.patientsService.getPatientFinancialSummary(id);
  }

  @Get(':id/outstanding-balance')
  @ApiOperation({
    summary: 'Get patient outstanding balance and overdue invoices',
  })
  @ApiResponse({
    status: 200,
    description: 'Patient outstanding balance retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  getPatientOutstandingBalance(@Param('id') id: string) {
    return this.patientsService.getPatientOutstandingBalance(id);
  }

  @Get(':id/recent-activity')
  @ApiOperation({ summary: 'Get patient recent activity across all services' })
  @ApiResponse({
    status: 200,
    description: 'Patient recent activity retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to look back (default: 30)',
    type: 'number',
  })
  getPatientRecentActivity(
    @Param('id') id: string,
    @Query('days') days?: number,
  ) {
    return this.patientsService.getPatientRecentActivity(id, days || 30);
  }

  @Post(':id/registration-invoice')
  @ApiOperation({ summary: 'Create registration invoice for new patient' })
  @ApiResponse({
    status: 201,
    description: 'Registration invoice created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Registration invoice already exists for this patient',
  })
  @ApiQuery({
    name: 'registrationFee',
    required: false,
    description: 'Registration fee amount (default: 50.0)',
    type: 'number',
  })
  createRegistrationInvoice(
    @Param('id') id: string,
    @Query('registrationFee') registrationFee?: number,
  ) {
    return this.patientsService.createRegistrationInvoice(
      id,
      registrationFee || 50.0,
    );
  }

  @Get(':id/billing-history')
  @ApiOperation({
    summary: 'Get comprehensive patient billing history with trends',
  })
  @ApiResponse({
    status: 200,
    description: 'Patient billing history retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for billing history (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for billing history (YYYY-MM-DD)',
  })
  getPatientBillingHistory(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.patientsService.getPatientBillingHistory(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
