import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        // role field removed - now handled through StaffRoleAssignment
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findAll(query?: {
    // role parameter removed - now handled through StaffRoleAssignment
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50, ...filters } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role filtering removed - now handled through StaffRoleAssignment
    // if (filters?.role) {
    //   where.role = filters.role;
    // }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      const term = filters.search;
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { username: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.user.count({ where });

    // Get users with pagination
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        // role field removed - now handled through StaffRoleAssignment
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip,
      take: limit,
    });

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        firstName: true,
        lastName: true,
        // role field removed - now handled through StaffRoleAssignment
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        firstName: true,
        lastName: true,
        // role field removed - now handled through StaffRoleAssignment
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        // role field removed - now handled through StaffRoleAssignment
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findByUsernameOrEmail(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        firstName: true,
        lastName: true,
        // role field removed - now handled through StaffRoleAssignment
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...updateData } = updateUserDto;

    // Check if user exists
    await this.findById(id);

    const updatePayload: any = { ...updateData };

    // Hash password if provided
    if (password) {
      updatePayload.password = await bcrypt.hash(password, 12);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        // role field removed - now handled through StaffRoleAssignment
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async remove(id: string) {
    // Check if user exists
    await this.findById(id);

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  async deactivate(id: string) {
    // Check if user exists
    await this.findById(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        // role field removed - now handled through StaffRoleAssignment
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
