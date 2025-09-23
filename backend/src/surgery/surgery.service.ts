import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSurgeryDto } from './dto/create-surgery.dto';
import { UpdateSurgeryDto } from './dto/update-surgery.dto';
import { CreateSurgicalProcedureDto } from './dto/create-surgical-procedure.dto';
import { CreateOperatingRoomBookingDto } from './dto/create-operating-room-booking.dto';
import { UserPermissionsService } from '../users/user-permissions.service';

@Injectable()
export class SurgeryService {
  constructor(
    private prisma: PrismaService,
    private userPermissionsService: UserPermissionsService,
  ) {}

  // Helper method to get or create surgery category
  private async getOrCreateSurgeryCategory() {
    let surgeryCategory = await this.prisma.serviceCategory.findFirst({
      where: { name: 'Surgery' },
    });

    if (!surgeryCategory) {
      surgeryCategory = await this.prisma.serviceCategory.create({
        data: {
          name: 'Surgery',
          description: 'Surgical services and procedures',
        },
      });
    }

    return surgeryCategory.id;
  }

  // Surgery Management
  async createSurgery(
    createSurgeryDto: CreateSurgeryDto,
    patientId: string,
    surgeonId: string,
  ) {
    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Check if surgeon exists
    const surgeon = await this.prisma.staffMember.findUnique({
      where: { id: surgeonId },
      include: { user: true },
    });

    if (!surgeon) {
      throw new NotFoundException('Surgeon not found');
    }

    // Check if surgeon has required permissions
    const hasPermission = await this.userPermissionsService.hasAnyPermission(
      surgeon.userId,
      ['perform_surgery', 'admin'],
    );

    if (!hasPermission) {
      throw new ForbiddenException('Surgeon not authorized');
    }

    // Check if anesthesiologist exists if provided
    if (createSurgeryDto.anesthesiologistId) {
      const anesthesiologist = await this.prisma.staffMember.findUnique({
        where: { id: createSurgeryDto.anesthesiologistId },
        include: { user: true },
      });

      if (!anesthesiologist) {
        throw new NotFoundException('Anesthesiologist not found');
      }

      // Check if anesthesiologist has required permissions
      const hasPermission = await this.userPermissionsService.hasAnyPermission(
        anesthesiologist.userId,
        ['administer_anesthesia', 'admin'],
      );

      if (!hasPermission) {
        throw new ForbiddenException('Anesthesiologist not authorized');
      }
    }

    // Calculate total amount
    const surgeryFee = createSurgeryDto.surgeryFee || 0;
    const anesthesiaFee = createSurgeryDto.anesthesiaFee || 0;
    const pacuCharges = createSurgeryDto.pacuCharges || 0;
    const totalAmount = surgeryFee + anesthesiaFee + pacuCharges;

    // Create surgery
    const surgery = await this.prisma.surgery.create({
      data: {
        ...createSurgeryDto,
        patientId,
        surgeonId,
        totalAmount,
        balance: totalAmount,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        anesthesiologist: {
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

    // Create invoice for the surgery
    const invoice = await this.createInvoiceForSurgery(surgery.id, totalAmount);

    return {
      surgery,
      invoice,
      message: `Surgery scheduled successfully. Total amount: $${totalAmount}. Invoice: ${invoice.invoice.invoiceNumber}`,
    };
  }

  // Create invoice for surgery
  async createInvoiceForSurgery(surgeryId: string, totalAmount: number) {
    const surgery = await this.findSurgeryById(surgeryId);

    // Check if invoice already exists
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: surgery.patientId,
        notes: {
          contains: `Surgery ${surgeryId}`,
        },
      },
    });

    if (existingInvoice) {
      throw new ConflictException('Invoice already exists for this surgery');
    }

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: `SURG-INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId: surgery.patientId,
        totalAmount,
        balance: totalAmount,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        notes: `Invoice for Surgery ${surgeryId}`,
      },
    });

    // Create charges for surgery components
    const charges: any[] = [];

    if (Number(surgery.surgeryFee) > 0) {
      // Create or find surgery fee service
      let surgeryService = await this.prisma.service.findFirst({
        where: { serviceCode: 'SURGERY-FEE' },
      });

      if (!surgeryService) {
        // Create surgery fee service if it doesn't exist
        surgeryService = await this.prisma.service.create({
          data: {
            name: 'Surgery Fee',
            description: 'Standard surgery fee',
            serviceCode: 'SURGERY-FEE',
            basePrice: 0,
            currentPrice: 0,
            categoryId: await this.getOrCreateSurgeryCategory(),
            requiresPrePayment: true,
          },
        });
      }

      const surgeryCharge = await this.prisma.charge.create({
        data: {
          invoiceId: invoice.id,
          serviceId: surgeryService.id,
          description: `${surgery.surgeryType} - Surgery Fee`,
          quantity: 1,
          unitPrice: surgery.surgeryFee,
          totalPrice: surgery.surgeryFee,
        },
      });
      charges.push(surgeryCharge);
    }

    if (Number(surgery.anesthesiaFee) > 0) {
      // Create or find anesthesia fee service
      let anesthesiaService = await this.prisma.service.findFirst({
        where: { serviceCode: 'ANESTHESIA-FEE' },
      });

      if (!anesthesiaService) {
        // Create anesthesia fee service if it doesn't exist
        anesthesiaService = await this.prisma.service.create({
          data: {
            name: 'Anesthesia Fee',
            description: 'Anesthesia services fee',
            serviceCode: 'ANESTHESIA-FEE',
            basePrice: 0,
            currentPrice: 0,
            categoryId: await this.getOrCreateSurgeryCategory(),
            requiresPrePayment: true,
          },
        });
      }

      const anesthesiaCharge = await this.prisma.charge.create({
        data: {
          invoiceId: invoice.id,
          serviceId: anesthesiaService.id,
          description: `${surgery.anesthesiaType || 'Anesthesia'} - Anesthesia Fee`,
          quantity: 1,
          unitPrice: surgery.anesthesiaFee,
          totalPrice: surgery.anesthesiaFee,
        },
      });
      charges.push(anesthesiaCharge);
    }

    if (Number(surgery.pacuCharges) > 0) {
      // Create or find PACU charges service
      let pacuService = await this.prisma.service.findFirst({
        where: { serviceCode: 'PACU-CHARGES' },
      });

      if (!pacuService) {
        // Create PACU charges service if it doesn't exist
        pacuService = await this.prisma.service.create({
          data: {
            name: 'PACU Charges',
            description: 'Post-Anesthesia Care Unit charges',
            serviceCode: 'PACU-CHARGES',
            basePrice: 0,
            currentPrice: 0,
            categoryId: await this.getOrCreateSurgeryCategory(),
            requiresPrePayment: true,
          },
        });
      }

      const pacuCharge = await this.prisma.charge.create({
        data: {
          invoiceId: invoice.id,
          serviceId: pacuService.id,
          description: 'Post-Anesthesia Care Unit Charges',
          quantity: 1,
          unitPrice: surgery.pacuCharges,
          totalPrice: surgery.pacuCharges,
        },
      });
      charges.push(pacuCharge);
    }

    // Update surgery to link with invoice
    const updatedSurgery = await this.prisma.surgery.update({
      where: { id: surgeryId },
      data: {
        notes:
          `${surgery.notes || ''}\nInvoice created: ${invoice.invoiceNumber}`.trim(),
      },
    });

    return {
      invoice,
      charges,
      surgery: updatedSurgery,
    };
  }

  async findAllSurgeries(query?: {
    patientId?: string;
    surgeonId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    const where: any = {};

    if (query?.patientId) {
      where.patientId = query.patientId;
    }

    if (query?.surgeonId) {
      where.surgeonId = query.surgeonId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.startDate || query?.endDate) {
      where.surgeryDate = {};
      if (query.startDate) where.surgeryDate.gte = query.startDate;
      if (query.endDate) where.surgeryDate.lte = query.endDate;
    }

    if (query?.search) {
      where.OR = [
        {
          patient: {
            firstName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          patient: {
            lastName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          patient: {
            patientId: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          surgeon: {
            user: {
              firstName: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
        {
          surgeon: {
            user: {
              lastName: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const surgeries = await this.prisma.surgery.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        anesthesiologist: {
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
      orderBy: { surgeryDate: 'desc' },
    });

    return surgeries;
  }

  async findSurgeryById(id: string) {
    const surgery = await this.prisma.surgery.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            account: true,
          },
        },
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        anesthesiologist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        surgicalProcedures: true,
        operatingRoomBookings: true,
      },
    });

    if (!surgery) {
      throw new NotFoundException('Surgery not found');
    }

    return surgery;
  }

  async updateSurgery(id: string, updateSurgeryDto: UpdateSurgeryDto) {
    await this.findSurgeryById(id);

    const surgery = await this.prisma.surgery.update({
      where: { id },
      data: updateSurgeryDto,
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            firstName: true,
            lastName: true,
          },
        },
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        anesthesiologist: {
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

    return surgery;
  }

  async cancelSurgery(id: string, reason?: string) {
    const surgery = await this.findSurgeryById(id);

    if (surgery.status === 'COMPLETED') {
      throw new ConflictException('Cannot cancel a completed surgery');
    }

    if (surgery.status === 'IN_PROGRESS') {
      throw new ConflictException('Cannot cancel a surgery in progress');
    }

    const cancelledSurgery = await this.prisma.surgery.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason
          ? `${surgery.notes || ''}\nCancelled: ${reason}`.trim()
          : surgery.notes,
      },
      include: {
        patient: true,
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        anesthesiologist: {
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

    return cancelledSurgery;
  }

  async rescheduleSurgery(
    id: string,
    newSurgeryDate: Date,
    newStartTime?: Date,
    newEndTime?: Date,
    reason?: string,
  ) {
    const surgery = await this.findSurgeryById(id);

    if (surgery.status === 'COMPLETED') {
      throw new ConflictException('Cannot reschedule a completed surgery');
    }

    if (surgery.status === 'IN_PROGRESS') {
      throw new ConflictException('Cannot reschedule a surgery in progress');
    }

    // Check if new date conflicts with existing bookings
    if (surgery.roomBookingStart && surgery.roomBookingEnd) {
      const conflictingBooking =
        await this.prisma.operatingRoomBooking.findFirst({
          where: {
            roomNumber: surgery.operatingRoomBookings?.[0]?.roomNumber,
            bookingDate: newSurgeryDate,
            OR: [
              {
                startTime: {
                  lt: newEndTime || surgery.roomBookingEnd,
                  gt: newStartTime || surgery.roomBookingStart,
                },
              },
              {
                endTime: {
                  gt: newStartTime || surgery.roomBookingStart,
                  lt: newEndTime || surgery.roomBookingEnd,
                },
              },
            ],
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
            surgeryId: { not: id },
          },
        });

      if (conflictingBooking) {
        throw new ConflictException(
          'Operating room is not available for the new time slot',
        );
      }
    }

    const rescheduledSurgery = await this.prisma.surgery.update({
      where: { id },
      data: {
        surgeryDate: newSurgeryDate,
        roomBookingStart: newStartTime || surgery.roomBookingStart,
        roomBookingEnd: newEndTime || surgery.roomBookingEnd,
        notes: reason
          ? `${surgery.notes || ''}\nRescheduled to ${newSurgeryDate}: ${reason}`.trim()
          : surgery.notes,
      },
      include: {
        patient: true,
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        anesthesiologist: {
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

    // Update operating room booking if it exists
    if (surgery.operatingRoomBookings?.length > 0) {
      await this.prisma.operatingRoomBooking.update({
        where: { id: surgery.operatingRoomBookings[0].id },
        data: {
          bookingDate: newSurgeryDate,
          startTime: newStartTime || surgery.roomBookingStart || undefined,
          endTime: newEndTime || surgery.roomBookingEnd || undefined,
        },
      });
    }

    return rescheduledSurgery;
  }

  // Enhanced Surgery Management Methods
  async addSurgicalProcedure(
    surgeryId: string,
    createSurgicalProcedureDto: CreateSurgicalProcedureDto,
  ) {
    const surgery = await this.findSurgeryById(surgeryId);

    if (surgery.status !== 'SCHEDULED') {
      throw new ConflictException(
        'Cannot add procedures to a non-scheduled surgery',
      );
    }

    const procedure = await this.prisma.surgicalProcedure.create({
      data: {
        ...createSurgicalProcedureDto,
        surgeryId,
      },
    });

    // Update surgery total amount
    const updatedSurgery = await this.prisma.surgery.update({
      where: { id: surgeryId },
      data: {
        totalAmount: {
          increment: createSurgicalProcedureDto.cost,
        },
        balance: {
          increment: createSurgicalProcedureDto.cost,
        },
      },
    });

    return {
      procedure,
      updatedSurgery,
      message: `Surgical procedure added successfully. New total amount: $${Number(updatedSurgery.totalAmount)}`,
    };
  }

  async bookOperatingRoom(
    surgeryId: string,
    createOperatingRoomBookingDto: CreateOperatingRoomBookingDto,
  ) {
    const surgery = await this.findSurgeryById(surgeryId);

    if (surgery.status !== 'SCHEDULED') {
      throw new ConflictException(
        'Cannot book operating room for a non-scheduled surgery',
      );
    }

    // Check for room availability
    const conflictingBooking = await this.prisma.operatingRoomBooking.findFirst(
      {
        where: {
          roomNumber: createOperatingRoomBookingDto.roomNumber,
          bookingDate: createOperatingRoomBookingDto.bookingDate,
          OR: [
            {
              startTime: {
                lt: createOperatingRoomBookingDto.endTime,
                gt: createOperatingRoomBookingDto.startTime,
              },
            },
            {
              endTime: {
                gt: createOperatingRoomBookingDto.startTime,
                lt: createOperatingRoomBookingDto.endTime,
              },
            },
          ],
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      },
    );

    if (conflictingBooking) {
      throw new ConflictException(
        'Operating room is not available for the specified time slot',
      );
    }

    const roomBooking = await this.prisma.operatingRoomBooking.create({
      data: {
        ...createOperatingRoomBookingDto,
        surgeryId,
      },
    });

    // Update surgery with room booking details
    const updatedSurgery = await this.prisma.surgery.update({
      where: { id: surgeryId },
      data: {
        roomBookingStart: createOperatingRoomBookingDto.startTime,
        roomBookingEnd: createOperatingRoomBookingDto.endTime,
        roomBookingStatus: 'CONFIRMED',
      },
    });

    return {
      roomBooking,
      updatedSurgery,
      message: 'Operating room booked successfully',
    };
  }

  async startSurgery(surgeryId: string) {
    const surgery = await this.findSurgeryById(surgeryId);

    if (surgery.status !== 'SCHEDULED') {
      throw new ConflictException('Surgery is not in scheduled status');
    }

    // Check if operating room is booked
    if (!surgery.roomBookingStart || !surgery.roomBookingEnd) {
      throw new ForbiddenException(
        'Operating room must be booked before starting surgery',
      );
    }

    // Check if invoice is paid
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: surgery.patientId,
        notes: {
          contains: `Surgery ${surgeryId}`,
        },
      },
    });

    if (!invoice) {
      throw new ForbiddenException(
        'No invoice found for this surgery. Payment must be processed first.',
      );
    }

    if (invoice.status !== 'PAID') {
      throw new ForbiddenException(
        `Invoice ${invoice.invoiceNumber} must be fully paid before surgery can start. Current balance: $${Number(invoice.balance)}`,
      );
    }

    const updatedSurgery = await this.prisma.surgery.update({
      where: { id: surgeryId },
      data: { status: 'IN_PROGRESS' },
      include: {
        patient: true,
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        anesthesiologist: {
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

    return updatedSurgery;
  }

  async completeSurgery(surgeryId: string, notes?: string) {
    const surgery = await this.findSurgeryById(surgeryId);

    if (surgery.status !== 'IN_PROGRESS') {
      throw new ConflictException('Surgery is not in progress');
    }

    const updatedSurgery = await this.prisma.surgery.update({
      where: { id: surgeryId },
      data: {
        status: 'COMPLETED',
        notes: notes
          ? `${surgery.notes || ''}\nCompleted: ${notes}`.trim()
          : surgery.notes,
      },
      include: {
        patient: true,
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        anesthesiologist: {
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

    // If inpatient stay is required, create admission
    if (surgery.requiresInpatient && surgery.wardId) {
      const admission = await this.prisma.admission.create({
        data: {
          patientId: surgery.patientId,
          doctorId: surgery.surgeonId,
          wardId: surgery.wardId,
          admissionDate: new Date(),
          wardType: 'GENERAL', // Default, can be enhanced
          status: 'ADMITTED',
          depositAmount: 0, // Will be calculated based on ward charges
          notes: `Post-surgery admission for ${surgery.surgeryType}`,
        },
      });

      // Update surgery with admission link
      await this.prisma.surgery.update({
        where: { id: surgeryId },
        data: { admissionId: admission.id },
      });
    }

    return updatedSurgery;
  }

  async getOperatingRoomSchedule(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await this.prisma.operatingRoomBooking.findMany({
      where: {
        bookingDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        surgery: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                patientId: true,
              },
            },
            surgeon: {
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
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return bookings;
  }

  async getSurgeryBillingDetails(surgeryId: string) {
    const surgery = await this.findSurgeryById(surgeryId);

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: surgery.patientId,
        notes: {
          contains: `Surgery ${surgeryId}`,
        },
      },
      include: {
        charges: true,
        payments: true,
      },
    });

    return {
      surgery,
      invoice,
      billingSummary: {
        surgeryFee: Number(surgery.surgeryFee),
        anesthesiaFee: Number(surgery.anesthesiaFee),
        pacuCharges: Number(surgery.pacuCharges),
        totalAmount: Number(surgery.totalAmount),
        paidAmount: Number(surgery.paidAmount),
        balance: Number(surgery.balance),
      },
    };
  }

  // Legacy methods for backward compatibility
  async getSurgeryBillingSummary(surgeryId: string) {
    const surgery = await this.findSurgeryById(surgeryId);

    return {
      surgeryId: surgery.id,
      patientId: surgery.patientId,
      surgeryType: surgery.surgeryType,
      status: surgery.status,
      totalCost: Number(surgery.totalAmount),
      totalProcedures: surgery.surgicalProcedures?.length || 0,
      summary: 'Surgery billing summary',
    };
  }

  async getPatientSurgeryHistory(patientId: string) {
    const surgeries = await this.prisma.surgery.findMany({
      where: { patientId },
      include: {
        surgeon: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        anesthesiologist: {
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
      orderBy: { surgeryDate: 'desc' },
    });

    return surgeries;
  }

  async getSurgeryStatistics(startDate: Date, endDate: Date) {
    const surgeries = await this.prisma.surgery.findMany({
      where: {
        surgeryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: true,
        surgeon: {
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

    const totalSurgeries = surgeries.length;
    const completedSurgeries = surgeries.filter(
      (s) => s.status === 'COMPLETED',
    ).length;
    const cancelledSurgeries = surgeries.filter(
      (s) => s.status === 'CANCELLED',
    ).length;
    const inProgressSurgeries = surgeries.filter(
      (s) => s.status === 'IN_PROGRESS',
    ).length;

    // Calculate financial metrics
    const totalRevenue = surgeries.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0,
    );
    const totalCollected = surgeries.reduce(
      (sum, s) => sum + Number(s.paidAmount),
      0,
    );
    const totalOutstanding = surgeries.reduce(
      (sum, s) => sum + Number(s.balance),
      0,
    );

    return {
      period: { startDate, endDate },
      summary: {
        totalSurgeries,
        completedSurgeries,
        cancelledSurgeries,
        inProgressSurgeries,
        completionRate:
          totalSurgeries > 0 ? (completedSurgeries / totalSurgeries) * 100 : 0,
      },
      financialMetrics: {
        totalRevenue,
        totalCollected,
        totalOutstanding,
        collectionRate:
          totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0,
      },
      surgeries,
    };
  }

  // Enhanced method to get surgery performance analytics
  async getSurgeryPerformanceAnalytics(startDate: Date, endDate: Date) {
    const surgeries = await this.prisma.surgery.findMany({
      where: {
        surgeryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: true,
        surgeon: {
          include: {
            user: true,
          },
        },
        anesthesiologist: {
          include: {
            user: true,
          },
        },
      },
    });

    // Group by surgeon
    const surgeonPerformance = surgeries.reduce(
      (acc, surgery) => {
        const surgeonName = `${surgery.surgeon.user.firstName} ${surgery.surgeon.user.lastName}`;

        if (!acc[surgeonName]) {
          acc[surgeonName] = {
            surgeonId: surgery.surgeonId,
            surgeonName,
            totalSurgeries: 0,
            completedSurgeries: 0,
            cancelledSurgeries: 0,
            totalRevenue: 0,
            averageSurgeryFee: 0,
          };
        }

        acc[surgeonName].totalSurgeries++;
        if (surgery.status === 'COMPLETED') {
          acc[surgeonName].completedSurgeries++;
        } else if (surgery.status === 'CANCELLED') {
          acc[surgeonName].cancelledSurgeries++;
        }

        acc[surgeonName].totalRevenue += Number(surgery.totalAmount);

        return acc;
      },
      {} as Record<string, any>,
    );

    // Calculate averages
    Object.values(surgeonPerformance).forEach((surgeon: any) => {
      surgeon.averageSurgeryFee =
        surgeon.totalSurgeries > 0
          ? surgeon.totalRevenue / surgeon.totalSurgeries
          : 0;
      surgeon.completionRate =
        surgeon.totalSurgeries > 0
          ? (surgeon.completedSurgeries / surgeon.totalSurgeries) * 100
          : 0;
    });

    return {
      period: { startDate, endDate },
      surgeonPerformance,
      summary: {
        totalSurgeries: surgeries.length,
        totalRevenue: surgeries.reduce(
          (sum, s) => sum + Number(s.totalAmount),
          0,
        ),
        averageSurgeryFee:
          surgeries.length > 0
            ? surgeries.reduce((sum, s) => sum + Number(s.totalAmount), 0) /
              surgeries.length
            : 0,
      },
    };
  }
}
