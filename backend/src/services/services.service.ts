import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  // Service Categories
  async createCategory(createCategoryDto: CreateServiceCategoryDto) {
    const existingCategory = await this.prisma.serviceCategory.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException(
        'Service category with this name already exists',
      );
    }

    return this.prisma.serviceCategory.create({
      data: createCategoryDto,
    });
  }

  async findAllCategories() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            currentPrice: true,
            serviceCode: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        services: {
          where: { isActive: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Service category not found');
    }

    return category;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateServiceCategoryDto,
  ) {
    await this.findCategoryById(id);

    if (updateCategoryDto.name) {
      const existingCategory = await this.prisma.serviceCategory.findFirst({
        where: {
          name: updateCategoryDto.name,
          id: { not: id },
        },
      });

      if (existingCategory) {
        throw new ConflictException(
          'Service category with this name already exists',
        );
      }
    }

    return this.prisma.serviceCategory.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async removeCategory(id: string) {
    await this.findCategoryById(id);

    // Check if category has active services
    const servicesCount = await this.prisma.service.count({
      where: { categoryId: id, isActive: true },
    });

    if (servicesCount > 0) {
      throw new ConflictException(
        'Cannot delete category with active services',
      );
    }

    await this.prisma.serviceCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Service category deactivated successfully' };
  }

  // Services
  async create(createServiceDto: CreateServiceDto) {
    // Check if category exists
    await this.findCategoryById(createServiceDto.categoryId);

    // Check if service with same name in category already exists
    const existingService = await this.prisma.service.findFirst({
      where: {
        name: createServiceDto.name,
        categoryId: createServiceDto.categoryId,
        isActive: true,
      },
    });

    if (existingService) {
      throw new ConflictException(
        'Service with this name already exists in this category',
      );
    }

    const service = await this.prisma.service.create({
      data: {
        ...createServiceDto,
        currentPrice: createServiceDto.basePrice, // Set current price to base price initially
      },
      include: {
        category: true,
      },
    });

    return service;
  }

  async findAll(query?: {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
    requiresPrePayment?: boolean;
  }) {
    const where: any = {};

    if (query?.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query?.requiresPrePayment !== undefined) {
      where.requiresPrePayment = query.requiresPrePayment;
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { serviceCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.service.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async findById(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    await this.findById(id);

    if (updateServiceDto.categoryId) {
      await this.findCategoryById(updateServiceDto.categoryId);
    }

    if (updateServiceDto.name || updateServiceDto.categoryId) {
      const existingService = await this.prisma.service.findFirst({
        where: {
          name: updateServiceDto.name || (await this.findById(id)).name,
          categoryId:
            updateServiceDto.categoryId || (await this.findById(id)).categoryId,
          id: { not: id },
          isActive: true,
        },
      });

      if (existingService) {
        throw new ConflictException(
          'Service with this name already exists in this category',
        );
      }
    }

    const service = await this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
      include: {
        category: true,
      },
    });

    return service;
  }

  async remove(id: string) {
    await this.findById(id);

    // Check if service is being used in any active charges
    const chargesCount = await this.prisma.charge.count({
      where: { serviceId: id, isActive: true },
    });

    if (chargesCount > 0) {
      throw new ConflictException(
        'Cannot delete service that is being used in active charges',
      );
    }

    await this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Service deactivated successfully' };
  }

  async updatePrice(id: string, newPrice: number) {
    const service = await this.findById(id);

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: { currentPrice: newPrice },
      include: {
        category: true,
      },
    });

    return updatedService;
  }

  async getServicesByCategory(categoryId: string) {
    await this.findCategoryById(categoryId);

    return this.prisma.service.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getServicesRequiringPrePayment() {
    return this.prisma.service.findMany({
      where: {
        requiresPrePayment: true,
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });
  }
}
