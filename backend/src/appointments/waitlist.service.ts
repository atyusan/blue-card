import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WaitlistEntryResponse } from './interfaces/appointment.interface';

@Injectable()
export class WaitlistService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<WaitlistEntryResponse> {
    const {
      appointmentId,
      patientId,
      requestedDate,
      preferredTimeSlots = [],
      priority = 'NORMAL',
      notes,
    } = data;

    const entry = await this.prisma.waitlistEntry.create({
      data: {
        appointmentId,
        patientId,
        requestedDate: new Date(requestedDate),
        preferredTimeSlots,
        priority,
        status: 'ACTIVE',
        notes: notes || undefined,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientId: true,
            phoneNumber: true,
            email: true,
          },
        },
        appointment: true,
      },
    });

    return this.mapToResponse(entry);
  }

  async findAll(query: any): Promise<{
    entries: WaitlistEntryResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      patientId,
      status,
      requestedDate,
    } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (requestedDate) where.requestedDate = new Date(requestedDate);

    const total = await this.prisma.waitlistEntry.count({ where });
    const entries = await this.prisma.waitlistEntry.findMany({
      where,
      skip,
      take: limit,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientId: true,
            phoneNumber: true,
            email: true,
          },
        },
        appointment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      entries: entries.map((e) => this.mapToResponse(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<WaitlistEntryResponse> {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientId: true,
            phoneNumber: true,
            email: true,
          },
        },
        appointment: true,
      },
    });

    if (!entry) throw new NotFoundException('Waitlist entry not found');
    return this.mapToResponse(entry);
  }

  async update(id: string, data: any): Promise<WaitlistEntryResponse> {
    await this.findOne(id);

    const updateData: any = {};
    if (data.requestedDate)
      updateData.requestedDate = new Date(data.requestedDate);
    if (data.preferredTimeSlots)
      updateData.preferredTimeSlots = data.preferredTimeSlots;
    if (data.priority) updateData.priority = data.priority;
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const entry = await this.prisma.waitlistEntry.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientId: true,
            phoneNumber: true,
            email: true,
          },
        },
        appointment: true,
      },
    });

    return this.mapToResponse(entry);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.waitlistEntry.delete({ where: { id } });
  }

  private mapToResponse(e: any): WaitlistEntryResponse {
    return {
      id: e.id,
      appointmentId: e.appointmentId,
      patientId: e.patientId,
      requestedDate: e.requestedDate,
      preferredTimeSlots: e.preferredTimeSlots,
      priority: e.priority,
      status: e.status,
      notes: e.notes || undefined,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      patient: {
        id: e.patient.id,
        firstName: e.patient.firstName,
        lastName: e.patient.lastName,
        patientId: e.patient.patientId,
        phoneNumber: e.patient.phoneNumber || undefined,
        email: e.patient.email || undefined,
      },
      appointment: { id: e.appointmentId } as any,
    };
  }
}
