import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

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

    const patient = await this.prisma.patient.create({
      data: {
        ...createPatientDto,
        patientId,
      },
      include: {
        account: true,
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

    return this.findById(patient.id);
  }

  async findAll(query?: { search?: string; isActive?: boolean }) {
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

    return this.prisma.patient.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        account: true,
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

    const patient = await this.prisma.patient.update({
      where: { id },
      data: updatePatientDto,
      include: {
        account: true,
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
      include: { account: true },
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
}
