import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateAppointmentDto,
  CreateAppointmentSlotDto,
  CreateRecurringSlotDto,
} from './dto/create-appointment.dto';
import {
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
  UpdateAppointmentStatusDto,
  UpdateAppointmentPaymentDto,
  ProcessPaymentDto,
} from './dto/update-appointment.dto';
import {
  QueryAppointmentDto,
  SearchAvailableSlotsDto,
  GetProviderAvailabilityDto,
  GetProviderDateRangeAvailabilityDto,
} from './dto/query-appointment.dto';
import {
  AppointmentResponse,
  AppointmentSlotResponse,
  AvailableSlot,
  SchedulingConflict,
  AppointmentSearchResult,
  ProviderAvailabilityResponse,
  AppointmentStatistics,
  ProviderDateRangeAvailabilityResponse,
  DateAvailability,
} from './interfaces/appointment.interface';
import {
  AppointmentStatus,
  AppointmentType,
  AppointmentPriority,
  SlotType,
  NotificationType,
} from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ===== APPOINTMENT MANAGEMENT =====

  async createAppointment(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<AppointmentResponse> {
    const {
      patientId,
      slotId,
      scheduledStart,
      scheduledEnd,
      totalAmount,
      requiresPrePayment = true,
    } = createAppointmentDto;

    // Validate slot availability
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id: slotId },
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
      },
    });

    if (!slot) {
      throw new NotFoundException('Appointment slot not found');
    }

    if (!slot.isAvailable || !slot.isBookable) {
      throw new BadRequestException(
        'Appointment slot is not available for booking',
      );
    }

    if (slot.currentBookings >= slot.maxBookings) {
      throw new BadRequestException('Appointment slot is fully booked');
    }

    // Check for scheduling conflicts
    const conflicts = await this.detectSchedulingConflicts(
      slotId,
      new Date(scheduledStart),
      new Date(scheduledEnd),
    );
    if (conflicts.length > 0) {
      throw new ConflictException(
        `Scheduling conflicts detected: ${conflicts.map((c) => c.message).join(', ')}`,
      );
    }

    // Calculate appointment amount if not provided
    let finalAmount = totalAmount;
    if (!finalAmount) {
      finalAmount = await this.calculateAppointmentCost(createAppointmentDto);
    }

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        ...createAppointmentDto,
        providerId: slot.providerId, // Add providerId from slot
        totalAmount: finalAmount,
        balance: finalAmount,
        requiresPrePayment,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
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
        slot: {
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
            resource: {
              select: {
                id: true,
                name: true,
                type: true,
                location: true,
              },
            },
          },
        },
      },
    });

    // Create invoice for the appointment
    await this.createAppointmentInvoice(appointment);

    // Send appointment confirmation notifications
    try {
      await this.notificationsService.sendAppointmentConfirmation(
        appointment.id,
      );
    } catch (error) {
      console.error(
        'Failed to send appointment confirmation notifications:',
        error,
      );
      // Don't fail appointment creation if notifications fail
    }

    // Note: Reminder notifications are now handled automatically by cron jobs
    // - 24-hour reminders processed every 15 minutes
    // - 2-hour reminders processed every 15 minutes
    // - 1-hour reminders processed every 15 minutes

    // Update slot booking count
    await this.prisma.appointmentSlot.update({
      where: { id: slotId },
      data: { currentBookings: { increment: 1 } },
    });

    // Create initial notification
    await this.createAppointmentNotification(
      appointment.id,
      'APPOINTMENT_CONFIRMATION',
    );

    return this.mapToAppointmentResponse(appointment);
  }

  async updateAppointment(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<AppointmentResponse> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, slot: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Validate update permissions and business rules
    if (
      appointment.status === 'COMPLETED' ||
      appointment.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        'Cannot update completed or cancelled appointment',
      );
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: updateAppointmentDto,
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
        slot: {
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
            resource: {
              select: {
                id: true,
                name: true,
                type: true,
                location: true,
              },
            },
          },
        },
      },
    });

    return this.mapToAppointmentResponse(updatedAppointment);
  }

  async rescheduleAppointment(
    rescheduleDto: RescheduleAppointmentDto,
  ): Promise<AppointmentResponse> {
    const { appointmentId, newStartTime, newEndTime, reason } = rescheduleDto;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (
      appointment.status === 'COMPLETED' ||
      appointment.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        'Cannot reschedule completed or cancelled appointment',
      );
    }

    // Check for conflicts with new time
    const conflicts = await this.detectSchedulingConflicts(
      appointment.slotId,
      new Date(newStartTime),
      new Date(newEndTime),
      appointmentId,
    );

    if (conflicts.length > 0) {
      throw new ConflictException(
        `Scheduling conflicts detected: ${conflicts.map((c) => c.message).join(', ')}`,
      );
    }

    // Update appointment times
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledStart: new Date(newStartTime),
        scheduledEnd: new Date(newEndTime),
        status: 'RESCHEDULED',
        notes: reason
          ? `${appointment.notes || ''}\nRescheduled: ${reason}`
          : appointment.notes,
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
        slot: {
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
            resource: {
              select: {
                id: true,
                name: true,
                type: true,
                location: true,
              },
            },
          },
        },
      },
    });

    // Create reschedule notification
    await this.createAppointmentNotification(
      appointmentId,
      'APPOINTMENT_RESCHEDULE',
    );

    return this.mapToAppointmentResponse(updatedAppointment);
  }

  async cancelAppointment(
    cancelDto: CancelAppointmentDto,
  ): Promise<AppointmentResponse> {
    const {
      appointmentId,
      cancellationReason,
      refundRequired = false,
    } = cancelDto;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (
      appointment.status === 'COMPLETED' ||
      appointment.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        'Appointment is already completed or cancelled',
      );
    }

    // Handle refund if required
    if (refundRequired && Number(appointment.paidAmount) > 0) {
      await this.processRefund(appointmentId, Number(appointment.paidAmount));
    }

    // Update appointment status
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        notes: `${appointment.notes || ''}\nCancelled: ${cancellationReason}`,
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
        slot: {
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
            resource: {
              select: {
                id: true,
                name: true,
                type: true,
                location: true,
              },
            },
          },
        },
      },
    });

    // Decrease slot booking count
    await this.prisma.appointmentSlot.update({
      where: { id: appointment.slotId },
      data: { currentBookings: { decrement: 1 } },
    });

    // Create cancellation notification
    await this.createAppointmentNotification(
      appointmentId,
      'APPOINTMENT_CANCELLATION',
    );

    return this.mapToAppointmentResponse(updatedAppointment);
  }

  async processPayment(
    paymentDto: ProcessPaymentDto,
  ): Promise<AppointmentResponse> {
    const {
      appointmentId,
      amount,
      paymentMethod = 'CASH',
      reference,
    } = paymentDto;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { invoice: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (!appointment.invoice) {
      throw new BadRequestException('No invoice found for this appointment');
    }

    // Process payment and update invoice
    await this.prisma.$transaction(async (tx) => {
      // Create payment record
      await tx.payment.create({
        data: {
          invoiceId: appointment.invoice!.id,
          patientId: appointment.patientId,
          amount,
          method: paymentMethod,
          reference,
          status: 'COMPLETED',
          processedBy: 'system', // TODO: Get from authenticated user
          processedAt: new Date(),
        },
      });

      // Update invoice payment status
      const newPaidAmount = Number(appointment.invoice!.paidAmount) + amount;
      const newBalance =
        Number(appointment.invoice!.totalAmount) - newPaidAmount;
      const isPaid = newBalance <= 0;

      await tx.invoice.update({
        where: { id: appointment.invoice!.id },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: isPaid ? 'PAID' : 'PARTIAL',
          paidDate: isPaid ? new Date() : undefined,
        },
      });

      // Update appointment payment status
      const newAppointmentPaidAmount = Number(appointment.paidAmount) + amount;
      const newAppointmentBalance =
        Number(appointment.totalAmount) - newAppointmentPaidAmount;
      const appointmentIsPaid = newAppointmentBalance <= 0;

      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          paidAmount: newAppointmentPaidAmount,
          balance: newAppointmentBalance,
          isPaid: appointmentIsPaid,
        },
      });
    });

    // Get updated appointment
    const updatedAppointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
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
        slot: {
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
            resource: {
              select: {
                id: true,
                name: true,
                type: true,
                location: true,
              },
            },
          },
        },
        invoice: true,
      },
    });

    // Send payment confirmation notification
    try {
      if (updatedAppointment) {
        await this.notificationsService.sendTemplateNotification({
          templateName: 'payment_confirmation',
          type: 'PAYMENT_RECEIVED',
          channel: 'EMAIL',
          recipientId: updatedAppointment.patientId,
          recipientType: 'PATIENT',
          variables: {
            patientName: `${updatedAppointment.patient.firstName} ${updatedAppointment.patient.lastName}`,
            appointmentDate:
              updatedAppointment.scheduledStart.toLocaleDateString(),
            amount: `$${amount.toFixed(2)}`,
            totalAmount: `$${Number(updatedAppointment.totalAmount).toFixed(2)}`,
            balance: `$${Number(updatedAppointment.balance).toFixed(2)}`,
            paymentMethod: paymentMethod,
          },
        });
      }
    } catch (error) {
      console.error('Failed to send payment confirmation notification:', error);
      // Don't fail payment processing if notification fails
    }

    await this.createAppointmentNotification(appointmentId, 'PAYMENT_RECEIVED');

    return this.mapToAppointmentResponse(updatedAppointment);
  }

  // ===== INTELLIGENT SCHEDULING ENGINE =====

  async searchAvailableSlots(
    searchDto: SearchAvailableSlotsDto,
  ): Promise<AvailableSlot[]> {
    const {
      providerId,
      resourceId,
      startDate,
      endDate,
      slotType,
      duration,
      specialty,
      includeBooked = false,
    } = searchDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get provider schedule
    const providerSchedule = await this.getProviderSchedule(
      providerId,
      start,
      end,
    );

    // Get available slots
    const availableSlots = await this.prisma.appointmentSlot.findMany({
      where: {
        providerId,
        startTime: { gte: start, lte: end },
        slotType: slotType || undefined,
        specialty: specialty || undefined,
        isAvailable: true,
        isBookable: true,
        currentBookings: { lt: this.prisma.appointmentSlot.fields.maxBookings },
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
        resource: {
          select: {
            name: true,
            type: true,
            location: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Filter by duration if specified
    let filteredSlots = availableSlots;
    if (duration) {
      filteredSlots = availableSlots.filter(
        (slot) => slot.duration >= duration,
      );
    }

    // Apply scheduling rules and optimization
    const optimizedSlots = this.applySchedulingRules(
      filteredSlots,
      providerId,
      resourceId,
    );

    // Map to response format
    return optimizedSlots.map((slot) => ({
      slotId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      slotType: slot.slotType,
      specialty: slot.specialty,
      provider: slot.provider,
      resource: slot.resource,
      isAvailable: slot.isAvailable,
      currentBookings: slot.currentBookings,
      maxBookings: slot.maxBookings,
    }));
  }

  async createRecurringSlots(
    createRecurringSlotDto: CreateRecurringSlotDto,
  ): Promise<void> {
    const {
      slotId,
      patternType,
      interval,
      daysOfWeek,
      startDate,
      endDate,
      maxOccurrences,
    } = createRecurringSlotDto;

    const baseSlot = await this.prisma.appointmentSlot.findUnique({
      where: { id: slotId },
    });

    if (!baseSlot) {
      throw new NotFoundException('Base slot not found');
    }

    const start = new Date(startDate);
    const end = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000); // Default to 1 year

    const currentDate = new Date(start);
    let occurrenceCount = 0;

    while (
      currentDate <= end &&
      (!maxOccurrences || occurrenceCount < maxOccurrences)
    ) {
      if (daysOfWeek.includes(currentDate.getDay())) {
        // Create slot for this day
        const slotStartTime = new Date(currentDate);
        slotStartTime.setHours(
          baseSlot.startTime.getHours(),
          baseSlot.startTime.getMinutes(),
          0,
          0,
        );

        const slotEndTime = new Date(
          slotStartTime.getTime() + baseSlot.duration * 60 * 1000,
        );

        await this.prisma.appointmentSlot.create({
          data: {
            providerId: baseSlot.providerId,
            resourceId: baseSlot.resourceId,
            startTime: slotStartTime,
            endTime: slotEndTime,
            duration: baseSlot.duration,
            slotType: baseSlot.slotType,
            isAvailable: baseSlot.isAvailable,
            isBookable: baseSlot.isBookable,
            maxBookings: baseSlot.maxBookings,
            bufferTimeBefore: baseSlot.bufferTimeBefore,
            bufferTimeAfter: baseSlot.bufferTimeAfter,
            specialty: baseSlot.specialty,
            notes: baseSlot.notes,
          },
        });

        occurrenceCount++;
      }

      // Move to next interval
      switch (patternType) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7 * interval);
          break;
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
        default:
          currentDate.setDate(currentDate.getDate() + interval);
      }
    }
  }

  async createBulkSlots(bulkSlotsDto: any): Promise<void> {
    const {
      providerId,
      resourceId,
      startDate,
      endDate,
      daysOfWeek,
      startTime,
      endTime,
      slotDuration,
      bufferTime,
      slotType,
      specialty,
    } = bulkSlotsDto;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const currentDate = new Date(start);

    while (currentDate <= end) {
      if (daysOfWeek.includes(currentDate.getDay())) {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, 0, 0);

        const slotEnd = new Date(currentDate);
        slotEnd.setHours(endHour, endMinute, 0, 0);

        while (slotStart < slotEnd) {
          const slotEndTime = new Date(
            slotStart.getTime() + slotDuration * 60 * 1000,
          );

          if (slotEndTime <= slotEnd) {
            await this.prisma.appointmentSlot.create({
              data: {
                providerId,
                resourceId,
                startTime: slotStart,
                endTime: slotEndTime,
                duration: slotDuration,
                slotType,
                specialty,
                bufferTimeBefore: bufferTime,
                bufferTimeAfter: bufferTime,
              },
            });
          }

          slotStart = slotEndTime;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // ===== RESOURCE OPTIMIZATION =====

  async getProviderAvailability(
    availabilityDto: GetProviderAvailabilityDto,
  ): Promise<ProviderAvailabilityResponse> {
    const {
      providerId,
      startDate,
      endDate,
      includeTimeOff = true,
      includeBookings = true,
    } = availabilityDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get provider schedule
    const schedule = await this.prisma.providerSchedule.findMany({
      where: {
        providerId,
        dayOfWeek: { in: this.getDaysOfWeekRange(start, end) },
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
      },
    });

    // Get time off requests
    const timeOff = includeTimeOff
      ? await this.prisma.providerTimeOff.findMany({
          where: {
            providerId,
            startDate: { lte: end },
            endDate: { gte: start },
            status: 'APPROVED',
          },
        })
      : [];

    // Get available slots
    const availableSlots = await this.prisma.appointmentSlot.findMany({
      where: {
        providerId,
        startTime: { gte: start, lte: end },
        isAvailable: true,
      },
      include: {
        appointments: includeBookings
          ? {
              where: {
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
              },
            }
          : false,
      },
    });

    // Group by date
    const availabilityByDate = this.groupAvailabilityByDate(
      schedule,
      availableSlots,
      timeOff,
      start,
      end,
    );

    return availabilityByDate;
  }

  async getProviderDateRangeAvailability(
    availabilityDto: GetProviderDateRangeAvailabilityDto,
  ): Promise<ProviderDateRangeAvailabilityResponse> {
    const {
      providerId,
      startDate,
      endDate,
      includeTimeOff = true,
      includeBookings = true,
      includePastDates = false,
    } = availabilityDto;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get provider info
    const provider = await this.prisma.staffMember.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Get provider schedule
    const schedule = await this.prisma.providerSchedule.findMany({
      where: {
        providerId,
        dayOfWeek: { in: this.getDaysOfWeekRange(start, end) },
      },
    });

    // Get time off requests
    const timeOff = includeTimeOff
      ? await this.prisma.providerTimeOff.findMany({
          where: {
            providerId,
            startDate: { lte: end },
            endDate: { gte: start },
            status: 'APPROVED',
          },
        })
      : [];

    // Get available slots
    const availableSlots = await this.prisma.appointmentSlot.findMany({
      where: {
        providerId,
        startTime: { gte: start, lte: end },
        isAvailable: true,
      },
      include: {
        appointments: includeBookings
          ? {
              where: {
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
              },
            }
          : false,
      },
    });

    // Generate availability for each date in range
    const availability: DateAvailability[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const isPast = currentDate < today;
      const isToday = currentDate.toDateString() === today.toDateString();

      // Skip past dates if not requested
      if (isPast && !includePastDates) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Find schedule for this day
      const daySchedule = schedule.find((s) => s.dayOfWeek === dayOfWeek);

      // Check if provider has time off on this date
      const dayTimeOff = timeOff.filter((t) => {
        const timeOffStart = new Date(t.startDate);
        const timeOffEnd = new Date(t.endDate);
        return currentDate >= timeOffStart && currentDate <= timeOffEnd;
      });

      // Get slots for this date
      const daySlots = availableSlots.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        return slotDate.toDateString() === currentDate.toDateString();
      });

      // Determine availability
      const isAvailable =
        daySchedule?.isAvailable &&
        dayTimeOff.length === 0 &&
        daySlots.length > 0;

      // Generate time slots for this date
      const timeSlots = this.generateTimeSlots(
        daySchedule?.startTime || '09:00',
        daySchedule?.endTime || '17:00',
        daySchedule?.slotDuration || 30,
        daySchedule?.breakStart || undefined,
        daySchedule?.breakEnd || undefined,
        daySlots,
        [],
      );

      // Calculate availability metrics
      const totalSlots = timeSlots.length;
      const availableSlotsCount = timeSlots.filter(
        (slot) => slot.isAvailable,
      ).length;
      const availabilityPercentage =
        totalSlots > 0
          ? Math.round((availableSlotsCount / totalSlots) * 100)
          : 0;

      availability.push({
        date: dateString,
        dayOfWeek,
        isAvailable: isAvailable || false,
        isPast,
        isToday,
        startTime: daySchedule?.startTime || '09:00',
        endTime: daySchedule?.endTime || '17:00',
        breakStart: daySchedule?.breakStart || undefined,
        breakEnd: daySchedule?.breakEnd || undefined,
        maxAppointments: daySchedule?.maxAppointments || 8,
        slotDuration: daySchedule?.slotDuration || 30,
        bufferTime: daySchedule?.bufferTime || 15,
        availableSlots: daySlots as any,
        bookedSlots: [],
        timeOff: dayTimeOff,
        totalSlots,
        availableSlotsCount,
        availabilityPercentage,
        timeSlots,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      providerId,
      providerName: `${provider.user.firstName} ${provider.user.lastName}`,
      availability,
    };
  }

  // Helper method to generate detailed time slots
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    slotDuration: number,
    breakStart?: string,
    breakEnd?: string,
    freeSlots: any[] = [],
    bookedSlots: any[] = [],
  ): any[] {
    const slots: any[] = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    let currentTime = new Date(start);

    while (currentTime < end) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
      const slotEndString = slotEnd.toTimeString().slice(0, 5);

      // Check if this time slot is available
      const isAvailable = freeSlots.some((slot) => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        return slotStart <= currentTime && slotEnd >= slotEnd;
      });

      // Check if this time slot is booked
      const isBooked = bookedSlots.some((slot) => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        return slotStart <= currentTime && slotEnd >= slotEnd;
      });

      // Check if this time is during break
      const isBreak =
        breakStart &&
        breakEnd &&
        timeString >= breakStart &&
        timeString < breakEnd;

      slots.push({
        time: timeString,
        endTime: slotEndString,
        isAvailable: isAvailable && !isBreak,
        isBooked: isBooked,
        isBreak: isBreak,
        duration: slotDuration,
      });

      currentTime = slotEnd;
    }

    return slots;
  }

  // ===== CONFLICT DETECTION =====

  private async detectSchedulingConflicts(
    slotId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<SchedulingConflict[]> {
    const conflicts: SchedulingConflict[] = [];

    // Check for overlapping appointments
    const overlappingAppointments = await this.prisma.appointment.findMany({
      where: {
        slotId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        id: { not: excludeAppointmentId },
        OR: [
          {
            scheduledStart: { lt: endTime, gte: startTime },
          },
          {
            scheduledEnd: { gt: startTime, lte: endTime },
          },
          {
            scheduledStart: { lte: startTime },
            scheduledEnd: { gte: endTime },
          },
        ],
      },
    });

    if (overlappingAppointments.length > 0) {
      conflicts.push({
        type: 'TIME_CONFLICT',
        message: 'Appointment time conflicts with existing appointments',
        conflictingAppointments: overlappingAppointments.map((apt) => ({
          id: apt.id,
          scheduledStart: apt.scheduledStart,
          scheduledEnd: apt.scheduledEnd,
          status: apt.status,
          patientId: apt.patientId,
          slotId: apt.slotId,
          appointmentType: apt.appointmentType,
          priority: apt.priority,
          totalAmount: Number(apt.totalAmount),
          paidAmount: Number(apt.paidAmount),
          balance: Number(apt.balance),
          isPaid: apt.isPaid,
          requiresPrePayment: apt.requiresPrePayment,
          reason: apt.reason || undefined,
          symptoms: apt.symptoms || undefined,
          notes: apt.notes || undefined,
          actualStart: apt.actualStart || undefined,
          actualEnd: apt.actualEnd || undefined,
          checkInTime: apt.checkInTime || undefined,
          parentAppointmentId: apt.parentAppointmentId || undefined,
          bundleId: apt.bundleId || undefined,
          createdAt: apt.createdAt,
          updatedAt: apt.updatedAt,
          patient: null as any, // Will be populated if needed
          slot: null as any, // Will be populated if needed
        })),
      });
    }

    // Check provider availability
    const slot = await this.prisma.appointmentSlot.findUnique({
      where: { id: slotId },
      include: { provider: true },
    });

    if (slot) {
      const providerTimeOff = await this.prisma.providerTimeOff.findMany({
        where: {
          providerId: slot.providerId,
          status: 'APPROVED',
          startDate: { lte: endTime },
          endDate: { gte: startTime },
        },
      });

      if (providerTimeOff.length > 0) {
        conflicts.push({
          type: 'PROVIDER_UNAVAILABLE',
          message: 'Provider is not available during requested time',
          conflictingSlots: [],
        });
      }
    }

    return conflicts;
  }

  // ===== BILLING INTEGRATION =====

  private async createAppointmentInvoice(appointment: any): Promise<void> {
    try {
      // Generate invoice number
      const invoiceNumber = this.generateInvoiceNumber();

      // Create invoice for the appointment
      const invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber,
          patientId: appointment.patientId,
          status: 'PENDING',
          dueDate: new Date(
            appointment.scheduledStart.getTime() - 24 * 60 * 60 * 1000,
          ), // Due 1 day before appointment
          notes: `Invoice for ${appointment.appointmentType} appointment on ${appointment.scheduledStart.toLocaleDateString()}`,
          totalAmount: appointment.totalAmount,
          balance: appointment.totalAmount,
          charges: {
            create: [
              {
                serviceId: await this.getServiceIdForAppointmentType(
                  appointment.appointmentType,
                ),
                description: `${appointment.appointmentType} appointment`,
                quantity: 1,
                unitPrice: appointment.totalAmount,
                totalPrice: appointment.totalAmount,
              },
            ],
          },
        },
        include: {
          patient: true,
          charges: {
            include: {
              service: true,
            },
          },
        },
      });

      // Link invoice to appointment
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          invoiceId: invoice.id,
        },
      });

      console.log(
        `Invoice created for appointment ${appointment.id}: ${invoice.invoiceNumber}`,
      );
    } catch (error) {
      console.error('Failed to create invoice for appointment:', error);
      // Don't fail the appointment creation if invoice creation fails
      // The appointment can still be created and invoice can be generated later
    }
  }

  private generateInvoiceNumber(): string {
    // Generate a unique invoice number
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${timestamp}-${random}`;
  }

  private async getServiceIdForAppointmentType(
    appointmentType: AppointmentType,
  ): Promise<string> {
    // Map appointment types to service categories
    const serviceCategoryMap = {
      GENERAL_CONSULTATION: 'CONSULTATION',
      SPECIALIST_CONSULTATION: 'SPECIALIST',
      LAB_TEST: 'LABORATORY',
      IMAGING: 'IMAGING',
      SURGERY: 'SURGERY',
      FOLLOW_UP: 'CONSULTATION',
      EMERGENCY: 'EMERGENCY',
      TELEMEDICINE: 'CONSULTATION',
      PREVENTIVE_CARE: 'PREVENTIVE',
    };

    const category = serviceCategoryMap[appointmentType] || 'CONSULTATION';

    // Find a service in the appropriate category
    const service = await this.prisma.service.findFirst({
      where: {
        category: { name: { contains: category, mode: 'insensitive' } },
        isActive: true,
      },
      orderBy: { currentPrice: 'asc' },
    });

    if (!service) {
      // Create a default service if none exists
      const defaultService = await this.prisma.service.create({
        data: {
          name: `${appointmentType} Service`,
          description: `Default service for ${appointmentType} appointments`,
          basePrice: 50.0,
          currentPrice: 50.0,
          category: {
            connectOrCreate: {
              where: { name: category },
              create: {
                name: category,
                description: `${category} services`,
              },
            },
          },
          isActive: true,
        },
      });
      return defaultService.id;
    }

    return service.id;
  }

  private async calculateAppointmentCost(
    appointmentDto: CreateAppointmentDto,
  ): Promise<number> {
    // Get base service cost based on appointment type
    const baseCost = await this.getBaseServiceCost(
      appointmentDto.appointmentType,
    );

    // Apply any bundle discounts
    if (appointmentDto.bundleId) {
      const bundle = await this.prisma.appointmentBundle.findUnique({
        where: { id: appointmentDto.bundleId },
      });

      if (bundle) {
        return Number(bundle.finalAmount);
      }
    }

    return baseCost;
  }

  private async getBaseServiceCost(
    appointmentType: AppointmentType,
  ): Promise<number> {
    // Map appointment types to service categories and get base costs
    const serviceCategoryMap = {
      GENERAL_CONSULTATION: 'CONSULTATION',
      SPECIALIST_CONSULTATION: 'SPECIALIST',
      LAB_TEST: 'LABORATORY',
      IMAGING: 'IMAGING',
      SURGERY: 'SURGERY',
      FOLLOW_UP: 'CONSULTATION',
      EMERGENCY: 'EMERGENCY',
      TELEMEDICINE: 'CONSULTATION',
      PREVENTIVE_CARE: 'PREVENTIVE',
    };

    const category = serviceCategoryMap[appointmentType] || 'CONSULTATION';

    const service = await this.prisma.service.findFirst({
      where: {
        category: { name: { contains: category, mode: 'insensitive' } },
        isActive: true,
      },
      orderBy: { currentPrice: 'asc' },
    });

    return service ? Number(service.currentPrice) : 50.0; // Default cost
  }

  private async processRefund(
    appointmentId: string,
    amount: number,
  ): Promise<void> {
    // Get appointment details for proper refund processing
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });

    if (!appointment) {
      throw new NotFoundException(
        'Appointment not found for refund processing',
      );
    }

    // Create refund record with proper linking
    await this.prisma.refund.create({
      data: {
        paymentId: 'temp', // TODO: Link to actual payment when payment system is integrated
        patientId: appointment.patientId,
        invoiceId: 'temp', // TODO: Link to actual invoice when invoice system is integrated
        amount,
        reason: 'Appointment cancellation',
        status: 'APPROVED',
        refundDate: new Date(),
      },
    });

    // Update appointment payment status
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paidAmount: { decrement: amount },
        balance: { increment: amount },
        isPaid: false, // Reset payment status
      },
    });

    // Create notification for refund
    await this.createAppointmentNotification(appointmentId, 'PAYMENT_REFUND');
  }

  // ===== NOTIFICATION SYSTEM =====

  private async createAppointmentNotification(
    appointmentId: string,
    notificationType: string,
  ): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });

    if (!appointment) return;

    // Create notification record
    await this.prisma.appointmentNotification.create({
      data: {
        appointmentId,
        notificationType: notificationType as NotificationType,
        channel: 'EMAIL', // Default to email
        recipient:
          appointment.patient.email || appointment.patient.phoneNumber || '',
        content: this.generateNotificationContent(
          notificationType,
          appointment,
        ),
        status: 'PENDING',
      },
    });
  }

  private generateNotificationContent(
    notificationType: string,
    appointment: any,
  ): string {
    const templates = {
      APPOINTMENT_CONFIRMATION: `Your appointment has been confirmed for ${appointment.scheduledStart.toLocaleDateString()} at ${appointment.scheduledStart.toLocaleTimeString()}`,
      APPOINTMENT_REMINDER: `Reminder: You have an appointment tomorrow at ${appointment.scheduledStart.toLocaleTimeString()}`,
      APPOINTMENT_CANCELLATION: `Your appointment scheduled for ${appointment.scheduledStart.toLocaleDateString()} has been cancelled`,
      APPOINTMENT_RESCHEDULE: `Your appointment has been rescheduled to ${appointment.scheduledStart.toLocaleDateString()} at ${appointment.scheduledStart.toLocaleTimeString()}`,
      PAYMENT_REFUND: `A refund of $${appointment.paidAmount} has been processed for your cancelled appointment`,
    };

    return templates[notificationType] || 'Appointment notification';
  }

  // ===== HELPER METHODS =====

  private mapToAppointmentResponse(appointment: any): AppointmentResponse {
    return {
      id: appointment.id,
      patientId: appointment.patientId,
      slotId: appointment.slotId,
      status: appointment.status,
      appointmentType: appointment.appointmentType,
      priority: appointment.priority,
      totalAmount: Number(appointment.totalAmount),
      paidAmount: Number(appointment.paidAmount),
      balance: Number(appointment.balance),
      isPaid: appointment.isPaid,
      requiresPrePayment: appointment.requiresPrePayment,
      reason: appointment.reason,
      symptoms: appointment.symptoms,
      notes: appointment.notes,
      scheduledStart: appointment.scheduledStart,
      scheduledEnd: appointment.scheduledEnd,
      actualStart: appointment.actualStart,
      actualEnd: appointment.actualEnd,
      checkInTime: appointment.checkInTime,
      parentAppointmentId: appointment.parentAppointmentId,
      bundleId: appointment.bundleId,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      patient: appointment.patient,
      slot: appointment.slot,
    };
  }

  private async getProviderSchedule(
    providerId: string,
    start: Date,
    end: Date,
  ): Promise<any[]> {
    return await this.prisma.providerSchedule.findMany({
      where: {
        providerId,
        dayOfWeek: { in: this.getDaysOfWeekRange(start, end) },
      },
    });
  }

  private getDaysOfWeekRange(start: Date, end: Date): number[] {
    const days: number[] = [];
    const current = new Date(start);

    while (current <= end) {
      days.push(current.getDay());
      current.setDate(current.getDate() + 1);
    }

    return [...new Set(days)];
  }

  private applySchedulingRules(
    slots: any[],
    providerId: string,
    resourceId?: string,
  ): any[] {
    // Apply business rules for slot optimization
    // This could include:
    // - Provider workload balancing
    // - Resource utilization optimization
    // - Patient preference matching
    // - Emergency slot reservation

    return slots;
  }

  private groupAvailabilityByDate(
    schedule: any[],
    slots: any[],
    timeOff: any[],
    start: Date,
    end: Date,
  ): any {
    // Group availability data by date for easier consumption
    // This is a simplified implementation
    return {
      providerId: schedule[0]?.providerId,
      providerName:
        schedule[0]?.provider?.firstName +
        ' ' +
        schedule[0]?.provider?.lastName,
      date: start.toISOString().split('T')[0],
      dayOfWeek: start.getDay(),
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
      maxAppointments: 20,
      slotDuration: 30,
      bufferTime: 5,
      availableSlots: slots,
      bookedSlots: [],
      timeOff,
    };
  }

  // ===== QUERY METHODS =====

  async findAll(
    queryDto: QueryAppointmentDto,
  ): Promise<AppointmentSearchResult> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'scheduledStart',
      sortOrder = 'asc',
      ...filters
    } = queryDto;

    const where: any = {};

    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.providerId) where.slot = { providerId: filters.providerId };
    if (filters.status) where.status = filters.status;
    if (filters.appointmentType)
      where.appointmentType = filters.appointmentType;
    if (filters.priority) where.priority = filters.priority;
    if (filters.isPaid !== undefined) where.isPaid = filters.isPaid;
    if (filters.bundleId) where.bundleId = filters.bundleId;

    if (filters.startDate || filters.endDate) {
      where.scheduledStart = {};
      if (filters.startDate)
        where.scheduledStart.gte = new Date(filters.startDate);
      if (filters.endDate) where.scheduledStart.lte = new Date(filters.endDate);
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
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
          slot: {
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
              resource: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  location: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      appointments: appointments.map((apt) =>
        this.mapToAppointmentResponse(apt),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<AppointmentResponse> {
    const appointment = await this.prisma.appointment.findUnique({
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
        slot: {
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
            resource: {
              select: {
                id: true,
                name: true,
                type: true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return this.mapToAppointmentResponse(appointment);
  }

  async getAppointmentStatistics(): Promise<AppointmentStatistics> {
    const [
      totalAppointments,
      scheduledAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      totalRevenue,
      pendingPayments,
    ] = await Promise.all([
      this.prisma.appointment.count(),
      this.prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.appointment.count({ where: { status: 'CANCELLED' } }),
      this.prisma.appointment.count({ where: { status: 'NO_SHOW' } }),
      this.prisma.appointment.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'COMPLETED' },
      }),
      this.prisma.appointment.aggregate({
        _sum: { balance: true },
        where: { status: { in: ['SCHEDULED', 'CONFIRMED'] } },
      }),
    ]);

    return {
      totalAppointments,
      scheduledAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      pendingPayments: Number(pendingPayments._sum.balance || 0),
      averageAppointmentDuration: 30, // This would need to be calculated from actual data
      providerUtilization: [],
      resourceUtilization: [],
    };
  }

  // ===== INVOICE MANAGEMENT =====

  async getAppointmentInvoice(appointmentId: string): Promise<any> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        invoice: {
          include: {
            charges: {
              include: {
                service: true,
              },
            },
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientId: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (!appointment.invoice) {
      throw new NotFoundException('No invoice found for this appointment');
    }

    return {
      appointmentId: appointment.id,
      appointmentType: appointment.appointmentType,
      scheduledStart: appointment.scheduledStart,
      scheduledEnd: appointment.scheduledEnd,
      invoice: appointment.invoice,
    };
  }

  async getAllAppointmentInvoices(queryDto: any): Promise<any> {
    const {
      page = 1,
      limit = 20,
      patientId,
      status,
      startDate,
      endDate,
    } = queryDto;

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (status) where.invoice = { status };
    if (startDate || endDate) {
      where.scheduledStart = {};
      if (startDate) where.scheduledStart.gte = new Date(startDate);
      if (endDate) where.scheduledStart.lte = new Date(endDate);
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          ...where,
          invoice: { isNot: null },
        },
        include: {
          invoice: {
            include: {
              charges: {
                include: {
                  service: true,
                },
              },
            },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientId: true,
            },
          },
        },
        orderBy: { scheduledStart: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointment.count({
        where: {
          ...where,
          invoice: { isNot: null },
        },
      }),
    ]);

    return {
      appointments: appointments.map((apt) => ({
        id: apt.id,
        appointmentType: apt.appointmentType,
        scheduledStart: apt.scheduledStart,
        scheduledEnd: apt.scheduledEnd,
        totalAmount: apt.totalAmount,
        paidAmount: apt.paidAmount,
        balance: apt.balance,
        isPaid: apt.isPaid,
        invoice: apt.invoice,
        patient: apt.patient,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async regenerateAppointmentInvoice(appointmentId: string): Promise<any> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { invoice: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Delete existing invoice if it exists
    if (appointment.invoice) {
      await this.prisma.invoice.delete({
        where: { id: appointment.invoice.id },
      });
    }

    // Create new invoice
    await this.createAppointmentInvoice(appointment);

    // Get updated appointment with new invoice
    const updatedAppointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        invoice: {
          include: {
            charges: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Invoice regenerated successfully',
      appointment: this.mapToAppointmentResponse(updatedAppointment),
    };
  }
}
