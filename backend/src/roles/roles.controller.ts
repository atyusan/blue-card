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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Role with this name or code already exists',
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'List of roles retrieved successfully',
  })
  findAll(@Query() query: { isActive?: boolean; search?: string }) {
    return this.rolesService.findAll(query);
  }

  @Get('stats/:id')
  @ApiOperation({ summary: 'Get role statistics' })
  @ApiResponse({
    status: 200,
    description: 'Role statistics retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  getStats(@Param('id') id: string) {
    return this.rolesService.getRoleStats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get role by code' })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  findByCode(@Param('code') code: string) {
    return this.rolesService.findByCode(code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Role with this name or code already exists',
  })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({
    status: 200,
    description: 'Role deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete role with associated staff members',
  })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  // Role Assignment Endpoints
  @Post('staff/:staffId/assign')
  @ApiOperation({ summary: 'Assign role to staff member' })
  @ApiResponse({
    status: 201,
    description: 'Role assigned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member or role not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Role is already assigned to this staff member',
  })
  assignRole(
    @Param('staffId') staffId: string,
    @Body() assignRoleDto: AssignRoleDto,
    @Request() req: any,
  ) {
    const assignedBy = req.user.staffMemberId;
    const { scope, scopeId, conditions, expiresAt } = assignRoleDto;

    // Convert expiresAt string to Date if provided
    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;

    return this.rolesService.assignRoleToStaff(
      staffId,
      assignRoleDto,
      assignedBy,
      scope,
      scopeId,
      conditions,
      expiresAtDate,
    );
  }

  @Delete('staff/:staffId/roles/:roleId')
  @ApiOperation({ summary: 'Remove role from staff member' })
  @ApiResponse({
    status: 200,
    description: 'Role removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role assignment not found',
  })
  removeRoleFromStaff(
    @Param('staffId') staffId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.removeRoleFromStaff(staffId, roleId);
  }

  @Get('staff/:staffId')
  @ApiOperation({ summary: 'Get all roles assigned to a staff member' })
  @ApiResponse({
    status: 200,
    description: 'Staff roles retrieved successfully',
  })
  getStaffRoles(@Param('staffId') staffId: string) {
    return this.rolesService.getStaffRoles(staffId);
  }
}
