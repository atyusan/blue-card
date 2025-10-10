import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all permissions grouped by category' })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
  })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all permission categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async getCategories() {
    return this.permissionsService.getCategories();
  }

  @Get('modules')
  @ApiOperation({ summary: 'Get all permission modules' })
  @ApiResponse({
    status: 200,
    description: 'Modules retrieved successfully',
  })
  async getModules() {
    return this.permissionsService.getModules();
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get permissions by category' })
  @ApiQuery({ name: 'category', required: true })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
  })
  async findByCategory(@Query('category') category: string) {
    return this.permissionsService.findByCategory(category);
  }

  @Get('by-module')
  @ApiOperation({ summary: 'Get permissions by module' })
  @ApiQuery({ name: 'module', required: true })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
  })
  async findByModule(@Query('module') module: string) {
    return this.permissionsService.findByModule(module);
  }
}
