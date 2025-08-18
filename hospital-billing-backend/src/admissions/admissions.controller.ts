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
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionDto } from './dto/update-admission.dto';
import { CreateDailyChargeDto } from './dto/create-daily-charge.dto';

@ApiTags('Admissions & Wards')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  // Admission Management
  @Post()
  @ApiOperation({ summary: 'Create a new admission' })
  @ApiResponse({
    status: 201,
    description: 'Admission created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient, doctor, or ward not found',
  })
  @ApiResponse({
    status: 409,
    description: 'No available beds or patient already admitted',
  })
  createAdmission(@Body() createAdmissionDto: CreateAdmissionDto) {
    return this.admissionsService.createAdmission(createAdmissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all admissions' })
  @ApiResponse({
    status: 200,
    description: 'List of all admissions',
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
    name: 'wardId',
    required: false,
    description: 'Filter by ward ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by admission status',
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
  findAllAdmissions(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('wardId') wardId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.admissionsService.findAllAdmissions({
      patientId,
      doctorId,
      wardId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    });
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active admissions' })
  @ApiResponse({
    status: 200,
    description: 'List of active admissions',
  })
  getActiveAdmissions() {
    return this.admissionsService.getActiveAdmissions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admission by ID' })
  @ApiResponse({
    status: 200,
    description: 'Admission found with complete details',
  })
  @ApiResponse({
    status: 404,
    description: 'Admission not found',
  })
  findAdmissionById(@Param('id') id: string) {
    return this.admissionsService.findAdmissionById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update admission by ID' })
  @ApiResponse({
    status: 200,
    description: 'Admission updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Admission not found',
  })
  updateAdmission(
    @Param('id') id: string,
    @Body() updateAdmissionDto: UpdateAdmissionDto,
  ) {
    return this.admissionsService.updateAdmission(id, updateAdmissionDto);
  }

  @Post(':id/discharge')
  @ApiOperation({ summary: 'Discharge a patient' })
  @ApiResponse({
    status: 200,
    description: 'Patient discharged successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Admission not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Patient is already discharged',
  })
  dischargePatient(
    @Param('id') id: string,
    @Body()
    dischargeData: {
      dischargeDate: Date;
      dischargeNotes?: string;
      finalDiagnosis?: string;
    },
  ) {
    return this.admissionsService.dischargePatient(id, dischargeData);
  }

  // Daily Charges Management
  @Post(':admissionId/daily-charges')
  @ApiOperation({ summary: 'Add a daily charge to an admission' })
  @ApiResponse({
    status: 201,
    description: 'Daily charge added successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Admission or service not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot add charges to this admission',
  })
  addDailyCharge(
    @Param('admissionId') admissionId: string,
    @Body() createDailyChargeDto: CreateDailyChargeDto,
  ) {
    return this.admissionsService.addDailyCharge(
      admissionId,
      createDailyChargeDto,
    );
  }

  @Patch('daily-charges/:chargeId')
  @ApiOperation({ summary: 'Update a daily charge' })
  @ApiResponse({
    status: 200,
    description: 'Daily charge updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Daily charge not found',
  })
  updateDailyCharge(
    @Param('chargeId') chargeId: string,
    @Body()
    updateData: {
      quantity?: number;
      notes?: string;
    },
  ) {
    return this.admissionsService.updateDailyCharge(chargeId, updateData);
  }

  @Delete(':id/daily-charges/:chargeId')
  @ApiOperation({ summary: 'Remove a daily charge from an admission' })
  @ApiResponse({
    status: 200,
    description: 'Daily charge removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Admission or daily charge not found',
  })
  removeDailyCharge(
    @Param('id') id: string,
    @Param('chargeId') chargeId: string,
  ) {
    return this.admissionsService.deleteDailyCharge(chargeId);
  }

  // Ward Management
  @Get('wards')
  @ApiOperation({ summary: 'Get all wards' })
  @ApiResponse({
    status: 200,
    description: 'List of wards retrieved successfully',
  })
  getAllWards() {
    return this.admissionsService.findAllWards();
  }

  @Get('wards/:wardId/availability')
  @ApiOperation({ summary: 'Get ward availability and statistics' })
  @ApiResponse({
    status: 200,
    description: 'Ward availability retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Ward not found',
  })
  getWardAvailability(@Param('wardId') wardId: string) {
    return this.admissionsService.getWardStatistics(wardId);
  }

  // Billing and Financial Management
  @Get(':id/billing-summary')
  @ApiOperation({ summary: 'Get admission billing summary' })
  @ApiResponse({
    status: 200,
    description: 'Admission billing summary',
  })
  @ApiResponse({
    status: 404,
    description: 'Admission not found',
  })
  getAdmissionBillingSummary(@Param('id') id: string) {
    return this.admissionsService.getAdmissionBillingSummary(id);
  }

  @Get('patient/:patientId/history')
  @ApiOperation({ summary: 'Get patient admission history' })
  @ApiResponse({
    status: 200,
    description: 'Patient admission history',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  getPatientAdmissionHistory(@Param('patientId') patientId: string) {
    return this.admissionsService.getPatientAdmissionHistory(patientId);
  }

  @Get(':id/payment-status')
  @ApiOperation({ summary: 'Check payment status before allowing services' })
  @ApiResponse({
    status: 200,
    description: 'Payment status checked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Admission not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Admission is not active',
  })
  checkPaymentStatus(@Param('id') id: string) {
    return this.admissionsService.checkPaymentStatusBeforeService(id);
  }
}
