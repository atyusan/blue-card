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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CashRequestsService } from './cash-requests.service';
import { CreateCashRequestDto } from './dto/create-cash-request.dto';
import { UpdateCashRequestDto } from './dto/update-cash-request.dto';
import { QueryCashRequestDto } from './dto/query-cash-request.dto';
import { ApproveCashRequestDto } from './dto/approve-cash-request.dto';
import { RejectCashRequestDto } from './dto/reject-cash-request.dto';
import { CashRequest } from './entities/cash-request.entity';

@ApiTags('Cash Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cash-requests')
export class CashRequestsController {
  constructor(private readonly cashRequestsService: CashRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cash request' })
  @ApiResponse({
    status: 201,
    description: 'Cash request created successfully',
    type: CashRequest,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createCashRequestDto: CreateCashRequestDto,
    @Request() req: any,
  ) {
    return this.cashRequestsService.create(
      createCashRequestDto,
      req.user.staffMemberId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all cash requests with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Cash requests retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CashRequest' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() query: QueryCashRequestDto, @Request() req: any) {
    return this.cashRequestsService.findAll(query, req.user.staffMemberId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get cash request statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalRequests: { type: 'number' },
        pendingRequests: { type: 'number' },
        approvedRequests: { type: 'number' },
        rejectedRequests: { type: 'number' },
        totalAmount: { type: 'number' },
        urgentRequests: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStatistics(@Request() req: any) {
    return this.cashRequestsService.getStatistics(req.user.staffMemberId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cash request by ID' })
  @ApiResponse({
    status: 200,
    description: 'Cash request retrieved successfully',
    type: CashRequest,
  })
  @ApiResponse({ status: 404, description: 'Cash request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.cashRequestsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cash request' })
  @ApiResponse({
    status: 200,
    description: 'Cash request updated successfully',
    type: CashRequest,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Cash request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateCashRequestDto: UpdateCashRequestDto,
    @Request() req: any,
  ) {
    return this.cashRequestsService.update(
      id,
      updateCashRequestDto,
      req.user.staffMemberId,
    );
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a cash request' })
  @ApiResponse({
    status: 200,
    description: 'Cash request approved successfully',
    type: CashRequest,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Cash request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  approve(
    @Param('id') id: string,
    @Body() approveCashRequestDto: ApproveCashRequestDto,
    @Request() req: any,
  ) {
    return this.cashRequestsService.approve(
      id,
      approveCashRequestDto,
      req.user.staffMemberId,
    );
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a cash request' })
  @ApiResponse({
    status: 200,
    description: 'Cash request rejected successfully',
    type: CashRequest,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Cash request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  reject(
    @Param('id') id: string,
    @Body() rejectCashRequestDto: RejectCashRequestDto,
    @Request() req: any,
  ) {
    return this.cashRequestsService.reject(
      id,
      rejectCashRequestDto,
      req.user.staffMemberId,
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a cash request' })
  @ApiResponse({
    status: 200,
    description: 'Cash request cancelled successfully',
    type: CashRequest,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Cash request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.cashRequestsService.cancel(id, req.user.staffMemberId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a cash request as completed' })
  @ApiResponse({
    status: 200,
    description: 'Cash request marked as completed successfully',
    type: CashRequest,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Cash request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  markAsCompleted(@Param('id') id: string, @Request() req: any) {
    return this.cashRequestsService.markAsCompleted(id, req.user.staffMemberId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cash request' })
  @ApiResponse({
    status: 200,
    description: 'Cash request deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Cash request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.cashRequestsService.remove(id, req.user.staffMemberId);
  }
}
