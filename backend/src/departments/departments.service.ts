import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    // Check if department with same name or code already exists
    const existingDepartment = await this.prisma.department.findFirst({
      where: {
        OR: [
          { name: createDepartmentDto.name },
          { code: createDepartmentDto.code },
        ],
      },
    });

    if (existingDepartment) {
      throw new ConflictException(
        'Department with this name or code already exists',
      );
    }

    const department = await this.prisma.department.create({
      data: createDepartmentDto,
    });

    return department;
  }

  async findAll(query?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.department.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        staffMembers: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        services: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async findByCode(code: string) {
    const department = await this.prisma.department.findUnique({
      where: { code },
    });

    if (!department) {
      throw new NotFoundException(`Department with code ${code} not found`);
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    // Check if department exists
    const existingDepartment = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Check if name or code conflicts with other departments
    if (updateDepartmentDto.name || updateDepartmentDto.code) {
      const conflictingDepartment = await this.prisma.department.findFirst({
        where: {
          OR: [
            ...(updateDepartmentDto.name
              ? [{ name: updateDepartmentDto.name }]
              : []),
            ...(updateDepartmentDto.code
              ? [{ code: updateDepartmentDto.code }]
              : []),
          ],
          NOT: { id },
        },
      });

      if (conflictingDepartment) {
        throw new ConflictException(
          'Department with this name or code already exists',
        );
      }
    }

    const updatedDepartment = await this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
    });

    return updatedDepartment;
  }

  async remove(id: string) {
    // Check if department exists
    const existingDepartment = await this.prisma.department.findUnique({
      where: { id },
      include: {
        staffMembers: { select: { id: true } },
        services: { select: { id: true } },
      },
    });

    if (!existingDepartment) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Check if department has associated staff members or services
    if (existingDepartment.staffMembers.length > 0) {
      throw new ConflictException(
        'Cannot delete department with associated staff members',
      );
    }

    if (existingDepartment.services.length > 0) {
      throw new ConflictException(
        'Cannot delete department with associated services',
      );
    }

    await this.prisma.department.delete({
      where: { id },
    });

    return { message: 'Department deleted successfully' };
  }

  async getDepartmentStats(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            staffMembers: true,
            services: true,
          },
        },
        staffMembers: {
          include: {
            _count: {
              select: {
                consultations: true,
                appointments: true,
              },
            },
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    const totalConsultations = department.staffMembers.reduce(
      (sum, staff) => sum + staff._count.consultations,
      0,
    );

    const totalAppointments = department.staffMembers.reduce(
      (sum, staff) => sum + staff._count.appointments,
      0,
    );

    return {
      id: department.id,
      name: department.name,
      code: department.code,
      staffCount: department._count.staffMembers,
      serviceCount: department._count.services,
      totalConsultations,
      totalAppointments,
    };
  }
}
