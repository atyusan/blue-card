import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BillingService } from '../billing/billing.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { InvoiceStatus } from '../billing/dto/create-invoice.dto';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
  ) {}

  async create(createPatientDto: CreatePatientDto) {
    // Generate unique patient ID
    const patientId = await this.generatePatientId();

    // Check if patient with same email or phone already exists
    if (createPatientDto.email || createPatientDto.phoneNumber) {
      const existingPatient = await this.prisma.patient.findFirst({
        where: {
          OR: [
            ...(createPatientDto.email
              ? [{ email: createPatientDto.email }]
              : []),
            ...(createPatientDto.phoneNumber
              ? [{ phoneNumber: createPatientDto.phoneNumber }]
              : []),
          ],
        },
      });

      if (existingPatient) {
        throw new ConflictException(
          'Patient with this email or phone number already exists',
        );
      }
    }

    // Create user record for the patient if email is provided
    let userId: string | undefined;
    if (createPatientDto.email) {
      const username = await this.generateUniqueUsername(
        createPatientDto.firstName,
        createPatientDto.lastName,
      );
      const tempPassword = this.generateTempPassword();

      const user = await this.prisma.user.create({
        data: {
          email: createPatientDto.email,
          username,
          password: tempPassword, // This should be hashed in production
          firstName: createPatientDto.firstName,
          lastName: createPatientDto.lastName,
          // role field removed - now handled through StaffRoleAssignment
          isActive: true,
        },
      });
      userId = user.id;
    }

    // Transform the DTO to match the new database structure
    const patientData: any = {
      patientId,
      firstName: createPatientDto.firstName,
      lastName: createPatientDto.lastName,
      dateOfBirth: new Date(createPatientDto.dateOfBirth),
      gender: createPatientDto.gender,
      phoneNumber: createPatientDto.phoneNumber,
      email: createPatientDto.email,
      address: createPatientDto.address,
      emergencyContactName: createPatientDto.emergencyContact.name,
      emergencyContactRelationship:
        createPatientDto.emergencyContact.relationship,
      emergencyContactPhone: createPatientDto.emergencyContact.phoneNumber,
      bloodGroup: this.mapBloodGroupToEnum(
        createPatientDto.medicalHistory?.bloodGroup,
      ),
      allergies: createPatientDto.medicalHistory?.allergies,
      genotype: createPatientDto.medicalHistory?.genotype,
      height: createPatientDto.medicalHistory?.height,
      insuranceProvider: createPatientDto.insurance?.provider,
      insurancePolicyNumber: createPatientDto.insurance?.policyNumber,
      insuranceGroupNumber: createPatientDto.insurance?.groupNumber,
    };

    // Only add userId if it exists
    if (userId) {
      patientData.userId = userId;
    }

    const patient = await this.prisma.patient.create({
      data: patientData,
      include: {
        account: true,
        user: true,
      },
    });

    // Create patient account
    await this.prisma.patientAccount.create({
      data: {
        patientId: patient.id,
        accountNumber: await this.generateAccountNumber(),
        balance: 0,
      },
    });

    // Create Patient Medical Card invoice automatically
    await this.createPatientMedicalCardInvoice(patient.id);

    return this.findById(patient.id);
  }

  async findAll(query?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: any = {};

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { patientId: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Handle pagination
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    // Handle sorting
    let orderBy: any = { createdAt: 'desc' };
    if (query?.sortBy) {
      const validSortFields = [
        'firstName',
        'lastName',
        'patientId',
        'email',
        'phoneNumber',
        'createdAt',
        'updatedAt',
      ];
      if (validSortFields.includes(query.sortBy)) {
        orderBy = { [query.sortBy]: query.sortOrder || 'asc' };
      }
    }

    // Get total count for pagination
    const total = await this.prisma.patient.count({ where });

    const patients = await this.prisma.patient.findMany({
      where,
      include: {
        account: true,
        consultations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        labOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        prescriptions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    return {
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        account: true,
        user: true,
        consultations: {
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
          orderBy: { createdAt: 'desc' },
        },
        labOrders: {
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
            tests: {
              include: {
                service: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        prescriptions: {
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
            medications: {
              include: {
                medication: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        surgeries: {
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
          },
          orderBy: { createdAt: 'desc' },
        },
        admissions: {
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
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: {
            charges: {
              include: {
                service: true,
              },
            },
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async findByIdForEdit(id: string) {
    const patient = await this.findById(id);

    // Transform the database structure to frontend format for editing
    return this.transformPatientForFrontend(patient);
  }

  async findByPatientId(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    // Check if patient exists
    await this.findById(id);

    // Check for conflicts if updating email or phone
    if (updatePatientDto.email || updatePatientDto.phoneNumber) {
      const existingPatient = await this.prisma.patient.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(updatePatientDto.email
                  ? [{ email: updatePatientDto.email }]
                  : []),
                ...(updatePatientDto.phoneNumber
                  ? [{ phoneNumber: updatePatientDto.phoneNumber }]
                  : []),
              ],
            },
          ],
        },
      });

      if (existingPatient) {
        throw new ConflictException(
          'Patient with this email or phone number already exists',
        );
      }
    }

    // Transform the DTO to match the database structure
    const updateData: any = { ...updatePatientDto };

    // Handle emergency contact fields
    if (updatePatientDto.emergencyContact) {
      updateData.emergencyContactName = updatePatientDto.emergencyContact.name;
      updateData.emergencyContactRelationship =
        updatePatientDto.emergencyContact.relationship;
      updateData.emergencyContactPhone =
        updatePatientDto.emergencyContact.phoneNumber;
      delete updateData.emergencyContact;
    }

    // Handle medical history fields
    if (updatePatientDto.medicalHistory) {
      updateData.bloodGroup = this.mapBloodGroupToEnum(
        updatePatientDto.medicalHistory.bloodGroup,
      );
      updateData.allergies = updatePatientDto.medicalHistory.allergies;
      updateData.genotype = updatePatientDto.medicalHistory.genotype;
      updateData.height = updatePatientDto.medicalHistory.height;
      delete updateData.medicalHistory;
    }

    // Handle insurance fields
    if (updatePatientDto.insurance) {
      updateData.insuranceProvider = updatePatientDto.insurance.provider;
      updateData.insurancePolicyNumber =
        updatePatientDto.insurance.policyNumber;
      updateData.insuranceGroupNumber = updatePatientDto.insurance.groupNumber;
      delete updateData.insurance;
    }

    const patient = await this.prisma.patient.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        user: true,
      },
    });

    return patient;
  }

  async remove(id: string) {
    // Check if patient exists
    await this.findById(id);

    // Soft delete - mark as inactive
    await this.prisma.patient.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Patient deactivated successfully' };
  }

  async getAccountBalance(patientId: string) {
    const patient = await this.findById(patientId);
    return patient.account;
  }

  async updateAccountBalance(patientId: string, amount: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { account: true, user: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (!patient.account) {
      // Create account if it doesn't exist
      const accountNumber = `ACC${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      await this.prisma.patientAccount.create({
        data: {
          patientId,
          accountNumber,
          balance: amount,
        },
      });
      return;
    }

    const newBalance = Number(patient.account.balance) + amount;

    await this.prisma.patientAccount.update({
      where: { id: patient.account.id },
      data: { balance: newBalance },
    });
  }

  private async generatePatientId(): Promise<string> {
    const prefix = 'P';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Get count of patients created this month
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const count = await this.prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}${year}${month}${sequence}`;
  }

  private async generateAccountNumber(): Promise<string> {
    const prefix = 'ACC';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Get count of accounts created this month
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const count = await this.prisma.patientAccount.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}${year}${month}${sequence}`;
  }

  // Helper Methods for Enhanced Patient Management
  async getPatientFinancialSummary(patientId: string) {
    const patient = await this.findById(patientId);

    // Get all invoices for the patient
    const invoices = await this.prisma.invoice.findMany({
      where: { patientId },
      include: {
        charges: {
          include: {
            service: true,
          },
        },
        payments: {
          orderBy: { processedAt: 'desc' },
        },
      },
      orderBy: { issuedDate: 'desc' },
    });

    // Calculate financial summary
    const totalInvoiced = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );
    const totalPaid = invoices.reduce(
      (sum, inv) => sum + Number(inv.paidAmount),
      0,
    );
    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + Number(inv.balance),
      0,
    );

    // Group invoices by status
    const invoicesByStatus = {
      DRAFT: invoices.filter((inv) => inv.status === 'DRAFT'),
      PENDING: invoices.filter((inv) => inv.status === 'PENDING'),
      PARTIAL: invoices.filter((inv) => inv.status === 'PARTIAL'),
      PAID: invoices.filter((inv) => inv.status === 'PAID'),
      OVERDUE: invoices.filter((inv) => inv.status === 'OVERDUE'),
      CANCELLED: invoices.filter((inv) => inv.status === 'CANCELLED'),
    };

    // Get recent payment activity
    const recentPayments = await this.prisma.payment.findMany({
      where: { patientId },
      include: {
        invoice: true,
      },
      orderBy: { processedAt: 'desc' },
      take: 10,
    });

    return {
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        accountBalance: Number(patient.account?.balance || 0),
      },
      financialSummary: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        collectionRate:
          totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
      },
      invoicesByStatus: {
        DRAFT: invoicesByStatus.DRAFT.length,
        PENDING: invoicesByStatus.PENDING.length,
        PARTIAL: invoicesByStatus.PARTIAL.length,
        PAID: invoicesByStatus.PAID.length,
        OVERDUE: invoicesByStatus.OVERDUE.length,
        CANCELLED: invoicesByStatus.CANCELLED.length,
      },
      recentPayments: recentPayments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.method,
        reference: payment.reference,
        processedAt: payment.processedAt,
        invoiceNumber: payment.invoice?.invoiceNumber,
      })),
      outstandingInvoices: invoices
        .filter((inv) => inv.status === 'PENDING' || inv.status === 'PARTIAL')
        .map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          totalAmount: Number(inv.totalAmount),
          balance: Number(inv.balance),
          dueDate: inv.dueDate,
          issuedDate: inv.issuedDate,
        })),
    };
  }

  async getPatientOutstandingBalance(patientId: string) {
    const patient = await this.findById(patientId);

    // Get all outstanding invoices
    const outstandingInvoices = await this.prisma.invoice.findMany({
      where: {
        patientId,
        status: {
          in: ['PENDING', 'PARTIAL'],
        },
      },
      include: {
        charges: {
          include: {
            service: true,
          },
        },
        payments: {
          orderBy: { processedAt: 'desc' },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const totalOutstanding = outstandingInvoices.reduce(
      (sum, inv) => sum + Number(inv.balance),
      0,
    );

    const overdueInvoices = outstandingInvoices.filter(
      (inv) => inv.dueDate && new Date() > inv.dueDate,
    );

    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + Number(inv.balance),
      0,
    );

    return {
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
      outstandingBalance: {
        totalOutstanding,
        totalOverdue,
        invoiceCount: outstandingInvoices.length,
        overdueCount: overdueInvoices.length,
      },
      outstandingInvoices: outstandingInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        totalAmount: Number(inv.totalAmount),
        balance: Number(inv.balance),
        dueDate: inv.dueDate,
        issuedDate: inv.issuedDate,
        isOverdue: inv.dueDate ? new Date() > inv.dueDate : false,
        charges: inv.charges.map((charge) => ({
          id: charge.id,
          description: charge.description,
          quantity: charge.quantity,
          unitPrice: Number(charge.unitPrice),
          totalPrice: Number(charge.totalPrice),
          serviceName: charge.service.name,
        })),
      })),
    };
  }

  async getPatientRecentActivity(patientId: string, days: number = 30) {
    const patient = await this.findById(patientId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get recent consultations
    const recentConsultations = await this.prisma.consultation.findMany({
      where: {
        patientId,
        createdAt: { gte: startDate },
      },
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
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent lab orders
    const recentLabOrders = await this.prisma.labOrder.findMany({
      where: {
        patientId,
        createdAt: { gte: startDate },
      },
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
        tests: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent prescriptions
    const recentPrescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId,
        createdAt: { gte: startDate },
      },
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
        medications: {
          include: {
            medication: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent surgeries
    const recentSurgeries = await this.prisma.surgery.findMany({
      where: {
        patientId,
        createdAt: { gte: startDate },
      },
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
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent admissions
    const recentAdmissions = await this.prisma.admission.findMany({
      where: {
        patientId,
        createdAt: { gte: startDate },
      },
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
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent invoices
    const recentInvoices = await this.prisma.invoice.findMany({
      where: {
        patientId,
        createdAt: { gte: startDate },
      },
      include: {
        charges: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent payments
    const recentPayments = await this.prisma.payment.findMany({
      where: {
        patientId,
        processedAt: { gte: startDate },
      },
      orderBy: { processedAt: 'desc' },
      take: 10,
    });

    return {
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
      period: { startDate, endDate: new Date(), days },
      recentActivity: {
        consultations: recentConsultations.map((cons) => ({
          id: cons.id,
          type: 'consultation',
          date: cons.createdAt,
          doctorName: `${cons.doctor.user.firstName} ${cons.doctor.user.lastName}`,
          consultationType: cons.consultationType,
          isCompleted: cons.isCompleted,
        })),
        labOrders: recentLabOrders.map((order) => ({
          id: order.id,
          type: 'lab_order',
          date: order.createdAt,
          doctorName: `${order.doctor.user.firstName} ${order.doctor.user.lastName}`,
          status: order.status,
          testCount: order.tests.length,
          totalAmount: Number(order.totalAmount),
        })),
        prescriptions: recentPrescriptions.map((pres) => ({
          id: pres.id,
          type: 'prescription',
          date: pres.createdAt,
          doctorName: `${pres.doctor.user.firstName} ${pres.doctor.user.lastName}`,
          status: pres.status,
          medicationCount: pres.medications.length,
          totalAmount: Number(pres.totalAmount),
        })),
        surgeries: recentSurgeries.map((surgery) => ({
          id: surgery.id,
          type: 'surgery',
          date: surgery.createdAt,
          surgeonName: `${surgery.surgeon.user.firstName} ${surgery.surgeon.user.lastName}`,
          surgeryType: surgery.surgeryType,
          status: surgery.status,
          totalAmount: Number(surgery.totalAmount),
        })),
        admissions: recentAdmissions.map((adm) => ({
          id: adm.id,
          type: 'admission',
          date: adm.createdAt,
          doctorName: `${adm.doctor.user.firstName} ${adm.doctor.user.lastName}`,
          wardType: adm.wardType,
          status: adm.status,
        })),
        invoices: recentInvoices.map((inv) => ({
          id: inv.id,
          type: 'invoice',
          date: inv.createdAt,
          invoiceNumber: inv.invoiceNumber,
          totalAmount: Number(inv.totalAmount),
          balance: Number(inv.balance),
          status: inv.status,
          chargeCount: inv.charges.length,
        })),
        payments: recentPayments.map((payment) => ({
          id: payment.id,
          type: 'payment',
          date: payment.processedAt,
          amount: Number(payment.amount),
          method: payment.method,
          reference: payment.reference,
        })),
      },
      summary: {
        totalConsultations: recentConsultations.length,
        totalLabOrders: recentLabOrders.length,
        totalPrescriptions: recentPrescriptions.length,
        totalSurgeries: recentSurgeries.length,
        totalAdmissions: recentAdmissions.length,
        totalInvoices: recentInvoices.length,
        totalPayments: recentPayments.length,
      },
    };
  }

  async createRegistrationInvoice(
    patientId: string,
    registrationFee: number = 50.0,
  ) {
    const patient = await this.findById(patientId);

    // Check if registration invoice already exists
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        patientId,
        notes: {
          contains: 'Registration Fee',
        },
      },
    });

    if (existingInvoice) {
      throw new ConflictException(
        'Registration invoice already exists for this patient',
      );
    }

    // Create registration invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: `REG-INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId,
        totalAmount: registrationFee,
        balance: registrationFee,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
        notes: 'Registration Fee - New Patient',
        status: 'PENDING',
      },
    });

    // Create charge for registration fee
    const charge = await this.prisma.charge.create({
      data: {
        invoiceId: invoice.id,
        serviceId: 'registration-fee', // You might want to create actual services for these
        description: 'Patient Registration Fee',
        quantity: 1,
        unitPrice: registrationFee,
        totalPrice: registrationFee,
      },
    });

    return {
      invoice,
      charge,
      message: `Registration invoice created successfully. Fee: $${registrationFee}. Invoice: ${invoice.invoiceNumber}`,
    };
  }

  async getPatientBillingHistory(
    patientId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const patient = await this.findById(patientId);

    const where: any = { patientId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get invoices with charges and payments
    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        charges: {
          include: {
            service: true,
          },
        },
        payments: {
          orderBy: { processedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get cash transactions
    const cashTransactions = await this.prisma.cashTransaction.findMany({
      where: {
        patientId,
        transactionDate:
          startDate && endDate
            ? {
                gte: startDate,
                lte: endDate,
              }
            : undefined,
      },
      orderBy: { transactionDate: 'desc' },
    });

    // Calculate billing summary
    const totalInvoiced = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );
    const totalPaid = invoices.reduce(
      (sum, inv) => sum + Number(inv.paidAmount),
      0,
    );
    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + Number(inv.balance),
      0,
    );

    // Group by month for trend analysis
    const monthlyData = invoices.reduce((acc, invoice) => {
      const month = invoice.createdAt.toISOString().slice(0, 7); // YYYY-MM format
      if (!acc[month]) {
        acc[month] = {
          month,
          invoices: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalOutstanding: 0,
        };
      }
      acc[month].invoices++;
      acc[month].totalAmount += Number(invoice.totalAmount);
      acc[month].totalPaid += Number(invoice.paidAmount);
      acc[month].totalOutstanding += Number(invoice.balance);
      return acc;
    }, {});

    return {
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
      period: { startDate, endDate },
      billingSummary: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        collectionRate:
          totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
        invoiceCount: invoices.length,
        cashTransactionCount: cashTransactions.length,
      },
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.paidAmount),
        balance: Number(inv.balance),
        status: inv.status,
        issuedDate: inv.issuedDate,
        dueDate: inv.dueDate,
        charges: inv.charges.map((charge) => ({
          id: charge.id,
          description: charge.description,
          quantity: charge.quantity,
          unitPrice: Number(charge.unitPrice),
          totalPrice: Number(charge.totalPrice),
          serviceName: charge.service?.name || 'Unknown Service',
        })),
        payments: inv.payments.map((payment) => ({
          id: payment.id,
          amount: Number(payment.amount),
          method: payment.method,
          reference: payment.reference,
          processedAt: payment.processedAt,
        })),
      })),
      cashTransactions: cashTransactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.transactionType,
        amount: Number(transaction.amount),
        description: transaction.description,
        referenceNumber: transaction.referenceNumber,
        transactionDate: transaction.transactionDate,
      })),
      monthlyTrends: Object.values(monthlyData).sort((a: any, b: any) =>
        a.month.localeCompare(b.month),
      ),
    };
  }

  private generateTempPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private mapBloodGroupToEnum(frontendValue?: string): any {
    if (!frontendValue) return undefined;

    const bloodGroupMap: { [key: string]: any } = {
      'A+': 'A_POSITIVE',
      'A-': 'A_NEGATIVE',
      'B+': 'B_POSITIVE',
      'B-': 'B_NEGATIVE',
      'AB+': 'AB_POSITIVE',
      'AB-': 'AB_NEGATIVE',
      'O+': 'O_POSITIVE',
      'O-': 'O_NEGATIVE',
    };

    return bloodGroupMap[frontendValue] || undefined;
  }

  private transformPatientForFrontend(patient: any) {
    // Transform the database structure to frontend format for editing
    return {
      ...patient,
      emergencyContact: {
        name: patient.emergencyContactName || '',
        relationship: patient.emergencyContactRelationship || '',
        phoneNumber: patient.emergencyContactPhone || '',
      },
      medicalHistory: {
        allergies: patient.allergies || '',
        bloodGroup: this.mapBloodGroupToFrontend(patient.bloodGroup),
        genotype: patient.genotype || '',
        height: patient.height || '',
      },
      insurance: {
        provider: patient.insuranceProvider || '',
        policyNumber: patient.insurancePolicyNumber || '',
        groupNumber: patient.insuranceGroupNumber || '',
      },
    };
  }

  private mapBloodGroupToFrontend(databaseValue?: string): string | undefined {
    if (!databaseValue) return undefined;

    const bloodGroupMap: { [key: string]: string } = {
      A_POSITIVE: 'A+',
      A_NEGATIVE: 'A-',
      B_POSITIVE: 'B+',
      B_NEGATIVE: 'B-',
      AB_POSITIVE: 'AB+',
      AB_NEGATIVE: 'AB-',
      O_POSITIVE: 'O+',
      O_NEGATIVE: 'O-',
    };

    return bloodGroupMap[databaseValue] || undefined;
  }

  private async generateUniqueUsername(
    firstName: string,
    lastName: string,
  ): Promise<string> {
    const baseUsername =
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(
        /[^a-z0-9.]/g,
        '',
      );

    // Check if base username exists
    let username = baseUsername;
    let counter = 1;

    while (true) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username },
      });

      if (!existingUser) {
        break;
      }

      // Try with counter suffix
      username = `${baseUsername}${counter}`;
      counter++;

      // Prevent infinite loop
      if (counter > 100) {
        // Fallback to timestamp-based username
        username = `${baseUsername}_${Date.now()}`;
        break;
      }
    }

    return username;
  }

  private async createPatientMedicalCardInvoice(patientId: string) {
    try {
      // Find the Patient Medical Card service
      const medicalCardService = await this.prisma.service.findFirst({
        where: {
          name: 'Patient Medical Card',
          isActive: true,
        },
      });

      if (!medicalCardService) {
        console.warn(
          'Patient Medical Card service not found. Skipping invoice creation.',
        );
        return;
      }

      // Create the invoice using the unified billing system
      await this.billingService.createInvoice({
        patientId,
        status: InvoiceStatus.PENDING,
        notes: 'Patient Medical Card - Required for hospital service access',
        charges: [
          {
            serviceId: medicalCardService.id,
            description:
              'Patient Medical Card - Registration and card issuance',
            quantity: 1,
            unitPrice: Number(medicalCardService.currentPrice),
          },
        ],
      });

      console.log(
        `✅ Patient Medical Card invoice created for patient ${patientId}`,
      );
    } catch (error) {
      console.error('❌ Failed to create Patient Medical Card invoice:', error);
      // Don't throw error to prevent patient creation from failing
      // The invoice can be created manually later if needed
    }
  }
}
