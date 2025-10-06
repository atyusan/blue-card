import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProviderScheduleResponse } from './interfaces/appointment.interface';

@Injectable()
export class ProviderSchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<ProviderScheduleResponse> {
    const schedule = await this.prisma.providerSchedule.create({
      data: {
        providerId: data.providerId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStartTime: data.breakStartTime || null,
        breakEndTime: data.breakEndTime || null,
        isWorking: data.isWorking ?? true,
        maxAppointmentsPerHour: data.maxAppointmentsPerHour ?? 2,
        notes: data.notes || null,
      },
      include: {
        provider: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    return this.mapToResponse(schedule);
  }

  async findAll(query: any): Promise<{
    schedules: ProviderScheduleResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 50,
      providerId,
      dayOfWeek,
      isWorking,
    } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (providerId) where.providerId = providerId;
    if (dayOfWeek !== undefined) where.dayOfWeek = dayOfWeek;
    if (isWorking !== undefined) where.isWorking = isWorking;

    const total = await this.prisma.providerSchedule.count({ where });
    const schedules = await this.prisma.providerSchedule.findMany({
      where,
      skip,
      take: limit,
      include: {
        provider: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: [{ providerId: 'asc' }, { dayOfWeek: 'asc' }],
    });

    return {
      schedules: schedules.map((s) => this.mapToResponse(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProviderScheduleResponse> {
    const schedule = await this.prisma.providerSchedule.findUnique({
      where: { id },
      include: {
        provider: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!schedule) throw new NotFoundException('Provider schedule not found');
    return this.mapToResponse(schedule);
  }

  async update(id: string, data: any): Promise<ProviderScheduleResponse> {
    await this.findOne(id);

    const schedule = await this.prisma.providerSchedule.update({
      where: { id },
      data: {
        ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.breakStartTime !== undefined && {
          breakStartTime: data.breakStartTime,
        }),
        ...(data.breakEndTime !== undefined && {
          breakEndTime: data.breakEndTime,
        }),
        ...(data.isWorking !== undefined && {
          isWorking: data.isWorking,
        }),
        ...(data.maxAppointmentsPerHour !== undefined && {
          maxAppointmentsPerHour: data.maxAppointmentsPerHour,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        provider: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    return this.mapToResponse(schedule);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.providerSchedule.delete({ where: { id } });
  }

  private mapToResponse(s: any): ProviderScheduleResponse {
    return {
      id: s.id,
      providerId: s.providerId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      breakStartTime: s.breakStartTime || undefined,
      breakEndTime: s.breakEndTime || undefined,
      isWorking: s.isWorking,
      maxAppointmentsPerHour: s.maxAppointmentsPerHour,
      notes: s.notes || undefined,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      provider: {
        id: s.providerId,
        firstName: s.provider.user.firstName,
        lastName: s.provider.user.lastName,
        specialization: s.provider.specialization || undefined,
        department: s.provider.department,
      },
    };
  }
}
