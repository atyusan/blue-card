import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { UserPermissionsService } from '../users/user-permissions.service';

@Injectable()
export class ConsultationsService {
  constructor(
    private prisma: PrismaService,
    private userPermissionsService: UserPermissionsService,
  ) {}

  async create(createConsultationDto: CreateConsultationDto) {
    const { patientId, doctorId, ...consultationData } = createConsultationDto;

    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Check if doctor exists
    const doctor = await this.prisma.staffMember.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if doctor has required permissions
    const hasPermission = await this.userPermissionsService.hasAnyPermission(
      doctor.userId,
      ['conduct_consultations', 'admin'],
    );

    if (!hasPermission) {
      throw new ForbiddenException('Doctor not authorized for consultations');
    }

    // Check for appointment conflicts
    const conflictingAppointment = await this.prisma.consultation.findFirst({
      where: {
        doctorId,
        appointmentDate: consultationData.appointmentDate,
        isCompleted: false,
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException(
        'Doctor has another appointment at this time',
      );
    }

    // Calculate consultation fee based on type
    const consultationFee =
      consultationData.consultationFee ||
      this.getConsultationFee(consultationData.consultationType);
    const totalAmount = consultationFee;

    // Create consultation
    const consultation = await this.prisma.consultation.create({
      data: {
        ...consultationData,
        patientId,
        doctorId,
        consultationFee,
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
        doctor: {
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

    // Create invoice for the consultation
    const invoice = await this.createConsultationInvoice(
      consultation.id,
      totalAmount,
    );

    return {
      consultation,
      invoice,
      message: `Consultation scheduled successfully. Fee: $${consultationFee}. Invoice: ${invoice.invoice.invoiceNumber}`,
    };
  }

  // Create invoice for consultation
  async createConsultationInvoice(consultationId: string, totalAmount: number) {
    const consultation = await this.findById(consultationId);

    // Check if invoice already exists
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: consultation.patientId,
        notes: {
          contains: `Consultation ${consultationId}`,
        },
      },
    });

    if (existingInvoice) {
      throw new ConflictException(
        'Invoice already exists for this consultation',
      );
    }

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: `CONS-INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId: consultation.patientId,
        totalAmount,
        balance: totalAmount,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
        notes: `Invoice for Consultation ${consultationId}`,
      },
    });

    // Create charge for consultation
    const charge = await this.prisma.charge.create({
      data: {
        invoiceId: invoice.id,
        serviceId: 'consultation-fee', // You might want to create actual services for these
        description: `${consultation.consultationType} Consultation Fee`,
        quantity: 1,
        unitPrice: consultation.consultationFee,
        totalPrice: consultation.consultationFee,
      },
    });

    // Update consultation with invoice reference
    const updatedConsultation = await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        notes:
          `${consultation.notes || ''}\nInvoice created: ${invoice.invoiceNumber}`.trim(),
      },
    });

    return {
      invoice,
      charge,
      consultation: updatedConsultation,
    };
  }

  // Get consultation fee based on type
  private getConsultationFee(consultationType: string): number {
    const feeStructure = {
      GENERAL: 50.0,
      SPECIALIST: 100.0,
      FOLLOW_UP: 30.0,
      EMERGENCY: 150.0,
    };
    return feeStructure[consultationType] || 50.0;
  }

  async findAll(query?: {
    patientId?: string;
    doctorId?: string;
    consultationType?: string;
    isCompleted?: boolean;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    const where: any = {};

    if (query?.patientId) {
      where.patientId = query.patientId;
    }

    if (query?.doctorId) {
      where.doctorId = query.doctorId;
    }

    if (query?.consultationType) {
      where.consultationType = query.consultationType;
    }

    if (query?.isCompleted !== undefined) {
      where.isCompleted = query.isCompleted;
    }

    if (query?.startDate || query?.endDate) {
      where.appointmentDate = {};
      if (query.startDate) where.appointmentDate.gte = query.startDate;
      if (query.endDate) where.appointmentDate.lte = query.endDate;
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
          doctor: {
            user: {
              firstName: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
        {
          doctor: {
            user: { lastName: { contains: query.search, mode: 'insensitive' } },
          },
        },
      ];
    }

    return this.prisma.consultation.findMany({
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
        doctor: {
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
      orderBy: { appointmentDate: 'desc' },
    });
  }

  async findById(id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            account: true,
          },
        },
        doctor: {
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
      },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    return consultation;
  }

  async update(id: string, updateConsultationDto: UpdateConsultationDto) {
    await this.findById(id);

    const consultation = await this.prisma.consultation.update({
      where: { id },
      data: updateConsultationDto,
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
        doctor: {
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

    return consultation;
  }

  async completeConsultation(
    id: string,
    completionData: {
      diagnosis?: string;
      treatment?: string;
      notes?: string;
    },
  ) {
    const consultation = await this.findById(id);

    if (consultation.isCompleted) {
      throw new ConflictException('Consultation is already completed');
    }

    // Check payment status before completing consultation
    const paymentStatus = await this.checkPaymentStatusBeforeService(id);
    if (!paymentStatus.canProceed) {
      throw new ForbiddenException(paymentStatus.message);
    }

    const updatedConsultation = await this.prisma.consultation.update({
      where: { id },
      data: {
        ...completionData,
        isCompleted: true,
        isPaid: true,
        paidAmount: consultation.totalAmount,
        balance: 0,
      },
      include: {
        patient: {
          include: {
            account: true,
          },
        },
        doctor: {
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

    return updatedConsultation;
  }

  async cancelConsultation(id: string, reason?: string) {
    const consultation = await this.findById(id);

    if (consultation.isCompleted) {
      throw new ConflictException('Cannot cancel a completed consultation');
    }

    const cancelledConsultation = await this.prisma.consultation.update({
      where: { id },
      data: {
        notes: reason
          ? `${consultation.notes || ''}\nCancelled: ${reason}`.trim()
          : consultation.notes,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
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

    return cancelledConsultation;
  }

  async getDoctorSchedule(doctorId: string, date: Date) {
    // Check if doctor exists
    const doctor = await this.prisma.staffMember.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const consultations = await this.prisma.consultation.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { appointmentDate: 'asc' },
    });

    return consultations;
  }

  async getPatientConsultationHistory(patientId: string) {
    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const consultations = await this.prisma.consultation.findMany({
      where: { patientId },
      include: {
        doctor: {
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
      orderBy: { appointmentDate: 'desc' },
    });

    return consultations;
  }

  // Check payment status before allowing service completion
  async checkPaymentStatusBeforeService(consultationId: string) {
    const consultation = await this.findById(consultationId);

    if (consultation.isCompleted) {
      throw new ConflictException('Consultation is already completed');
    }

    // Check if consultation is already paid
    if (consultation.isPaid) {
      return {
        canProceed: true,
        message: 'Payment already completed. Service can proceed.',
      };
    }

    // Check for outstanding balance
    if (Number(consultation.balance) > 0) {
      return {
        canProceed: false,
        outstandingBalance: Number(consultation.balance),
        message: `Payment required before consultation completion. Outstanding balance: $${Number(consultation.balance)}`,
      };
    }

    return {
      canProceed: true,
      message: 'Payment status verified. Service can proceed.',
    };
  }

  // Get consultation billing details
  async getConsultationBillingDetails(consultationId: string) {
    const consultation = await this.findById(consultationId);

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: consultation.patientId,
        notes: {
          contains: `Consultation ${consultationId}`,
        },
      },
      include: {
        charges: true,
        payments: true,
      },
    });

    return {
      consultation,
      invoice,
      billingSummary: {
        consultationFee: Number(consultation.consultationFee),
        totalAmount: Number(consultation.totalAmount),
        paidAmount: Number(consultation.paidAmount),
        balance: Number(consultation.balance),
        isPaid: consultation.isPaid,
      },
    };
  }
}
