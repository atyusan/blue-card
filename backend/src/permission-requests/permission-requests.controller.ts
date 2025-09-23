import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PermissionRequestsService } from './permission-requests.service';
import { CreatePermissionRequestDto } from './dto/create-permission-request.dto';
import { UpdatePermissionRequestDto } from './dto/update-permission-request.dto';
import { ApprovePermissionRequestDto } from './dto/approve-permission-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('permission-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionRequestsController {
  constructor(
    private readonly permissionRequestsService: PermissionRequestsService,
  ) {}

  @Post()
  @RequirePermissions(['create_permission_requests'])
  create(
    @Body() createPermissionRequestDto: CreatePermissionRequestDto,
    @Request() req,
  ) {
    return this.permissionRequestsService.create(
      createPermissionRequestDto,
      req.user.id,
    );
  }

  @Get()
  @RequirePermissions(['view_permission_requests'])
  findAll(@Query() filters: any) {
    return this.permissionRequestsService.findAll(filters);
  }

  @Get('stats')
  @RequirePermissions(['view_permission_requests'])
  getStats() {
    return this.permissionRequestsService.getStats();
  }

  @Get(':id')
  @RequirePermissions(['view_permission_requests'])
  findOne(@Param('id') id: string) {
    return this.permissionRequestsService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(['edit_permission_requests'])
  update(
    @Param('id') id: string,
    @Body() updatePermissionRequestDto: UpdatePermissionRequestDto,
  ) {
    return this.permissionRequestsService.update(
      id,
      updatePermissionRequestDto,
    );
  }

  @Post(':id/approve')
  @RequirePermissions(['approve_permission_requests'])
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApprovePermissionRequestDto,
    @Request() req,
  ) {
    return this.permissionRequestsService.approve(id, req.user.id, approveDto);
  }

  @Post(':id/reject')
  @RequirePermissions(['approve_permission_requests'])
  reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    return this.permissionRequestsService.reject(id, req.user.id, body.reason);
  }

  @Post(':id/cancel')
  @RequirePermissions(['cancel_permission_requests'])
  cancel(@Param('id') id: string, @Request() req) {
    return this.permissionRequestsService.cancel(id, req.user.id);
  }

  @Delete(':id')
  @RequirePermissions(['delete_permission_requests'])
  remove(@Param('id') id: string) {
    return this.permissionRequestsService.remove(id);
  }
}
