import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAppointmentSlotDto } from './dto/create-appointment.dto';
import { UpdateAppointmentSlotDto } from './dto/update-appointment.dto';
import { QueryAppointmentSlotDto } from './dto/query-appointment.dto';
import {
  AppointmentSlotResponse,
  AvailableSlot,
  SlotSearchResult,
} from './interfaces/appointment.interface';
import { SlotType } from '@prisma/client';

@Injectable()
export class AppointmentSlotsService {
  constructor(private prisma: PrismaService) {}

  // ===== SLOT CREATION =====

  async createAppointmentSlot(
    createSlotDto: CreateAppointmentSlotDto,
  ): Promise<AppointmentSlotResponse> {
    const {
      startTime,
      endTime,
      slotType,
      maxBookings = 1,
      providerId,
      resourceId,
      isAvailable = true,
      isBookable = true,
      duration,
      bufferTimeBefore = 0,
      bufferTimeAfter = 0,
      specialty,
      notes,
    } = createSlotDto;

    // Validate time logic
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for overlapping slots for the same provider
    const overlappingSlots = await this.prisma.appointmentSlot.findMany({
      where: {
        providerId,
        isAvailable: true,
        OR: [
          {
            startTime: {
              lt: new Date(endTime),
            },
            endTime: {
              gt: new Date(startTime),
            },
          },
        ],
      },
    });

    if (overlappingSlots.length > 0) {
      throw new ConflictException(
        'Slot overlaps with existing provider schedule',
      );
    }

    // Create the slot
    const slot = await this.prisma.appointmentSlot.create({
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration:
          duration ||
          Math.ceil(
            (new Date(endTime).getTime() - new Date(startTime).getTime()) /
              (1000 * 60),
          ),
        slotType: slotType as SlotType,
        maxBookings,
        currentBookings: 0,
        isAvailable,
        isBookable,
        bufferTimeBefore,
        bufferTimeAfter,
        specialty,
        notes,
        providerId,
        resourceId,
      },
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        resource: true,
        appointments: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return this.mapToSlotResponse(slot);
  }

  // ===== SLOT RETRIEVAL =====

  async findAllSlots(
    queryDto: QueryAppointmentSlotDto,
  ): Promise<SlotSearchResult> {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      slotType,
      providerId,
      resourceId,
      isAvailable,
      isBookable,
      specialty,
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (slotType) {
      where.slotType = slotType;
    }

    if (providerId) {
      where.providerId = providerId;
    }

    if (resourceId) {
      where.resourceId = resourceId;
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (isBookable !== undefined) {
      where.isBookable = isBookable;
    }

    if (specialty) {
      where.specialty = specialty;
    }

    // Get total count
    const total = await this.prisma.appointmentSlot.count({ where });

    // Get slots with pagination
    const slots = await this.prisma.appointmentSlot.findMany({
      where,
      skip,
      take: limit,
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        resource: true,
        appointments: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [{ startTime: 'asc' }],
    });

    return {
      slots: slots.map((slot) => this.mapToSlotResponse(slot)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneSlot(id: string): Promise<AppointmentSlotResponse> {
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id },
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        resource: true,
        appointments: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException('Appointment slot not found');
    }

    return this.mapToSlotResponse(slot);
  }

  // ===== SLOT UPDATES =====

  async updateSlot(
    id: string,
    updateSlotDto: UpdateAppointmentSlotDto,
  ): Promise<AppointmentSlotResponse> {
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id },
      include: {
        appointments: true,
      },
    });

    if (!slot) {
      throw new NotFoundException('Appointment slot not found');
    }

    // Check if slot has existing appointments
    if (slot.appointments.length > 0) {
      throw new BadRequestException(
        'Cannot modify slot with existing appointments',
      );
    }

    // Validate time logic if updating times
    if (updateSlotDto.startTime && updateSlotDto.endTime) {
      if (updateSlotDto.startTime >= updateSlotDto.endTime) {
        throw new BadRequestException('Start time must be before end time');
      }
    }

    // Check for overlapping slots if updating times or provider
    if (
      updateSlotDto.startTime ||
      updateSlotDto.endTime ||
      updateSlotDto.providerId
    ) {
      const startTime = updateSlotDto.startTime || slot.startTime;
      const endTime = updateSlotDto.endTime || slot.endTime;
      const providerId = updateSlotDto.providerId || slot.providerId;

      const overlappingSlots = await this.prisma.appointmentSlot.findMany({
        where: {
          providerId,
          isAvailable: true,
          id: { not: id },
          OR: [
            {
              startTime: {
                lt: endTime,
              },
              endTime: {
                gt: startTime,
              },
            },
          ],
        },
      });

      if (overlappingSlots.length > 0) {
        throw new ConflictException(
          'Updated slot overlaps with existing provider schedule',
        );
      }
    }

    // Build update data object
    const updateData: any = {};

    if (updateSlotDto.startTime) {
      updateData.startTime = new Date(updateSlotDto.startTime);
    }

    if (updateSlotDto.endTime) {
      updateData.endTime = new Date(updateSlotDto.endTime);
    }

    if (updateSlotDto.slotType) {
      updateData.slotType = updateSlotDto.slotType as SlotType;
    }

    if (updateSlotDto.maxBookings) {
      updateData.maxBookings = updateSlotDto.maxBookings;
    }

    if (updateSlotDto.providerId) {
      updateData.providerId = updateSlotDto.providerId;
    }

    if (updateSlotDto.resourceId !== undefined) {
      updateData.resourceId = updateSlotDto.resourceId;
    }

    if (updateSlotDto.isAvailable !== undefined) {
      updateData.isAvailable = updateSlotDto.isAvailable;
    }

    if (updateSlotDto.isBookable !== undefined) {
      updateData.isBookable = updateSlotDto.isBookable;
    }

    if (updateSlotDto.duration) {
      updateData.duration = updateSlotDto.duration;
    }

    if (updateSlotDto.bufferTimeBefore !== undefined) {
      updateData.bufferTimeBefore = updateSlotDto.bufferTimeBefore;
    }

    if (updateSlotDto.bufferTimeAfter !== undefined) {
      updateData.bufferTimeAfter = updateSlotDto.bufferTimeAfter;
    }

    if (updateSlotDto.specialty !== undefined) {
      updateData.specialty = updateSlotDto.specialty;
    }

    if (updateSlotDto.notes !== undefined) {
      updateData.notes = updateSlotDto.notes;
    }

    // Update the slot
    const updatedSlot = await this.prisma.appointmentSlot.update({
      where: { id },
      data: updateData,
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        resource: true,
        appointments: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return this.mapToSlotResponse(updatedSlot);
  }

  // ===== SLOT DELETION =====

  async removeSlot(id: string): Promise<void> {
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id },
      include: {
        appointments: true,
      },
    });

    if (!slot) {
      throw new NotFoundException('Appointment slot not found');
    }

    // Check if slot has existing appointments
    if (slot.appointments.length > 0) {
      throw new BadRequestException(
        'Cannot delete slot with existing appointments',
      );
    }

    await this.prisma.appointmentSlot.delete({
      where: { id },
    });
  }

  // ===== SLOT AVAILABILITY =====

  async checkSlotAvailability(slotId: string): Promise<boolean> {
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot || !slot.isAvailable || !slot.isBookable) {
      return false;
    }

    return slot.currentBookings < slot.maxBookings;
  }

  async reserveSlot(slotId: string): Promise<boolean> {
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot || !slot.isAvailable || !slot.isBookable) {
      return false;
    }

    if (slot.currentBookings >= slot.maxBookings) {
      return false;
    }

    // Increment booking count
    await this.prisma.appointmentSlot.update({
      where: { id: slotId },
      data: {
        currentBookings: {
          increment: 1,
        },
      },
    });

    return true;
  }

  async releaseSlot(slotId: string): Promise<void> {
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return;
    }

    if (slot.currentBookings > 0) {
      await this.prisma.appointmentSlot.update({
        where: { id: slotId },
        data: {
          currentBookings: {
            decrement: 1,
          },
        },
      });
    }
  }

  // ===== UTILITY METHODS =====

  private mapToSlotResponse(slot: any): AppointmentSlotResponse {
    if (!slot.provider) {
      throw new Error('Slot must have a provider');
    }

    return {
      id: slot.id,
      providerId: slot.providerId,
      resourceId: slot.resourceId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      slotType: slot.slotType,
      maxBookings: slot.maxBookings,
      currentBookings: slot.currentBookings,
      isAvailable: slot.isAvailable,
      isBookable: slot.isBookable,
      bufferTimeBefore: slot.bufferTimeBefore,
      bufferTimeAfter: slot.bufferTimeAfter,
      specialty: slot.specialty,
      notes: slot.notes,
      provider: {
        id: slot.provider.id,
        firstName: slot.provider.user.firstName,
        lastName: slot.provider.user.lastName,
        specialization: slot.provider.specialization,
        department: slot.provider.department,
      },
      resource: slot.resource
        ? {
            id: slot.resource.id,
            name: slot.resource.name,
            type: slot.resource.type,
            location: slot.resource.location,
            capacity: slot.resource.capacity,
          }
        : undefined,
      appointments: slot.appointments.map((apt: any) => ({
        id: apt.id,
        patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
        status: apt.status,
        scheduledStart: apt.scheduledStart,
        scheduledEnd: apt.scheduledEnd,
      })),
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }
}
