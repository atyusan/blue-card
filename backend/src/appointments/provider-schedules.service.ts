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
        breakStart: data.breakStart || null,
        breakEnd: data.breakEnd || null,
        isAvailable: data.isAvailable ?? true,
        maxAppointments: data.maxAppointments ?? 20,
        slotDuration: data.slotDuration ?? 30,
        bufferTime: data.bufferTime ?? 5,
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
      isAvailable,
    } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (providerId) where.providerId = providerId;
    if (dayOfWeek !== undefined) where.dayOfWeek = dayOfWeek;
    if (isAvailable !== undefined) where.isAvailable = isAvailable;

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
        ...(data.breakStart !== undefined && { breakStart: data.breakStart }),
        ...(data.breakEnd !== undefined && { breakEnd: data.breakEnd }),
        ...(data.isAvailable !== undefined && {
          isAvailable: data.isAvailable,
        }),
        ...(data.maxAppointments !== undefined && {
          maxAppointments: data.maxAppointments,
        }),
        ...(data.slotDuration !== undefined && {
          slotDuration: data.slotDuration,
        }),
        ...(data.bufferTime !== undefined && { bufferTime: data.bufferTime }),
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
      breakStart: s.breakStart || undefined,
      breakEnd: s.breakEnd || undefined,
      isAvailable: s.isAvailable,
      maxAppointments: s.maxAppointments,
      slotDuration: s.slotDuration,
      bufferTime: s.bufferTime,
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
