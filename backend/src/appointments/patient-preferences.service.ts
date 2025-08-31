import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PatientPreferenceResponse } from './interfaces/appointment.interface';

@Injectable()
export class PatientPreferencesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<PatientPreferenceResponse> {
    const {
      patientId,
      appointmentId,
      preferenceType,
      preferenceValue,
      isActive = true,
    } = data;

    const pref = await this.prisma.patientPreference.create({
      data: {
        patientId,
        appointmentId: appointmentId || null,
        preferenceType,
        preferenceValue,
        isActive,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientId: true,
          },
        },
      },
    });

    return this.mapToResponse(pref);
  }

  async findAll(query: any): Promise<{
    preferences: PatientPreferenceResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      patientId,
      preferenceType,
      isActive,
    } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (preferenceType) where.preferenceType = preferenceType;
    if (isActive !== undefined) where.isActive = isActive;

    const total = await this.prisma.patientPreference.count({ where });
    const prefs = await this.prisma.patientPreference.findMany({
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      preferences: prefs.map((p) => this.mapToResponse(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<PatientPreferenceResponse> {
    const pref = await this.prisma.patientPreference.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientId: true,
          },
        },
      },
    });

    if (!pref) throw new NotFoundException('Patient preference not found');
    return this.mapToResponse(pref);
  }

  async update(id: string, data: any): Promise<PatientPreferenceResponse> {
    await this.findOne(id);

    const updateData: any = {};
    if (data.appointmentId !== undefined)
      updateData.appointmentId = data.appointmentId;
    if (data.preferenceType !== undefined)
      updateData.preferenceType = data.preferenceType;
    if (data.preferenceValue !== undefined)
      updateData.preferenceValue = data.preferenceValue;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const pref = await this.prisma.patientPreference.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientId: true,
          },
        },
      },
    });

    return this.mapToResponse(pref);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.patientPreference.delete({ where: { id } });
  }

  private mapToResponse(p: any): PatientPreferenceResponse {
    return {
      id: p.id,
      patientId: p.patientId,
      appointmentId: p.appointmentId || undefined,
      preferenceType: p.preferenceType,
      preferenceValue: p.preferenceValue,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
