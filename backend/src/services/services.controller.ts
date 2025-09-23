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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { UpdateServicePriceDto } from './dto/update-service-price.dto';

@ApiTags('Services')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // Service Categories
  @Post('categories')
  @ApiOperation({ summary: 'Create a new service category' })
  @ApiResponse({
    status: 201,
    description: 'Service category created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Service category with this name already exists',
  })
  createCategory(@Body() createCategoryDto: CreateServiceCategoryDto) {
    return this.servicesService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all service categories' })
  @ApiResponse({
    status: 200,
    description: 'List of all service categories with services',
  })
  findAllCategories() {
    return this.servicesService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get service category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service category found',
  })
  @ApiResponse({
    status: 404,
    description: 'Service category not found',
  })
  findCategoryById(@Param('id') id: string) {
    return this.servicesService.findCategoryById(id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update service category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service category updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Service category not found',
  })
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateServiceCategoryDto,
  ) {
    return this.servicesService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Deactivate service category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service category deactivated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Service category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete category with active services',
  })
  removeCategory(@Param('id') id: string) {
    return this.servicesService.removeCategory(id);
  }

  // Services
  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Service with this name already exists in this category',
  })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({
    status: 200,
    description: 'List of all services',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by service category',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, description, or service code',
  })
  @ApiQuery({
    name: 'requiresPrePayment',
    required: false,
    description: 'Filter by pre-payment requirement',
  })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
    @Query('search') search?: string,
    @Query('requiresPrePayment', new ParseBoolPipe({ optional: true }))
    requiresPrePayment?: boolean,
  ) {
    return this.servicesService.findAll({
      categoryId,
      isActive,
      search,
      requiresPrePayment,
    });
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get services by department' })
  @ApiResponse({
    status: 200,
    description: 'List of services in the department',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  findByDepartment(@Param('departmentId') departmentId: string) {
    return this.servicesService.findByDepartment(departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service found',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  findOne(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate service by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service deactivated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete service that is being used in active charges',
  })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }

  @Patch(':id/price')
  @ApiOperation({ summary: 'Update service price' })
  @ApiResponse({
    status: 200,
    description: 'Service price updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  updatePrice(@Param('id') id: string, @Body() body: UpdateServicePriceDto) {
    return this.servicesService.updatePrice(id, body.price);
  }

  @Get('categories/:categoryId/services')
  @ApiOperation({ summary: 'Get services by category' })
  @ApiResponse({
    status: 200,
    description: 'List of services in the category',
  })
  @ApiResponse({
    status: 404,
    description: 'Service category not found',
  })
  getServicesByCategory(@Param('categoryId') categoryId: string) {
    return this.servicesService.getServicesByCategory(categoryId);
  }

  @Get('pre-payment-required')
  @ApiOperation({ summary: 'Get services requiring pre-payment' })
  @ApiResponse({
    status: 200,
    description: 'List of services requiring pre-payment',
  })
  getServicesRequiringPrePayment() {
    return this.servicesService.getServicesRequiringPrePayment();
  }
}
