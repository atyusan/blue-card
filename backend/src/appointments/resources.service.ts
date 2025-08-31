import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ResourceScheduleResponse } from './interfaces/appointment.interface';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  // Resources
  async createResource(data: any) {
    return await this.prisma.resource.create({ data });
  }

  async findAllResources(query: any) {
    const {
      page = 1,
      limit = 50,
      type,
      location,
      isActive,
      capacity,
    } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (isActive !== undefined) where.isActive = isActive;
    if (capacity) where.capacity = { gte: parseInt(capacity) };

    const total = await this.prisma.resource.count({ where });
    const resources = await this.prisma.resource.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      resources,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneResource(id: string) {
    return await this.prisma.resource.findUnique({ where: { id } });
  }

  async updateResource(id: string, data: any) {
    return await this.prisma.resource.update({ where: { id }, data });
  }

  async removeResource(id: string) {
    return await this.prisma.resource.delete({ where: { id } });
  }

  // Resource schedules
  async createResourceSchedule(data: any): Promise<ResourceScheduleResponse> {
    const schedule = await this.prisma.resourceSchedule.create({
      data,
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
            location: true,
            capacity: true,
          },
        },
      },
    });

    return this.mapSchedule(schedule);
  }

  async findAllResourceSchedules(query: any): Promise<{
    schedules: ResourceScheduleResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 50,
      resourceId,
      dayOfWeek,
      isAvailable,
    } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (resourceId) where.resourceId = resourceId;
    if (dayOfWeek !== undefined) where.dayOfWeek = dayOfWeek;
    if (isAvailable !== undefined) where.isAvailable = isAvailable;

    const total = await this.prisma.resourceSchedule.count({ where });
    const schedules = await this.prisma.resourceSchedule.findMany({
      where,
      skip,
      take: limit,
      include: { resource: true },
      orderBy: [{ resourceId: 'asc' }, { dayOfWeek: 'asc' }],
    });

    return {
      schedules: schedules.map((s) => this.mapSchedule(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneResourceSchedule(id: string): Promise<ResourceScheduleResponse> {
    const sched = await this.prisma.resourceSchedule.findUnique({
      where: { id },
      include: { resource: true },
    });
    if (!sched) throw new NotFoundException('Resource schedule not found');
    return this.mapSchedule(sched);
  }

  async updateResourceSchedule(
    id: string,
    data: any,
  ): Promise<ResourceScheduleResponse> {
    await this.findOneResourceSchedule(id);
    const sched = await this.prisma.resourceSchedule.update({
      where: { id },
      data: {
        ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.isAvailable !== undefined && {
          isAvailable: data.isAvailable,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: { resource: true },
    });

    return this.mapSchedule(sched);
  }

  async removeResourceSchedule(id: string) {
    await this.findOneResourceSchedule(id);
    await this.prisma.resourceSchedule.delete({ where: { id } });
  }

  private mapSchedule(s: any): ResourceScheduleResponse {
    return {
      id: s.id,
      resourceId: s.resourceId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      isAvailable: s.isAvailable,
      notes: s.notes || undefined,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      resource: {
        id: s.resource.id,
        name: s.resource.name,
        type: s.resource.type,
        location: s.resource.location || undefined,
        capacity: s.resource.capacity,
      },
    };
  }
}
