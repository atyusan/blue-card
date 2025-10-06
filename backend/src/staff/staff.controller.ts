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
import { ParseBoolPipe } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@ApiTags('Staff')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new staff member' })
  @ApiResponse({
    status: 201,
    description: 'Staff member created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Staff member with this employee ID already exists',
  })
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff members' })
  @ApiResponse({
    status: 200,
    description: 'List of all staff members with pagination and counts',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, employee ID, or department',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    description: 'Filter by department ID',
  })
  @ApiQuery({
    name: 'department',
    required: false,
    description: 'Filter by department name',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'specialization',
    required: false,
    description: 'Filter by specialization',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort by field (default: hireDate)',
    example: 'hireDate',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (asc or desc, default: desc)',
    example: 'desc',
  })
  findAll(
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('department') department?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
    @Query('specialization') specialization?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.staffService.findAll({
      search,
      departmentId,
      department,
      isActive,
      specialization,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get staff statistics' })
  @ApiResponse({
    status: 200,
    description: 'Staff statistics including total, active, inactive counts',
  })
  getStats() {
    return this.staffService.getStaffStats();
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get staff member by employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff member found',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.staffService.findByEmployeeId(employeeId);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get staff members by department' })
  @ApiResponse({
    status: 200,
    description: 'List of staff members in the department',
  })
  findByDepartment(@Param('departmentId') departmentId: string) {
    return this.staffService.findByDepartment(departmentId);
  }

  @Get('specialization/:specialization')
  @ApiOperation({ summary: 'Get staff members by specialization' })
  @ApiResponse({
    status: 200,
    description: 'List of staff members with the specialization',
  })
  findBySpecialization(@Param('specialization') specialization: string) {
    return this.staffService.findBySpecialization(specialization);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff member by ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff member updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete staff member by ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff member deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate staff member by ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff member deactivated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  deactivate(@Param('id') id: string) {
    return this.staffService.deactivate(id);
  }

  // Role management endpoints
  @Post(':id/roles')
  @ApiOperation({ summary: 'Assign role to staff member' })
  @ApiResponse({
    status: 201,
    description: 'Role assigned successfully',
  })
  assignRole(
    @Param('id') id: string,
    @Body() body: { roleId: string; scope?: string; scopeId?: string },
  ) {
    return this.staffService.assignRole(
      id,
      body.roleId,
      body.scope,
      body.scopeId,
    );
  }

  @Delete(':id/roles/:roleId')
  @ApiOperation({ summary: 'Remove role from staff member' })
  @ApiResponse({
    status: 200,
    description: 'Role removed successfully',
  })
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.staffService.removeRole(id, roleId);
  }

  @Get(':id/roles')
  @ApiOperation({ summary: 'Get staff member roles' })
  @ApiResponse({
    status: 200,
    description: 'List of staff member roles',
  })
  getStaffRoles(@Param('id') id: string) {
    return this.staffService.getStaffRoles(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get staff member statistics' })
  @ApiResponse({
    status: 200,
    description: 'Staff member statistics',
  })
  getStaffStats(@Param('id') id: string) {
    return this.staffService.getStaffMemberStats(id);
  }

  // ===== SERVICE PROVIDER ENDPOINTS =====

  @Get('service-providers')
  @ApiOperation({ summary: 'Get all service providers' })
  @ApiResponse({
    status: 200,
    description: 'List of all service providers with pagination and filtering',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, employee ID, or department',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    description: 'Filter by department ID',
  })
  @ApiQuery({
    name: 'specialization',
    required: false,
    description: 'Filter by specialization',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (default: 20)',
    example: 20,
  })
  getServiceProviders(
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('specialization') specialization?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.staffService.findServiceProviders({
      search,
      departmentId,
      specialization,
      isActive,
      page,
      limit,
    });
  }

  @Get('service-providers/stats')
  @ApiOperation({ summary: 'Get service provider statistics' })
  @ApiResponse({
    status: 200,
    description:
      'Service provider statistics including counts by department and specialization',
  })
  getServiceProviderStats() {
    return this.staffService.getServiceProviderStats();
  }

  @Get('service-providers/department/:departmentId')
  @ApiOperation({ summary: 'Get service providers by department' })
  @ApiResponse({
    status: 200,
    description: 'List of service providers in the specified department',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  getServiceProvidersByDepartment(@Param('departmentId') departmentId: string) {
    return this.staffService.findServiceProvidersByDepartment(departmentId);
  }

  @Get('service-providers/specialization/:specialization')
  @ApiOperation({ summary: 'Get service providers by specialization' })
  @ApiResponse({
    status: 200,
    description: 'List of service providers with the specified specialization',
  })
  getServiceProvidersBySpecialization(
    @Param('specialization') specialization: string,
  ) {
    return this.staffService.findServiceProvidersBySpecialization(
      specialization,
    );
  }

  @Patch(':id/service-provider-status')
  @ApiOperation({ summary: 'Update service provider status' })
  @ApiResponse({
    status: 200,
    description: 'Service provider status updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  updateServiceProviderStatus(
    @Param('id') id: string,
    @Body() body: { serviceProvider: boolean },
  ) {
    return this.staffService.updateServiceProviderStatus(
      id,
      body.serviceProvider,
    );
  }

  // This route must be LAST to avoid conflicts with specific routes above
  @Get(':id')
  @ApiOperation({ summary: 'Get staff member by ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff member found',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  findOne(@Param('id') id: string) {
    return this.staffService.findById(id);
  }
}
