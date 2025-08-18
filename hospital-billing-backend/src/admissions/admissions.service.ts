import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionDto } from './dto/update-admission.dto';
import { CreateDailyChargeDto } from './dto/create-daily-charge.dto';

@Injectable()
export class AdmissionsService {
  constructor(private prisma: PrismaService) {}

  // Admission Management
  async createAdmission(createAdmissionDto: CreateAdmissionDto) {
    const { patientId, doctorId, ...admissionData } = createAdmissionDto;

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
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if patient is already admitted
    const existingAdmission = await this.prisma.admission.findFirst({
      where: {
        patientId,
        status: { in: ['ADMITTED', 'TRANSFERRED'] },
      },
    });

    if (existingAdmission) {
      throw new BadRequestException('Patient is already admitted');
    }

    // Check if ward exists and has available beds
    if (admissionData.wardId) {
      const ward = await this.prisma.ward.findUnique({
        where: { id: admissionData.wardId },
        include: { beds: true },
      });

      if (!ward) {
        throw new NotFoundException('Ward not found');
      }

      const availableBeds = ward.beds.filter(
        (bed) => !bed.isOccupied && bed.isActive,
      );
      if (availableBeds.length === 0) {
        throw new BadRequestException('No available beds in the selected ward');
      }
    }

    // Create admission with required fields
    const admission = await this.prisma.admission.create({
      data: {
        patientId,
        doctorId,
        wardId: admissionData.wardId,
        status: 'ADMITTED',
        wardType: admissionData.wardType || 'GENERAL',
        depositAmount: admissionData.depositAmount || 0,
        notes: admissionData.notes,
        admissionDate: new Date(),
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
        ward: true,
      },
    });

    // Create initial invoice for admission deposit and basic charges
    const initialInvoice = await this.createAdmissionInvoice(
      admission.id,
      admissionData.depositAmount || 0,
    );

    // Update admission with invoice reference
    const updatedAdmission = await this.prisma.admission.update({
      where: { id: admission.id },
      data: {
        notes:
          `${admission.notes || ''}\nInitial invoice created: ${initialInvoice.invoice.invoiceNumber}`.trim(),
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
        ward: true,
      },
    });

    return {
      admission: updatedAdmission,
      invoice: initialInvoice.invoice,
      message: `Admission created successfully. Initial invoice: ${initialInvoice.invoice.invoiceNumber}`,
    };
  }

  // Create invoice for admission
  async createAdmissionInvoice(admissionId: string, depositAmount: number) {
    const admission = await this.findAdmissionById(admissionId);

    // Check if invoice already exists
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: admission.patientId,
        notes: {
          contains: `Admission ${admissionId}`,
        },
      },
    });

    if (existingInvoice) {
      throw new ConflictException('Invoice already exists for this admission');
    }

    // Calculate initial charges (admission fee + deposit)
    const admissionFee = 500; // Base admission fee - could be configurable
    const totalAmount = admissionFee + depositAmount;

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: `ADM-INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId: admission.patientId,
        totalAmount,
        balance: totalAmount,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
        notes: `Initial invoice for Admission ${admissionId}`,
      },
    });

    // Create charges for admission components
    const charges: any[] = [];

    // Admission fee charge
    const admissionCharge = await this.prisma.charge.create({
      data: {
        invoiceId: invoice.id,
        serviceId: 'admission-fee', // You might want to create actual services for these
        description: 'Hospital Admission Fee',
        quantity: 1,
        unitPrice: admissionFee,
        totalPrice: admissionFee,
      },
    });
    charges.push(admissionCharge);

    // Deposit charge if provided
    if (depositAmount > 0) {
      const depositCharge = await this.prisma.charge.create({
        data: {
          invoiceId: invoice.id,
          serviceId: 'deposit',
          description: 'Admission Deposit',
          quantity: 1,
          unitPrice: depositAmount,
          totalPrice: depositAmount,
        },
      });
      charges.push(depositCharge);
    }

    return {
      invoice,
      charges,
    };
  }

  // Add charge to admission invoice
  async addChargeToAdmissionInvoice(admissionId: string, dailyCharge: any) {
    const admission = await this.findAdmissionById(admissionId);

    // Find existing invoice for this admission
    let invoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: admission.patientId,
        notes: {
          contains: `Admission ${admissionId}`,
        },
      },
    });

    // If no invoice exists, create one
    if (!invoice) {
      const newInvoice = await this.createAdmissionInvoice(admissionId, 0);
      invoice = newInvoice.invoice;
    }

    // Add the daily charge to the invoice
    const charge = await this.prisma.charge.create({
      data: {
        invoiceId: invoice.id,
        serviceId: dailyCharge.serviceId,
        description: dailyCharge.description,
        quantity: 1,
        unitPrice: dailyCharge.amount,
        totalPrice: dailyCharge.amount,
      },
    });

    // Update invoice total and balance
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        totalAmount: {
          increment: dailyCharge.amount,
        },
        balance: {
          increment: dailyCharge.amount,
        },
      },
    });

    return {
      charge,
      updatedInvoice,
    };
  }

  // Create final discharge invoice
  async createFinalDischargeInvoice(admissionId: string) {
    const admission = await this.findAdmissionById(admissionId);

    // Check if final invoice already exists
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: admission.patientId,
        notes: {
          contains: `Final Discharge ${admissionId}`,
        },
      },
    });

    if (existingInvoice) {
      throw new ConflictException('Final discharge invoice already exists');
    }

    // Calculate total charges for the admission
    const totalCharges = admission.dailyCharges.reduce(
      (sum, charge) => sum + Number(charge.amount),
      0,
    );

    // Create final invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: `DISCH-INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId: admission.patientId,
        totalAmount: totalCharges,
        balance: totalCharges,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        notes: `Final consolidated invoice for Admission ${admissionId} discharge`,
      },
    });

    // Create charges for all daily charges
    const charges: any[] = [];
    for (const dailyCharge of admission.dailyCharges) {
      const charge = await this.prisma.charge.create({
        data: {
          invoiceId: invoice.id,
          serviceId: dailyCharge.serviceId,
          description: dailyCharge.description,
          quantity: 1,
          unitPrice: dailyCharge.amount,
          totalPrice: dailyCharge.amount,
        },
      });
      charges.push(charge);
    }

    return {
      invoice,
      charges,
    };
  }

  async findAllAdmissions(query?: any) {
    const where: any = {};

    if (query?.patientId) {
      where.patientId = query.patientId;
    }

    if (query?.doctorId) {
      where.doctorId = query.doctorId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.wardType) {
      where.wardType = query.wardType;
    }

    if (query?.startDate && query?.endDate) {
      where.admissionDate = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    if (query?.search) {
      where.OR = [
        {
          patient: {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { patientId: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        },
        {
          doctor: {
            user: {
              OR: [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const admissions = await this.prisma.admission.findMany({
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
      orderBy: { admissionDate: 'desc' },
    });

    return admissions;
  }

  async findAdmissionById(id: string) {
    const admission = await this.prisma.admission.findUnique({
      where: { id },
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
        ward: true,
        dailyCharges: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    return admission;
  }

  async updateAdmission(id: string, updateAdmissionDto: any) {
    const admission = await this.findAdmissionById(id);

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    // Update admission
    const updatedAdmission = await this.prisma.admission.update({
      where: { id },
      data: updateAdmissionDto,
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
        ward: true,
        dailyCharges: {
          include: {
            service: true,
          },
        },
      },
    });

    return updatedAdmission;
  }

  async dischargePatient(id: string, dischargeData: any) {
    const admission = await this.findAdmissionById(id);
    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    if (admission.status === 'DISCHARGED') {
      throw new BadRequestException('Patient is already discharged');
    }

    // Check if all outstanding balances are paid before discharge
    const outstandingInvoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: admission.patientId,
        status: { in: ['PENDING', 'OVERDUE'] },
        balance: { gt: 0 },
      },
    });

    if (outstandingInvoice) {
      throw new ForbiddenException(
        `Cannot discharge patient. Outstanding balance of $${Number(outstandingInvoice.balance)} on invoice ${outstandingInvoice.invoiceNumber}. Payment required before discharge.`,
      );
    }

    // Create final consolidated invoice for any remaining charges
    const finalInvoice = await this.createFinalDischargeInvoice(admission.id);

    const updatedAdmission = await this.prisma.admission.update({
      where: { id },
      data: {
        status: 'DISCHARGED',
        dischargeDate: new Date(),
        notes:
          `${dischargeData.notes || admission.notes || ''}\nFinal invoice created: ${finalInvoice.invoice.invoiceNumber}`.trim(),
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
        ward: true,
        dailyCharges: {
          include: {
            service: true,
          },
        },
      },
    });

    return {
      admission: updatedAdmission,
      finalInvoice: finalInvoice.invoice,
      message: `Patient discharged successfully. Final invoice: ${finalInvoice.invoice.invoiceNumber}`,
    };
  }

  // Check payment status before allowing services
  async checkPaymentStatusBeforeService(admissionId: string) {
    const admission = await this.findAdmissionById(admissionId);

    if (admission.status !== 'ADMITTED') {
      throw new ConflictException('Admission is not active');
    }

    // Check for outstanding balances
    const outstandingInvoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: admission.patientId,
        status: { in: ['PENDING', 'OVERDUE'] },
        balance: { gt: 0 },
      },
    });

    if (outstandingInvoice) {
      return {
        canProceed: false,
        outstandingBalance: Number(outstandingInvoice.balance),
        invoiceNumber: outstandingInvoice.invoiceNumber,
        message: `Payment required before additional services. Outstanding balance: $${Number(outstandingInvoice.balance)}`,
      };
    }

    return {
      canProceed: true,
      message: 'Payment status verified. Services can proceed.',
    };
  }

  // Daily Charges Management
  async addDailyCharge(admissionId: string, createDailyChargeDto: any) {
    const admission = await this.findAdmissionById(admissionId);

    if (admission.status !== 'ADMITTED') {
      throw new ConflictException(
        'Cannot add charges to a non-active admission',
      );
    }

    // Check if charge already exists for this date and service
    const existingCharge = await this.prisma.dailyCharge.findFirst({
      where: {
        admissionId,
        serviceId: createDailyChargeDto.serviceId,
        chargeDate: createDailyChargeDto.chargeDate,
      },
    });

    if (existingCharge) {
      throw new ConflictException(
        'Daily charge already exists for this service and date',
      );
    }

    // Check if patient has outstanding balance that needs to be paid first
    const outstandingInvoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: admission.patientId,
        status: { in: ['PENDING', 'OVERDUE'] },
        balance: { gt: 0 },
      },
    });

    if (outstandingInvoice) {
      throw new ForbiddenException(
        `Cannot add new charges. Patient has outstanding balance of $${Number(outstandingInvoice.balance)} on invoice ${outstandingInvoice.invoiceNumber}. Payment required before additional services.`,
      );
    }

    // Create daily charge
    const dailyCharge = await this.prisma.dailyCharge.create({
      data: {
        admissionId,
        serviceId: createDailyChargeDto.serviceId,
        amount: createDailyChargeDto.amount,
        chargeDate: createDailyChargeDto.chargeDate,
        description: createDailyChargeDto.description,
      },
      include: {
        service: true,
      },
    });

    // Add charge to existing invoice or create new one
    await this.addChargeToAdmissionInvoice(admissionId, dailyCharge);

    return dailyCharge;
  }

  async updateDailyCharge(id: string, updateDailyChargeDto: any) {
    const charge = await this.prisma.dailyCharge.findUnique({
      where: { id },
      include: {
        service: true,
      },
    });

    if (!charge) {
      throw new NotFoundException('Daily charge not found');
    }

    // Update daily charge
    const updatedCharge = await this.prisma.dailyCharge.update({
      where: { id },
      data: {
        amount: updateDailyChargeDto.amount,
        description: updateDailyChargeDto.description,
      },
      include: {
        service: true,
      },
    });

    return updatedCharge;
  }

  async deleteDailyCharge(id: string) {
    const charge = await this.prisma.dailyCharge.findUnique({
      where: { id },
    });

    if (!charge) {
      throw new NotFoundException('Daily charge not found');
    }

    await this.prisma.dailyCharge.delete({
      where: { id },
    });

    return { message: 'Daily charge deleted successfully' };
  }

  // Ward Management
  async createWard(createWardDto: any) {
    const ward = await this.prisma.ward.create({
      data: createWardDto,
    });

    return ward;
  }

  async findAllWards() {
    return await this.prisma.ward.findMany({
      where: { isActive: true },
      include: {
        beds: true,
        admissions: {
          where: { status: 'ADMITTED' },
        },
      },
    });
  }

  async getWardStatistics(wardId: string) {
    const ward = await this.prisma.ward.findUnique({
      where: { id: wardId },
      include: {
        beds: true,
        admissions: {
          where: { status: 'ADMITTED' },
        },
      },
    });

    if (!ward) {
      throw new NotFoundException('Ward not found');
    }

    const totalBeds = ward.beds.length;
    const occupiedBeds = ward.beds.filter((bed) => bed.isOccupied).length;
    const activeAdmissions = ward.admissions.length;
    const availableBeds = totalBeds - occupiedBeds;

    return {
      wardId: ward.id,
      wardName: ward.name,
      totalBeds,
      occupiedBeds,
      availableBeds,
      activeAdmissions,
      occupancyRate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
    };
  }

  // Billing and Financial Management
  async getAdmissionBillingSummary(admissionId: string) {
    const admission = await this.findAdmissionById(admissionId);

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    // Get all invoices related to this admission
    const invoices = await this.prisma.invoice.findMany({
      where: {
        patientId: admission.patientId,
        OR: [
          { notes: { contains: `Admission ${admissionId}` } },
          { notes: { contains: `Final Discharge ${admissionId}` } },
        ],
      },
      include: {
        charges: true,
        payments: true,
      },
    });

    // Calculate total charges
    const totalCharges = admission.dailyCharges.reduce(
      (sum, charge) => sum + Number(charge.amount),
      0,
    );

    // Calculate total from invoices
    const totalInvoiceAmount = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount),
      0,
    );

    // Calculate total payments
    const totalPayments = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.paidAmount),
      0,
    );

    // Calculate total balance
    const totalBalance = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.balance),
      0,
    );

    // Calculate length of stay
    const admissionDate = new Date(admission.admissionDate);
    const dischargeDate = admission.dischargeDate
      ? new Date(admission.dischargeDate)
      : new Date();
    const lengthOfStay = Math.ceil(
      (dischargeDate.getTime() - admissionDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      admissionId: admission.id,
      patientName: `${admission.patient.firstName} ${admission.patient.lastName}`,
      admissionDate: admission.admissionDate,
      dischargeDate: admission.dischargeDate,
      lengthOfStay,
      totalCharges,
      depositAmount: Number(admission.depositAmount),
      totalInvoiceAmount,
      totalPayments,
      totalBalance,
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        balance: Number(invoice.balance),
        status: invoice.status,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
      })),
      dailyCharges: admission.dailyCharges.map((charge) => ({
        id: charge.id,
        serviceName: charge.service.name,
        amount: Number(charge.amount),
        chargeDate: charge.chargeDate,
        isPaid: false, // Daily charges are not directly paid, they go to invoices
      })),
    };
  }

  async getPatientAdmissionHistory(patientId: string) {
    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const admissions = await this.prisma.admission.findMany({
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
        ward: true,

        dailyCharges: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { admissionDate: 'desc' },
    });

    const totalAdmissions = admissions.length;
    const activeAdmissions = admissions.filter(
      (a) => a.status === 'ADMITTED',
    ).length;
    const totalLengthOfStay = admissions.reduce((sum, a) => {
      const admissionDate = new Date(a.admissionDate);
      const dischargeDate = a.dischargeDate
        ? new Date(a.dischargeDate)
        : new Date();
      const lengthOfStay = Math.ceil(
        (dischargeDate.getTime() - admissionDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return sum + lengthOfStay;
    }, 0);

    return {
      admissions,
      summary: {
        totalAdmissions,
        activeAdmissions,
        totalLengthOfStay,
        averageLengthOfStay:
          totalAdmissions > 0 ? totalLengthOfStay / totalAdmissions : 0,
      },
    };
  }

  async getAdmissionStatistics(startDate: Date, endDate: Date) {
    const admissions = await this.prisma.admission.findMany({
      where: {
        admissionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: {
          select: {
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
        ward: true,
        dailyCharges: {
          include: {
            service: true,
          },
        },
      },
    });

    const totalAdmissions = admissions.length;
    const activeAdmissions = admissions.filter(
      (a) => a.status === 'ADMITTED',
    ).length;

    // Calculate total length of stay for all admissions
    const totalLengthOfStay = admissions.reduce((sum, a) => {
      const admissionDate = new Date(a.admissionDate);
      const dischargeDate = a.dischargeDate
        ? new Date(a.dischargeDate)
        : new Date();
      const lengthOfStay = Math.ceil(
        (dischargeDate.getTime() - admissionDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return sum + lengthOfStay;
    }, 0);

    const averageLengthOfStay =
      totalAdmissions > 0 ? totalLengthOfStay / totalAdmissions : 0;

    return {
      period: { startDate, endDate },
      totalAdmissions,
      activeAdmissions,
      dischargedAdmissions: totalAdmissions - activeAdmissions,
      averageLengthOfStay,
      totalLengthOfStay,
    };
  }

  async getActiveAdmissions() {
    return await this.prisma.admission.findMany({
      where: { status: 'ADMITTED' },
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
        ward: true,
        dailyCharges: {
          include: {
            service: true,
          },
        },
      },
    });
  }
}
