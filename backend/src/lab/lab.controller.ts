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

  @Post('tests/:testId/start')
  @ApiOperation({ summary: 'Start a lab test' })
  @ApiResponse({
    status: 200,
    description: 'Lab test started successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lab test not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Test is not in pending status',
  })
  startLabTest(@Param('testId') testId: string) {
    return this.labService.startLabTest(testId);
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
