import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AppointmentBundleResponse } from './interfaces/appointment.interface';

@Injectable()
export class AppointmentBundlesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<AppointmentBundleResponse> {
    const {
      name,
      description,
      bundleType,
      totalAmount = 0,
      discountAmount = 0,
      isActive = true,
    } = data;

    const finalAmount = Number(totalAmount) - Number(discountAmount);

    const bundle = await this.prisma.appointmentBundle.create({
      data: {
        name,
        description: description || undefined,
        bundleType,
        totalAmount,
        discountAmount,
        finalAmount,
        isActive,
      },
      include: {
        appointments: {
          include: {
            patient: { select: { firstName: true, lastName: true } },
            slot: true,
          },
        },
      },
    });

    return this.mapToResponse(bundle);
  }

  async findAll(query: any): Promise<{
    bundles: AppointmentBundleResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, name, bundleType, isActive } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (bundleType) where.bundleType = bundleType;
    if (isActive !== undefined) where.isActive = isActive;

    const total = await this.prisma.appointmentBundle.count({ where });
    const bundles = await this.prisma.appointmentBundle.findMany({
      where,
      skip,
      take: limit,
      include: {
        appointments: {
          include: {
            patient: { select: { firstName: true, lastName: true } },
            slot: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      bundles: bundles.map((b) => this.mapToResponse(b)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<AppointmentBundleResponse> {
    const bundle = await this.prisma.appointmentBundle.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            patient: { select: { firstName: true, lastName: true } },
            slot: true,
          },
        },
      },
    });

    if (!bundle) throw new NotFoundException('Appointment bundle not found');
    return this.mapToResponse(bundle);
  }

  async update(id: string, data: any): Promise<AppointmentBundleResponse> {
    // Ensure exists
    await this.findOne(id);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.bundleType !== undefined) updateData.bundleType = data.bundleType;
    if (data.totalAmount !== undefined)
      updateData.totalAmount = data.totalAmount;
    if (data.discountAmount !== undefined)
      updateData.discountAmount = data.discountAmount;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (
      updateData.totalAmount !== undefined ||
      updateData.discountAmount !== undefined
    ) {
      const current = await this.prisma.appointmentBundle.findUnique({
        where: { id },
      });
      const totalAmount = Number(
        updateData.totalAmount ?? current?.totalAmount ?? 0,
      );
      const discountAmount = Number(
        updateData.discountAmount ?? current?.discountAmount ?? 0,
      );
      updateData.finalAmount = totalAmount - discountAmount;
    }

    const bundle = await this.prisma.appointmentBundle.update({
      where: { id },
      data: updateData,
      include: {
        appointments: {
          include: {
            patient: { select: { firstName: true, lastName: true } },
            slot: true,
          },
        },
      },
    });

    return this.mapToResponse(bundle);
  }

  async remove(id: string): Promise<void> {
    // Ensure exists
    await this.findOne(id);
    await this.prisma.appointmentBundle.delete({ where: { id } });
  }

  private mapToResponse(bundle: any): AppointmentBundleResponse {
    return {
      id: bundle.id,
      name: bundle.name,
      description: bundle.description || undefined,
      bundleType: bundle.bundleType,
      totalAmount: Number(bundle.totalAmount),
      discountAmount: Number(bundle.discountAmount),
      finalAmount: Number(bundle.finalAmount),
      isActive: bundle.isActive,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
      appointments: (bundle.appointments || []).map((apt: any) => ({
        id: apt.id,
        patientId: apt.patientId,
        slotId: apt.slotId,
        status: apt.status,
        appointmentType: apt.appointmentType,
        priority: apt.priority,
        totalAmount: Number(apt.totalAmount ?? 0),
        paidAmount: Number(apt.paidAmount ?? 0),
        balance: Number(apt.balance ?? 0),
        isPaid: apt.isPaid,
        requiresPrePayment: apt.requiresPrePayment,
        invoiceId: apt.invoiceId || undefined,
        reason: apt.reason || undefined,
        notes: apt.notes || undefined,
        scheduledStart: apt.scheduledStart,
        scheduledEnd: apt.scheduledEnd,
        actualStart: apt.actualStart || undefined,
        actualEnd: apt.actualEnd || undefined,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt,
        // Minimal nested
        patient: apt.patient
          ? {
              id: apt.patientId,
              firstName: apt.patient.firstName,
              lastName: apt.patient.lastName,
            }
          : undefined,
        slot: apt.slot ? ({ id: apt.slotId } as any) : undefined,
      })),
    };
  }
}
