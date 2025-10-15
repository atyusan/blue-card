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
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LabService } from './lab.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { CompleteLabTestDto } from './dto/complete-lab-test.dto';

@ApiTags('Laboratory')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  // Treatment-Based Lab Requests (Must be first - specific routes)
  @Post('requests')
  @ApiOperation({ summary: 'Create lab requests for a treatment' })
  @ApiResponse({
    status: 201,
    description: 'Lab requests created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Treatment or provider not found',
  })
  createLabRequests(@Body() createLabRequestDto: any) {
    return this.labService.createLabRequests(createLabRequestDto);
  }

  @Get('requests/pool')
  @ApiOperation({
    summary: 'Get all available lab requests (pool for lab staff)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available lab requests',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by request status',
  })
  @ApiQuery({
    name: 'urgency',
    required: false,
    description: 'Filter by urgency level',
  })
  getLabRequestsPool(
    @Query('status') status?: string,
    @Query('urgency') urgency?: string,
  ) {
    return this.labService.getLabRequestsPool({ status, urgency });
  }

  @Get('results/all')
  @ApiOperation({
    summary: 'Get all lab results from both lab orders and lab requests',
    description:
      'Returns unified results from both external lab orders and treatment-based lab requests',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all lab results',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (default: COMPLETED)',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    description: 'Filter by patient ID',
  })
  getAllLabResults(
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.labService.getAllLabResults({ status, patientId });
  }

  @Get('tests/all')
  @ApiOperation({
    summary: 'Get all lab tests for administrative monitoring',
    description:
      'Returns unified tests from both external lab orders and treatment-based lab requests with full details including payment status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all lab tests for administrative monitoring',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by test status',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    description: 'Filter by source (TREATMENT or EXTERNAL)',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    description: 'Filter by patient ID',
  })
  @ApiQuery({
    name: 'isPaid',
    required: false,
    description: 'Filter by payment status',
    type: Boolean,
  })
  getAllLabTests(
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('patientId') patientId?: string,
    @Query('isPaid') isPaid?: string,
  ) {
    const isPaidBoolean =
      isPaid === 'true' ? true : isPaid === 'false' ? false : undefined;
    return this.labService.getAllLabTests({
      status,
      source,
      patientId,
      isPaid: isPaidBoolean,
    });
  }

  @Get('requests/results')
  @ApiOperation({
    summary: 'Get all completed lab requests with results',
  })
  @ApiResponse({
    status: 200,
    description: 'List of lab requests with results',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by request status (defaults to COMPLETED)',
  })
  getLabResults(@Query('status') status?: string) {
    return this.labService.getLabResults(status);
  }

  @Get('requests/provider/:providerId/assigned')
  @ApiOperation({
    summary: 'Get lab requests assigned to a specific lab provider',
  })
  @ApiResponse({
    status: 200,
    description: 'List of assigned lab requests',
  })
  getAssignedLabRequests(@Param('providerId') providerId: string) {
    return this.labService.getAssignedLabRequests(providerId);
  }

  @Get('requests/treatment/:treatmentId')
  @ApiOperation({ summary: 'Get lab requests for a specific treatment' })
  @ApiResponse({
    status: 200,
    description: 'List of lab requests for the treatment',
  })
  getLabRequestsByTreatment(@Param('treatmentId') treatmentId: string) {
    return this.labService.getLabRequestsByTreatment(treatmentId);
  }

  @Post('requests/:id/claim')
  @ApiOperation({ summary: 'Claim a lab request (lab staff picks up)' })
  @ApiResponse({
    status: 200,
    description: 'Lab request claimed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab request not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Lab request already claimed or not available',
  })
  claimLabRequest(
    @Param('id') id: string,
    @Body() body: { labProviderId: string },
  ) {
    return this.labService.claimLabRequest(id, body.labProviderId);
  }

  @Post('requests/:id/start')
  @ApiOperation({ summary: 'Start processing a lab request' })
  @ApiResponse({
    status: 200,
    description: 'Lab request processing started',
  })
  startLabRequest(@Param('id') id: string) {
    return this.labService.startLabRequest(id);
  }

  @Post('requests/:id/complete')
  @ApiOperation({ summary: 'Complete lab request with results' })
  @ApiResponse({
    status: 200,
    description: 'Lab request completed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab request not found',
  })
  completeLabRequest(
    @Param('id') id: string,
    @Body() completeLabRequestDto: any,
  ) {
    return this.labService.completeLabRequest(id, completeLabRequestDto);
  }

  @Post('requests/:id/cancel')
  @ApiOperation({ summary: 'Cancel a lab request' })
  @ApiResponse({
    status: 200,
    description: 'Lab request cancelled successfully',
  })
  cancelLabRequest(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.labService.cancelLabRequest(id, body.reason);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get lab request by ID' })
  @ApiResponse({
    status: 200,
    description: 'Lab request found with complete details',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab request not found',
  })
  getLabRequestById(@Param('id') id: string) {
    return this.labService.getLabRequestById(id);
  }

  // Lab Order Management
  @Post('orders')
  @ApiOperation({ summary: 'Create a new lab order' })
  @ApiResponse({
    status: 201,
    description: 'Lab order created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient or doctor not found',
  })
  createLabOrder(@Body() createLabOrderDto: CreateLabOrderDto) {
    return this.labService.createLabOrder(createLabOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all lab orders with optional filtering' })
  @ApiResponse({
    status: 200,
    description: 'List of lab orders retrieved successfully',
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
    name: 'status',
    required: false,
    description: 'Filter by lab order status',
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
  findAllLabOrders(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.labService.findAllLabOrders({
      patientId,
      doctorId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get lab order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Lab order found with complete details',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab order not found',
  })
  findLabOrderById(@Param('id') id: string) {
    return this.labService.findLabOrderById(id);
  }

  @Patch('orders/:id')
  @ApiOperation({ summary: 'Update lab order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Lab order updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab order not found',
  })
  updateLabOrder(
    @Param('id') id: string,
    @Body() updateLabOrderDto: UpdateLabOrderDto,
  ) {
    return this.labService.updateLabOrder(id, updateLabOrderDto);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel a lab order' })
  @ApiResponse({
    status: 200,
    description: 'Lab order cancelled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab order not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot cancel a completed lab order',
  })
  cancelLabOrder(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.labService.cancelLabOrder(id, body.reason);
  }

  @Post('orders/:id/mark-paid')
  @ApiOperation({ summary: 'Mark lab order as paid' })
  @ApiResponse({
    status: 200,
    description: 'Lab order marked as paid successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab order not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Lab order is already marked as paid',
  })
  markLabOrderAsPaid(@Param('id') id: string) {
    return this.labService.markLabOrderAsPaid(id);
  }

  // Lab Test Management
  @Post('orders/:orderId/tests')
  @ApiOperation({ summary: 'Add a test to a lab order' })
  @ApiResponse({
    status: 201,
    description: 'Test added to lab order successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab order or service not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot add tests to this lab order',
  })
  addTestToOrder(
    @Param('orderId') orderId: string,
    @Body() createLabTestDto: CreateLabTestDto,
  ) {
    return this.labService.addTestToOrder(orderId, createLabTestDto);
  }

  @Patch('tests/:testId')
  @ApiOperation({ summary: 'Update a lab test' })
  @ApiResponse({
    status: 200,
    description: 'Lab test updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab test not found',
  })
  updateLabTest(
    @Param('testId') testId: string,
    @Body() updateLabTestDto: UpdateLabTestDto,
  ) {
    return this.labService.updateLabTest(testId, updateLabTestDto);
  }

  @Post('tests/:testId/complete')
  @ApiOperation({ summary: 'Complete a lab test with results' })
  @ApiResponse({
    status: 200,
    description: 'Lab test completed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab test not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Test is not in progress',
  })
  completeLabTest(
    @Param('testId') testId: string,
    @Body() completeLabTestDto: CompleteLabTestDto,
  ) {
    return this.labService.completeLabTest(
      testId,
      completeLabTestDto.result,
      completeLabTestDto.completedBy,
    );
  }

  // Lab Test Pool Management (for paid orders)
  @Get('tests/pool/available')
  @ApiOperation({
    summary: 'Get available lab tests from paid orders',
    description:
      'Returns tests from paid lab orders that are available for lab staff to claim and process',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by test status (default: PENDING)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available lab tests',
  })
  getAvailableLabTests(@Query('status') status?: string) {
    return this.labService.getAvailableLabTests(status);
  }

  @Post('tests/:testId/claim')
  @ApiOperation({
    summary: 'Claim a lab test',
    description: 'Lab technician claims a test from the pool to work on it',
  })
  @ApiResponse({
    status: 200,
    description: 'Test claimed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab test not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Test is not available for claiming',
  })
  @ApiResponse({
    status: 403,
    description: 'Lab order must be paid before tests can be claimed',
  })
  claimLabTest(
    @Param('testId') testId: string,
    @Body('technicianId') technicianId: string,
  ) {
    return this.labService.claimLabTest(testId, technicianId);
  }

  @Post('tests/:testId/start-processing')
  @ApiOperation({
    summary: 'Start processing a claimed lab test',
  })
  @ApiResponse({
    status: 200,
    description: 'Test processing started successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab test not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Test must be claimed before starting',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only start tests that you have claimed',
  })
  startLabTestProcessing(
    @Param('testId') testId: string,
    @Body('technicianId') technicianId: string,
  ) {
    return this.labService.startLabTest(testId, technicianId);
  }

  @Post('tests/:testId/complete-with-results')
  @ApiOperation({
    summary: 'Complete a lab test with detailed results',
  })
  @ApiResponse({
    status: 200,
    description: 'Test completed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab test not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Test must be in progress to complete',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only complete tests that you are processing',
  })
  completeLabTestWithResults(
    @Param('testId') testId: string,
    @Body()
    body: {
      technicianId: string;
      resultValue?: string;
      resultUnit?: string;
      referenceRange?: string;
      isCritical?: boolean;
      notes?: string;
    },
  ) {
    const { technicianId, ...resultData } = body;
    return this.labService.completeLabTestWithResults(
      testId,
      technicianId,
      resultData,
    );
  }

  @Post('tests/:testId/cancel')
  @ApiOperation({
    summary: 'Cancel a claimed lab test',
  })
  @ApiResponse({
    status: 200,
    description: 'Test cancelled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab test not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Test is already completed or cancelled',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only cancel tests that you have claimed',
  })
  cancelLabTest(
    @Param('testId') testId: string,
    @Body() body: { technicianId: string; reason: string },
  ) {
    return this.labService.cancelLabTest(
      testId,
      body.technicianId,
      body.reason,
    );
  }

  @Get('tests/my-tests')
  @ApiOperation({
    summary: 'Get lab tests assigned to current technician',
  })
  @ApiQuery({
    name: 'technicianId',
    required: true,
    description: 'ID of the lab technician',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by test status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of assigned lab tests',
  })
  getMyLabTests(
    @Query('technicianId') technicianId: string,
    @Query('status') status?: string,
  ) {
    return this.labService.getMyLabTests(technicianId, status);
  }

  // Enhanced Lab Order Queries and Reports
  @Get('orders/ready-for-testing')
  @ApiOperation({
    summary: 'Get lab orders that are paid and ready for testing',
  })
  @ApiResponse({
    status: 200,
    description: 'List of lab orders ready for testing',
  })
  getReadyForTestingLabOrders() {
    return this.labService.getReadyForTestingLabOrders();
  }

  @Get('orders/payment-status/:isPaid')
  @ApiOperation({
    summary: 'Get lab orders by payment status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of lab orders by payment status',
  })
  @ApiParam({
    name: 'isPaid',
    description: 'Payment status (true for paid, false for unpaid)',
    type: 'boolean',
  })
  getLabOrdersByPaymentStatus(@Param('isPaid') isPaid: string) {
    return this.labService.getLabOrdersByPaymentStatus(isPaid === 'true');
  }

  @Get('tests/patient/:patientId/results')
  @ApiOperation({
    summary: 'Get completed lab test results for a patient',
  })
  @ApiResponse({
    status: 200,
    description: 'List of completed lab test results',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  getLabTestResultsByPatient(@Param('patientId') patientId: string) {
    return this.labService.getLabTestResultsByPatient(patientId);
  }

  // Lab Order Queries and Reports
  @Get('orders/pending')
  @ApiOperation({
    summary: 'Get all pending lab orders (paid and ready for processing)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending lab orders',
  })
  getPendingLabOrders() {
    return this.labService.getPendingLabOrders();
  }

  @Get('orders/patient/:patientId/summary')
  @ApiOperation({ summary: 'Get lab order summary for a patient' })
  @ApiResponse({
    status: 200,
    description: 'Patient lab order summary',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  getLabOrderSummary(@Param('patientId') patientId: string) {
    return this.labService.getLabOrderSummary(patientId);
  }

  @Get('orders/patient/:patientId/date/:date')
  @ApiOperation({ summary: 'Get lab orders for a patient on a specific date' })
  @ApiResponse({
    status: 200,
    description: 'Lab orders for the patient on the specified date',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date to get orders for (YYYY-MM-DD)',
  })
  getLabOrderByPatientAndDate(
    @Param('patientId') patientId: string,
    @Query('date') date: string,
  ) {
    return this.labService.getLabOrderByPatientAndDate(
      patientId,
      new Date(date),
    );
  }
}
