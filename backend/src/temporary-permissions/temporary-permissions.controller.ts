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
} from '@nestjs/common';
import { TemporaryPermissionsService } from './temporary-permissions.service';
import { CreateTemporaryPermissionDto } from './dto/create-temporary-permission.dto';
import { UpdateTemporaryPermissionDto } from './dto/update-temporary-permission.dto';
import { ExtendTemporaryPermissionDto } from './dto/extend-temporary-permission.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('temporary-permissions')
@UseGuards(PermissionsGuard)
export class TemporaryPermissionsController {
  constructor(
    private readonly temporaryPermissionsService: TemporaryPermissionsService,
  ) {}

  @Post()
  @RequirePermissions(['grant_temporary_permissions'])
  create(@Body() createDto: CreateTemporaryPermissionDto, @Request() req: any) {
    const staffMemberId = req.user.staffMemberId;
    if (!staffMemberId) {
      throw new Error('Staff member ID not found in request');
    }
    return this.temporaryPermissionsService.createTemporaryPermission(
      createDto,
      staffMemberId,
    );
  }

  @Get()
  @RequirePermissions(['view_temporary_permissions'])
  findAll(
    @Query('userId') userId?: string,
    @Query('permission') permission?: string,
    @Query('isActive') isActive?: string,
    @Query('grantedBy') grantedBy?: string,
  ) {
    const filters: any = {};

    if (userId) filters.userId = userId;
    if (permission) filters.permission = permission;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (grantedBy) filters.grantedBy = grantedBy;

    return this.temporaryPermissionsService.findAllTemporaryPermissions(
      filters,
    );
  }

  @Get('user/:userId')
  @RequirePermissions(['view_temporary_permissions'])
  findByUser(@Param('userId') userId: string) {
    return this.temporaryPermissionsService.findActiveTemporaryPermissionsByUser(
      userId,
    );
  }

  @Get(':id')
  @RequirePermissions(['view_temporary_permissions'])
  findOne(@Param('id') id: string) {
    return this.temporaryPermissionsService.findTemporaryPermissionById(id);
  }

  @Patch(':id')
  @RequirePermissions(['manage_temporary_permissions'])
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemporaryPermissionDto,
    @Request() req: any,
  ) {
    const staffMemberId = req.user.staffMemberId;
    if (!staffMemberId) {
      throw new Error('Staff member ID not found in request');
    }
    return this.temporaryPermissionsService.updateTemporaryPermission(
      id,
      updateDto,
      staffMemberId,
    );
  }

  @Patch(':id/extend')
  @RequirePermissions(['manage_temporary_permissions'])
  extend(
    @Param('id') id: string,
    @Body() extendDto: ExtendTemporaryPermissionDto,
    @Request() req: any,
  ) {
    const staffMemberId = req.user.staffMemberId;
    if (!staffMemberId) {
      throw new Error('Staff member ID not found in request');
    }
    return this.temporaryPermissionsService.extendTemporaryPermission(
      id,
      extendDto,
      staffMemberId,
    );
  }

  @Patch(':id/revoke')
  @RequirePermissions(['manage_temporary_permissions'])
  revoke(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    const staffMemberId = req.user.staffMemberId;
    if (!staffMemberId) {
      throw new Error('Staff member ID not found in request');
    }
    return this.temporaryPermissionsService.revokeTemporaryPermission(
      id,
      reason,
      staffMemberId,
    );
  }

  @Delete(':id')
  @RequirePermissions(['manage_temporary_permissions'])
  remove(@Param('id') id: string, @Request() req: any) {
    const staffMemberId = req.user.staffMemberId;
    if (!staffMemberId) {
      throw new Error('Staff member ID not found in request');
    }
    return this.temporaryPermissionsService.deleteTemporaryPermission(
      id,
      staffMemberId,
    );
  }

  @Post('cleanup')
  @RequirePermissions(['manage_temporary_permissions'])
  cleanupExpired() {
    return this.temporaryPermissionsService.cleanupExpiredPermissions();
  }
}

