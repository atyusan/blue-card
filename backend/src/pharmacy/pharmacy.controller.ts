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
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PharmacyService } from './pharmacy.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { CreatePrescriptionMedicationDto } from './dto/create-prescription-medication.dto';
import { UpdatePrescriptionMedicationDto } from './dto/update-prescription-medication.dto';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { CreateMedicationInventoryDto } from './dto/create-medication-inventory.dto';

import { DispenseMedicationDto } from './dto/dispense-medication.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Pharmacy')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  // ===== MEDICATION MANAGEMENT =====

  @Post('medications')
  @ApiOperation({ summary: 'Create a new medication' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Medication created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Drug code already exists',
  })
  createMedication(@Body() createMedicationDto: CreateMedicationDto) {
    return this.pharmacyService.createMedication(createMedicationDto);
  }

  @Get('medications')
  @ApiOperation({ summary: 'Get all medications with optional filtering' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, generic name, or drug code',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by medication category',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'controlledDrug',
    required: false,
    description: 'Filter by controlled drug status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Medications retrieved successfully',
  })
  findAllMedications(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: boolean,
    @Query('controlledDrug') controlledDrug?: boolean,
  ) {
    return this.pharmacyService.findAllMedications({
      search,
      category,
      isActive,
      controlledDrug,
    });
  }

  @Get('medications/:id')
  @ApiOperation({ summary: 'Get medication by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Medication retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Medication not found',
  })
  findMedicationById(@Param('id') id: string) {
    return this.pharmacyService.findMedicationById(id);
  }

  // ===== INVENTORY MANAGEMENT =====

  @Post('inventory')
  @ApiOperation({ summary: 'Add medication to inventory' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Inventory item added successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Batch number already exists',
  })
  addInventoryItem(@Body() createInventoryDto: CreateMedicationInventoryDto) {
    return this.pharmacyService.addInventoryItem(createInventoryDto);
  }

  @Patch('inventory/:id')
  @ApiOperation({ summary: 'Update inventory item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory item updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot update inventory with reserved quantities',
  })
  updateInventoryItem(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateMedicationInventoryDto>,
  ) {
    return this.pharmacyService.updateInventoryItem(id, updateData);
  }

  @Get('inventory/summary')
  @ApiOperation({ summary: 'Get inventory summary and statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory summary retrieved successfully',
  })
  getInventorySummary() {
    return this.pharmacyService.getInventorySummary();
  }

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Low stock alerts retrieved successfully',
  })
  getLowStockAlerts() {
    return this.pharmacyService.getLowStockAlerts();
  }

  @Get('inventory/expiring')
  @ApiOperation({ summary: 'Get medications expiring soon' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Days threshold for expiry warning',
    example: 30,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expiring medications retrieved successfully',
  })
  getExpiringMedications(@Query('days') days: number = 30) {
    return this.pharmacyService.getExpiringMedications(days);
  }

  // ===== PRESCRIPTION MANAGEMENT =====

  @Post('prescriptions')
  @ApiOperation({ summary: 'Create a new prescription' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Prescription created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Insufficient stock for medications',
  })
  createPrescription(@Body() createPrescriptionDto: CreatePrescriptionDto) {
    return this.pharmacyService.createPrescription(createPrescriptionDto);
  }

  @Get('prescriptions')
  @ApiOperation({ summary: 'Get all prescriptions with optional filtering' })
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
    name: 'status',
    required: false,
    description: 'Filter by prescription status',
  })
  @ApiQuery({
    name: 'isPaid',
    required: false,
    description: 'Filter by payment status',
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
    description: 'Search by patient name or ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescriptions retrieved successfully',
  })
  findAllPrescriptions(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: string,
    @Query('isPaid') isPaid?: boolean,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('search') search?: string,
  ) {
    return this.pharmacyService.findAllPrescriptions({
      patientId,
      doctorId,
      status,
      isPaid,
      startDate,
      endDate,
      search,
    });
  }

  @Get('prescriptions/:id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescription retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Prescription not found',
  })
  findPrescriptionById(@Param('id') id: string) {
    return this.pharmacyService.findPrescriptionById(id);
  }

  @Patch('prescriptions/:id')
  @ApiOperation({ summary: 'Update prescription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescription updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Prescription not found',
  })
  updatePrescription(
    @Param('id') id: string,
    @Body() updatePrescriptionDto: UpdatePrescriptionDto,
  ) {
    return this.pharmacyService.updatePrescription(id, updatePrescriptionDto);
  }

  // ===== PAYMENT PROCESSING =====

  @Post('prescriptions/:id/invoice')
  @ApiOperation({ summary: 'Create invoice for prescription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Cannot create invoice for dispensed/cancelled prescription or if invoice already exists',
  })
  createInvoiceForPrescription(@Param('id') prescriptionId: string) {
    return this.pharmacyService.createInvoiceForPrescription(prescriptionId);
  }

  // ===== DISPENSING =====

  @Post('prescriptions/:id/dispense')
  @ApiOperation({ summary: 'Dispense prescription medications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Medications dispensed successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Prescription must be fully paid before dispensing',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Prescription already dispensed or cancelled',
  })
  dispenseMedication(
    @Param('id') prescriptionId: string,
    @Body() dispenseDto: DispenseMedicationDto,
  ) {
    return this.pharmacyService.dispenseMedication(prescriptionId, dispenseDto);
  }

  // ===== REPORTS AND ANALYTICS =====

  @Get('reports/pharmacy')
  @ApiOperation({ summary: 'Get comprehensive pharmacy report' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Report start date',
  })
  @ApiQuery({ name: 'endDate', required: true, description: 'Report end date' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pharmacy report generated successfully',
  })
  getPharmacyReport(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.pharmacyService.getPharmacyReport(startDate, endDate);
  }

  // ===== PRESCRIPTION MEDICATION MANAGEMENT =====

  @Post('prescriptions/:id/medications')
  @ApiOperation({ summary: 'Add medication to prescription' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Medication added to prescription successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Medication already exists in prescription',
  })
  addMedicationToPrescription(
    @Param('id') prescriptionId: string,
    @Body() createMedicationDto: CreatePrescriptionMedicationDto,
  ) {
    return this.pharmacyService.addMedicationToPrescription(
      prescriptionId,
      createMedicationDto,
    );
  }

  @Patch('prescription-medications/:id')
  @ApiOperation({ summary: 'Update prescription medication' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prescription medication updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Prescription medication not found',
  })
  updatePrescriptionMedication(
    @Param('id') id: string,
    @Body() updateMedicationDto: UpdatePrescriptionMedicationDto,
  ) {
    return this.pharmacyService.updatePrescriptionMedication(
      id,
      updateMedicationDto,
    );
  }

  @Delete('prescription-medications/:id')
  @ApiOperation({ summary: 'Remove medication from prescription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Medication removed from prescription successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot remove medications from non-pending prescription',
  })
  removeMedicationFromPrescription(
    @Param('id') medicationId: string,
    @Query('prescriptionId') prescriptionId: string,
  ) {
    return this.pharmacyService.removeMedicationFromPrescription(
      prescriptionId,
      medicationId,
    );
  }

  // ===== HELPER ENDPOINTS: BILLING, PAYMENT, AVAILABILITY =====

  @Get('prescriptions/:id/payment-status')
  @ApiOperation({ summary: 'Get payment status for a prescription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment status retrieved',
  })
  getPrescriptionPaymentStatus(@Param('id') id: string) {
    return this.pharmacyService.getPrescriptionPaymentStatus(id);
  }

  @Get('prescriptions/:id/billing-details')
  @ApiOperation({ summary: 'Get detailed billing info for a prescription' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Billing details retrieved',
  })
  getPrescriptionBillingDetails(@Param('id') id: string) {
    return this.pharmacyService.getPrescriptionBillingDetails(id);
  }

  @Get('prescriptions/ready-to-dispense')
  @ApiOperation({
    summary: 'List prescriptions fully paid and ready to dispense',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ready-to-dispense list retrieved',
  })
  getReadyToDispensePrescriptions() {
    return this.pharmacyService.getReadyToDispensePrescriptions();
  }

  @Get('prescriptions/:id/availability')
  @ApiOperation({ summary: 'Check inventory availability for a prescription' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Availability checked' })
  checkPrescriptionAvailability(@Param('id') id: string) {
    return this.pharmacyService.checkPrescriptionAvailability(id);
  }

  @Get('inventory/valuation')
  @ApiOperation({
    summary: 'Get inventory stock valuation and potential margin',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory valuation retrieved',
  })
  getInventoryValuation() {
    return this.pharmacyService.getInventoryValuation();
  }

  @Get('inventory/aging')
  @ApiOperation({ summary: 'Get inventory aging report' })
  @ApiQuery({
    name: 'buckets',
    required: false,
    description: 'Comma-separated day buckets e.g. 30,60,90',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory aging report retrieved',
  })
  getInventoryAgingReport(@Query('buckets') buckets?: string) {
    const parsed = buckets
      ? buckets
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n) && n > 0)
      : undefined;
    return this.pharmacyService.getInventoryAgingReport(parsed);
  }
}
