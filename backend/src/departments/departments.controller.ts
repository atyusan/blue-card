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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsQueryDto } from './dto/departments-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({
    status: 201,
    description: 'Department created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Department with this name or code already exists',
  })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({
    status: 200,
    description: 'List of departments retrieved successfully',
  })
  findAll(@Query() query: DepartmentsQueryDto) {
    return this.departmentsService.findAll(query);
  }

  @Get('stats/:id')
  @ApiOperation({ summary: 'Get department statistics' })
  @ApiResponse({
    status: 200,
    description: 'Department statistics retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  getStats(@Param('id') id: string) {
    return this.departmentsService.getDepartmentStats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiResponse({
    status: 200,
    description: 'Department retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get department by code' })
  @ApiResponse({
    status: 200,
    description: 'Department retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  findByCode(@Param('code') code: string) {
    return this.departmentsService.findByCode(code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update department' })
  @ApiResponse({
    status: 200,
    description: 'Department updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Department with this name or code already exists',
  })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete department' })
  @ApiResponse({
    status: 200,
    description: 'Department deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete department with associated staff or services',
  })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
