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
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { CreateTreatmentLinkDto } from './dto/create-treatment-link.dto';
import { UpdateTreatmentLinkDto } from './dto/update-treatment-link.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import {
  TreatmentResponse,
  TreatmentSummaryResponse,
  TreatmentLinkResponse,
} from './interfaces/treatment.interface';
import { TreatmentStatus, ProviderRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Treatments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('treatments')
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  @Post()
  @RequirePermissions(['create_treatments'])
  @ApiOperation({ summary: 'Create a new treatment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Treatment created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Patient or appointment not found',
  })
  async create(
    @Body() createTreatmentDto: CreateTreatmentDto,
    @Request() req: any,
  ): Promise<TreatmentResponse> {
    return this.treatmentsService.create(createTreatmentDto, req.user.id);
  }

  @Get()
  @RequirePermissions(['view_treatments'])
  @ApiOperation({ summary: 'Get all treatments with optional filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    type: String,
    description: 'Filter by patient ID',
  })
  @ApiQuery({
    name: 'providerId',
    required: false,
    type: String,
    description: 'Filter by provider ID',
  })
  @ApiQuery({
    name: 'appointmentId',
    required: false,
    type: String,
    description: 'Filter by appointment ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TreatmentStatus,
    description: 'Filter by treatment status',
  })
  @ApiQuery({
    name: 'treatmentType',
    required: false,
    type: String,
    description: 'Filter by treatment type',
  })
  @ApiQuery({
    name: 'isEmergency',
    required: false,
    type: Boolean,
    description: 'Filter by emergency status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Treatments retrieved successfully',
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('patientId') patientId?: string,
    @Query('providerId') providerId?: string,
    @Query('appointmentId') appointmentId?: string,
    @Query('status') status?: TreatmentStatus,
    @Query('treatmentType') treatmentType?: string,
    @Query('isEmergency') isEmergency?: boolean,
  ): Promise<{
    treatments: TreatmentResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.treatmentsService.findAll(
      page,
      limit,
      patientId,
      providerId,
      appointmentId,
      status,
      treatmentType as any,
      isEmergency,
    );
  }

  @Get('transferred-to-me')
  @RequirePermissions(['view_treatments'])
  @ApiOperation({ summary: 'Get treatments transferred to current provider' })
  @ApiQuery({
    name: 'acknowledged',
    required: false,
    type: Boolean,
    description: 'Filter by acknowledgment status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transferred treatments retrieved successfully',
  })
  async getTransferredTreatments(
    @Request() req: any,
    @Query('acknowledged') acknowledged?: boolean,
  ): Promise<{
    treatments: TreatmentResponse[];
    total: number;
    unacknowledged: number;
  }> {
    return this.treatmentsService.getTransferredTreatments(
      req.user.staffMemberId,
      acknowledged,
    );
  }

  @Post(':id/acknowledge-transfer')
  @RequirePermissions(['view_treatments'])
  @ApiOperation({ summary: 'Acknowledge treatment transfer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transfer acknowledged successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Treatment not found',
  })
  async acknowledgeTransfer(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    if (!req.user.staffMemberId) {
      throw new BadRequestException('User is not a staff member');
    }
    return this.treatmentsService.acknowledgeTransfer(
      id,
      req.user.staffMemberId,
    );
  }

  @Post(':id/transfer')
  @RequirePermissions(['update_treatments'])
  @ApiOperation({ summary: 'Transfer treatment to another provider' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Treatment transferred successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Treatment or new provider not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid transfer request',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async transferTreatment(
    @Param('id') id: string,
    @Body()
    transferDto: { newProviderId: string; reason: string; notes?: string },
    @Request() req: any,
  ): Promise<TreatmentResponse> {
    return await this.treatmentsService.transferTreatment(
      id,
      transferDto.newProviderId,
      transferDto.reason,
      transferDto.notes,
      req.user.id,
    );
  }

  @Get(':id')
  @RequirePermissions(['view_treatments'])
  @ApiOperation({ summary: 'Get treatment by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Treatment retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Treatment not found',
  })
  async findOne(@Param('id') id: string): Promise<TreatmentResponse> {
    return this.treatmentsService.findOne(id);
  }

  @Patch(':id/status')
  @RequirePermissions(['update_treatment_status'])
  @ApiOperation({ summary: 'Update treatment status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Treatment status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Treatment not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async updateStatus(
    @Param('id') treatmentId: string,
    @Body('status') status: TreatmentStatus,
    @Request() req: any,
  ): Promise<TreatmentResponse> {
    return this.treatmentsService.updateTreatmentStatus(
      treatmentId,
      status,
      req.user.id,
    );
  }

  @Patch(':id')
  @RequirePermissions(['update_treatments'])
  @ApiOperation({ summary: 'Update treatment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Treatment updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Treatment not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTreatmentDto: UpdateTreatmentDto,
    @Request() req: any,
  ): Promise<TreatmentResponse> {
    return this.treatmentsService.update(id, updateTreatmentDto, req.user.id);
  }

  @Delete(':id')
  @RequirePermissions(['delete_treatments'])
  @ApiOperation({ summary: 'Delete treatment' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Treatment deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Treatment not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.treatmentsService.remove(id, req.user.id);
  }

  @Get('patient/:patientId/history')
  @RequirePermissions(['view_treatments'])
  @ApiOperation({ summary: 'Get treatment history for a patient' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Treatment history retrieved successfully',
  })
  async getTreatmentHistory(
    @Param('patientId') patientId: string,
  ): Promise<TreatmentSummaryResponse[]> {
    return this.treatmentsService.getTreatmentHistory(patientId);
  }

  @Post(':id/providers')
  @RequirePermissions(['manage_treatment_providers'])
  @ApiOperation({ summary: 'Add provider to treatment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Provider added successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Treatment not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid provider data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async addProvider(
    @Param('id') treatmentId: string,
    @Body('providerId') providerId: string,
    @Body('role') role: ProviderRole,
    @Request() req: any,
  ): Promise<void> {
    return this.treatmentsService.addProviderToTreatment(
      treatmentId,
      providerId,
      role,
      req.user.id,
    );
  }

  @Delete(':id/providers/:providerId')
  @RequirePermissions(['manage_treatment_providers'])
  @ApiOperation({ summary: 'Remove provider from treatment' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Provider removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Treatment or provider not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot remove primary provider',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async removeProvider(
    @Param('id') treatmentId: string,
    @Param('providerId') providerId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.treatmentsService.removeProviderFromTreatment(
      treatmentId,
      providerId,
      req.user.id,
    );
  }

  @Post('links')
  @RequirePermissions(['manage_treatment_links'])
  @ApiOperation({ summary: 'Create a treatment link' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Treatment link created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid link data or self-linking',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Source or target treatment not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async createTreatmentLink(
    @Body() createLinkDto: CreateTreatmentLinkDto,
    @Request() req: any,
  ): Promise<TreatmentLinkResponse> {
    return this.treatmentsService.createTreatmentLink(
      createLinkDto,
      req.user.id,
    );
  }

  @Get(':id/links')
  @RequirePermissions(['view_treatments'])
  @ApiOperation({ summary: 'Get treatment links' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Treatment links retrieved successfully',
  })
  async getTreatmentLinks(@Param('id') treatmentId: string): Promise<{
    linkedFrom: TreatmentLinkResponse[];
    linkedTo: TreatmentLinkResponse[];
  }> {
    return this.treatmentsService.getTreatmentLinks(treatmentId);
  }

  @Get(':id/chain')
  @RequirePermissions(['view_treatments'])
  @ApiOperation({ summary: 'Get treatment chain' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Treatment chain retrieved successfully',
  })
  async getTreatmentChain(@Param('id') treatmentId: string): Promise<{
    chain: TreatmentLinkResponse[];
    allTreatments: TreatmentSummaryResponse[];
  }> {
    return this.treatmentsService.getTreatmentChain(treatmentId);
  }

  @Patch('links/:linkId')
  @RequirePermissions(['manage_treatment_links'])
  @ApiOperation({ summary: 'Update treatment link' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Treatment link updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Treatment link not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async updateTreatmentLink(
    @Param('linkId') linkId: string,
    @Body() updateLinkDto: UpdateTreatmentLinkDto,
    @Request() req: any,
  ): Promise<TreatmentLinkResponse> {
    return this.treatmentsService.updateTreatmentLink(
      linkId,
      updateLinkDto,
      req.user.id,
    );
  }

  @Delete('links/:linkId')
  @RequirePermissions(['manage_treatment_links'])
  @ApiOperation({ summary: 'Delete treatment link' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Treatment link deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Treatment link not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async deleteTreatmentLink(
    @Param('linkId') linkId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.treatmentsService.deleteTreatmentLink(linkId, req.user.id);
  }
}
