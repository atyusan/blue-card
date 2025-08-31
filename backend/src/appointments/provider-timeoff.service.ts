import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TimeOffResponse } from './interfaces/appointment.interface';

@Injectable()
export class ProviderTimeOffService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<TimeOffResponse> {
    const timeoff = await this.prisma.providerTimeOff.create({
      data: {
        providerId: data.providerId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        type: data.type,
        status: data.status || 'PENDING',
        approvedBy: data.approvedBy || null,
        approvedAt: data.approvedAt ? new Date(data.approvedAt) : null,
        notes: data.notes || null,
      },
      include: {
        provider: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        approver: true,
      },
    });

    return this.mapToResponse(timeoff);
  }

  async findAll(query: any): Promise<{
    entries: TimeOffResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, providerId, status, type } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (providerId) where.providerId = providerId;
    if (status) where.status = status;
    if (type) where.type = type;

    const total = await this.prisma.providerTimeOff.count({ where });
    const entries = await this.prisma.providerTimeOff.findMany({
      where,
      skip,
      take: limit,
      include: {
        provider: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        approver: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return {
      entries: entries.map((e) => this.mapToResponse(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<TimeOffResponse> {
    const entry = await this.prisma.providerTimeOff.findUnique({
      where: { id },
      include: {
        provider: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        approver: true,
      },
    });

    if (!entry) throw new NotFoundException('Provider time off not found');
    return this.mapToResponse(entry);
  }

  async update(id: string, data: any): Promise<TimeOffResponse> {
    await this.findOne(id);

    const updateData: any = {};
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;
    if (data.approvedAt !== undefined)
      updateData.approvedAt = new Date(data.approvedAt);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const entry = await this.prisma.providerTimeOff.update({
      where: { id },
      data: updateData,
      include: {
        provider: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        approver: true,
      },
    });

    return this.mapToResponse(entry);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.providerTimeOff.delete({ where: { id } });
  }

  private mapToResponse(e: any): TimeOffResponse {
    return {
      id: e.id,
      providerId: e.providerId,
      startDate: e.startDate,
      endDate: e.endDate,
      reason: e.reason,
      type: e.type,
      status: e.status,
      approvedBy: e.approvedBy || undefined,
      approvedAt: e.approvedAt || undefined,
      notes: e.notes || undefined,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      provider: {
        id: e.providerId,
        firstName: e.provider?.user?.firstName || '',
        lastName: e.provider?.user?.lastName || '',
        specialization: e.provider?.specialization || undefined,
        department: e.provider?.department || '',
      },
      approver: e.approver
        ? {
            id: e.approver.id,
            firstName: e.approver.user?.firstName || '',
            lastName: e.approver.user?.lastName || '',
          }
        : undefined,
    };
  }
}
