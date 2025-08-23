import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { CreatePrescriptionMedicationDto } from './dto/create-prescription-medication.dto';
import { UpdatePrescriptionMedicationDto } from './dto/update-prescription-medication.dto';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { CreateMedicationInventoryDto } from './dto/create-medication-inventory.dto';
import { DispenseMedicationDto } from './dto/dispense-medication.dto';

@Injectable()
export class PharmacyService {
  constructor(private prisma: PrismaService) {}

  // ===== MEDICATION MANAGEMENT =====

  async createMedication(createMedicationDto: CreateMedicationDto) {
    const { drugCode, ...medicationData } = createMedicationDto;

    // Check if drug code already exists
    const existingMedication = await this.prisma.medication.findUnique({
      where: { drugCode },
    });

    if (existingMedication) {
      throw new ConflictException(`Drug code ${drugCode} already exists`);
    }

    const medication = await this.prisma.medication.create({
      data: {
        ...medicationData,
        drugCode,
      },
    });

    return medication;
  }

  async findAllMedications(query?: {
    search?: string;
    category?: string;
    isActive?: boolean;
    controlledDrug?: boolean;
  }) {
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { genericName: { contains: query.search, mode: 'insensitive' } },
        { drugCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query?.controlledDrug !== undefined) {
      where.controlledDrug = query.controlledDrug;
    }

    return await this.prisma.medication.findMany({
      where,
      include: {
        inventoryItems: {
          where: { isActive: true },
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findMedicationById(id: string) {
    const medication = await this.prisma.medication.findUnique({
      where: { id },
      include: {
        inventoryItems: {
          where: { isActive: true },
          orderBy: { expiryDate: 'asc' },
        },
        prescriptionItems: {
          include: {
            prescription: {
              include: {
                patient: {
                  select: {
                    firstName: true,
                    lastName: true,
                    patientId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    return medication;
  }

  // ===== INVENTORY MANAGEMENT =====

  async addInventoryItem(createInventoryDto: CreateMedicationInventoryDto) {
    const { medicationId, batchNumber, ...inventoryData } = createInventoryDto;

    // Check if medication exists
    const medication = await this.prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!medication) {
      throw new NotFoundException('Medication not found');
    }

    // Check if batch number already exists
    const existingBatch = await this.prisma.medicationInventory.findUnique({
      where: { batchNumber },
    });

    if (existingBatch) {
      throw new ConflictException(`Batch number ${batchNumber} already exists`);
    }

    // Check if expiry date is in the future
    if (new Date(inventoryData.expiryDate) <= new Date()) {
      throw new BadRequestException('Expiry date must be in the future');
    }

    const inventoryItem = await this.prisma.medicationInventory.create({
      data: {
        ...inventoryData,
        medicationId,
        batchNumber,
        availableQuantity: inventoryData.quantity,
      },
      include: {
        medication: true,
      },
    });

    return inventoryItem;
  }

  async updateInventoryItem(
    id: string,
    updateData: Partial<CreateMedicationInventoryDto>,
  ) {
    const inventoryItem = await this.prisma.medicationInventory.findUnique({
      where: { id },
    });

    if (!inventoryItem) {
      throw new NotFoundException('Inventory item not found');
    }

    // Prevent updating if there are reserved quantities
    if (inventoryItem.reservedQuantity > 0) {
      throw new ConflictException(
        'Cannot update inventory item with reserved quantities',
      );
    }

    const updatedItem = await this.prisma.medicationInventory.update({
      where: { id },
      data: updateData,
      include: {
        medication: true,
      },
    });

    return updatedItem;
  }

  async getInventorySummary() {
    const inventory = await this.prisma.medicationInventory.findMany({
      where: { isActive: true },
      include: {
        medication: {
          select: {
            name: true,
            drugCode: true,
            category: true,
            controlledDrug: true,
          },
        },
      },
    });

    const summary = {
      totalItems: inventory.length,
      totalValue: 0,
      lowStockItems: 0,
      expiringItems: 0,
      controlledDrugs: 0,
      categories: {},
    };

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    inventory.forEach((item) => {
      const itemValue = Number(item.unitCost) * item.availableQuantity;
      summary.totalValue += itemValue;

      if (item.availableQuantity <= 10) {
        summary.lowStockItems++;
      }

      if (item.expiryDate <= thirtyDaysFromNow) {
        summary.expiringItems++;
      }

      if (item.medication.controlledDrug) {
        summary.controlledDrugs++;
      }

      const category = item.medication.category || 'Uncategorized';
      summary.categories[category] = (summary.categories[category] || 0) + 1;
    });

    return {
      summary,
      inventory,
    };
  }

  // ===== PRESCRIPTION MANAGEMENT =====

  async createPrescription(createPrescriptionDto: CreatePrescriptionDto) {
    const { patientId, doctorId, medications, ...prescriptionData } =
      createPrescriptionDto;

    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { account: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Check if doctor exists and is authorized
    const doctor = await this.prisma.staffMember.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor || !['DOCTOR', 'PHARMACIST'].includes(doctor.user.role)) {
      throw new NotFoundException(
        'Doctor not found or not authorized to write prescriptions',
      );
    }

    // Validate medications and calculate total cost
    let totalAmount = 0;
    const validatedMedications: any[] = [];

    if (medications && medications.length > 0) {
      for (const medication of medications) {
        // Check if medication exists and is active
        const med = await this.prisma.medication.findUnique({
          where: { id: medication.medicationId },
          include: {
            inventoryItems: {
              where: { isActive: true },
              orderBy: { expiryDate: 'asc' },
            },
          },
        });

        if (!med || !med.isActive) {
          throw new NotFoundException(
            `Medication with ID ${medication.medicationId} not found or inactive`,
          );
        }

        // Check if sufficient stock is available
        const availableStock = med.inventoryItems.reduce(
          (sum, item) => sum + item.availableQuantity,
          0,
        );

        if (availableStock < medication.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${med.name}. Available: ${availableStock}, Required: ${medication.quantity}`,
          );
        }

        // Calculate price (use the lowest available price)
        const lowestPrice = Math.min(
          ...med.inventoryItems.map((item) => Number(item.sellingPrice)),
        );

        const medicationTotal = lowestPrice * medication.quantity;
        totalAmount += medicationTotal;

        validatedMedications.push({
          ...medication,
          unitPrice: lowestPrice,
          totalPrice: medicationTotal,
        });
      }
    }

    // Create prescription with medications
    const prescription = await this.prisma.prescription.create({
      data: {
        ...prescriptionData,
        patientId,
        doctorId,
        totalAmount,
        balance: totalAmount,
        medications: {
          create: validatedMedications,
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
        medications: {
          include: {
            medication: true,
          },
        },
      },
    });

    return prescription;
  }

  async updatePrescription(
    id: string,
    updatePrescriptionDto: UpdatePrescriptionDto,
  ) {
    const prescription = await this.findPrescriptionById(id);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Remove patientId, doctorId, and medications from update data since they cannot be changed
    const { patientId, doctorId, medications, ...updateData } =
      updatePrescriptionDto;

    const updatedPrescription = await this.prisma.prescription.update({
      where: { id },
      data: updateData,
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
        medications: {
          include: {
            medication: true,
          },
        },
      },
    });

    return updatedPrescription;
  }

  async cancelPrescription(id: string, reason?: string) {
    const prescription = await this.findPrescriptionById(id);

    if (prescription.status === 'DISPENSED') {
      throw new ConflictException('Cannot cancel a dispensed prescription');
    }

    const cancelledPrescription = await this.prisma.prescription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason
          ? `${prescription.notes || ''}\nCancelled: ${reason}`.trim()
          : prescription.notes,
      },
      include: {
        patient: true,
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
    });

    return cancelledPrescription;
  }

  // ===== PRESCRIPTION MEDICATION MANAGEMENT =====

  async addMedicationToPrescription(
    prescriptionId: string,
    createMedicationDto: CreatePrescriptionMedicationDto,
  ) {
    const prescription = await this.findPrescriptionById(prescriptionId);

    if (prescription.status !== 'PENDING') {
      throw new ConflictException(
        'Cannot add medications to a non-pending prescription',
      );
    }

    // Check if medication exists and is active
    const medication = await this.prisma.medication.findUnique({
      where: { id: createMedicationDto.medicationId },
      include: {
        inventoryItems: {
          where: { isActive: true },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });

    if (!medication || !medication.isActive) {
      throw new NotFoundException('Medication not found or inactive');
    }

    // Check if sufficient stock is available
    const availableStock = medication.inventoryItems.reduce(
      (sum, item) => sum + item.availableQuantity,
      0,
    );

    if (availableStock < createMedicationDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock for ${medication.name}. Available: ${availableStock}, Required: ${createMedicationDto.quantity}`,
      );
    }

    // Check if medication already exists in this prescription
    const existingMedication =
      await this.prisma.prescriptionMedication.findFirst({
        where: {
          prescriptionId,
          medicationId: createMedicationDto.medicationId,
        },
      });

    if (existingMedication) {
      throw new ConflictException(
        'This medication is already included in the prescription',
      );
    }

    // Calculate price (use the lowest available price)
    const lowestPrice = Math.min(
      ...medication.inventoryItems.map((item) => Number(item.sellingPrice)),
    );

    const medicationTotal = lowestPrice * createMedicationDto.quantity;

    const newMedication = await this.prisma.prescriptionMedication.create({
      data: {
        ...createMedicationDto,
        prescriptionId,
        unitPrice: lowestPrice,
        totalPrice: medicationTotal,
      },
      include: {
        medication: true,
      },
    });

    // Update prescription total amount and balance
    const newTotalAmount = Number(prescription.totalAmount) + medicationTotal;
    const newBalance = Number(prescription.balance) + medicationTotal;

    await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        totalAmount: newTotalAmount,
        balance: newBalance,
      },
    });

    return newMedication;
  }

  async updatePrescriptionMedication(
    medicationId: string,
    updateMedicationDto: UpdatePrescriptionMedicationDto,
  ) {
    const medication = await this.prisma.prescriptionMedication.findUnique({
      where: { id: medicationId },
      include: {
        medication: true,
        prescription: true,
      },
    });

    if (!medication) {
      throw new NotFoundException('Prescription medication not found');
    }

    if (medication.prescription.status !== 'PENDING') {
      throw new ConflictException(
        'Cannot update medications in a non-pending prescription',
      );
    }

    const updatedMedication = await this.prisma.prescriptionMedication.update({
      where: { id: medicationId },
      data: updateMedicationDto,
      include: {
        medication: true,
      },
    });

    return updatedMedication;
  }

  async removeMedicationFromPrescription(
    prescriptionId: string,
    medicationId: string,
  ) {
    const prescription = await this.findPrescriptionById(prescriptionId);
    const medication = await this.prisma.prescriptionMedication.findUnique({
      where: { id: medicationId, prescriptionId },
    });

    if (!medication) {
      throw new NotFoundException('Prescription medication not found');
    }

    if (prescription.status !== 'PENDING') {
      throw new ConflictException(
        'Cannot remove medications from a non-pending prescription',
      );
    }

    // Calculate the amount to subtract from prescription total
    const medicationAmount = Number(medication.totalPrice);
    const newTotalAmount = Number(prescription.totalAmount) - medicationAmount;
    const newBalance = Number(prescription.balance) - medicationAmount;

    // Update prescription totals
    await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        totalAmount: newTotalAmount,
        balance: newBalance,
      },
    });

    // Remove the medication
    await this.prisma.prescriptionMedication.delete({
      where: { id: medicationId },
    });

    return { message: 'Medication removed from prescription successfully' };
  }

  async findAllPrescriptions(query?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    isPaid?: boolean;
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

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.isPaid !== undefined) {
      where.isPaid = query.isPaid;
    }

    if (query?.startDate || query?.endDate) {
      where.prescriptionDate = {};
      if (query.startDate) where.prescriptionDate.gte = query.startDate;
      if (query.endDate) where.prescriptionDate.lte = query.endDate;
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

    return await this.prisma.prescription.findMany({
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
        medications: {
          include: {
            medication: true,
          },
        },
      },
      orderBy: { prescriptionDate: 'desc' },
    });
  }

  async findPrescriptionById(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
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
        medications: {
          include: {
            medication: true,
            dispensedItems: {
              include: {
                inventoryItem: true,
              },
            },
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return prescription;
  }

  // ===== INVOICE CREATION =====

  async createInvoiceForPrescription(prescriptionId: string) {
    const prescription = await this.findPrescriptionById(prescriptionId);

    if (prescription.status === 'DISPENSED') {
      throw new ConflictException(
        'Cannot create invoice for dispensed prescription',
      );
    }

    if (prescription.status === 'CANCELLED') {
      throw new ConflictException(
        'Cannot create invoice for cancelled prescription',
      );
    }

    // Check if invoice already exists
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: prescription.patientId,
        // Check if there's a recent invoice for this prescription
        issuedDate: {
          gte: new Date(
            prescription.prescriptionDate.getTime() - 24 * 60 * 60 * 1000,
          ), // Within 24 hours
        },
      },
    });

    if (existingInvoice) {
      throw new ConflictException(
        'Invoice already exists for this prescription',
      );
    }

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId: prescription.patientId,
        totalAmount: prescription.totalAmount,
        balance: prescription.totalAmount,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        notes: `Invoice for prescription ${prescriptionId}`,
      },
    });

    // Create charges for each medication
    const charges: any[] = [];
    for (const medication of prescription.medications) {
      const charge = await this.prisma.charge.create({
        data: {
          invoiceId: invoice.id,
          serviceId: medication.medicationId, // Use medication ID as service ID for now
          description: `${medication.medication.name} - ${medication.dosage} ${medication.frequency} for ${medication.duration}`,
          quantity: medication.quantity,
          unitPrice: medication.unitPrice,
          totalPrice: medication.totalPrice,
        },
      });
      charges.push(charge);
    }

    // Update prescription to link with invoice
    const updatedPrescription = await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        notes:
          `${prescription.notes || ''}\nInvoice created: ${invoice.invoiceNumber}`.trim(),
      },
      include: {
        patient: true,
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
    });

    return {
      invoice,
      charges,
      prescription: updatedPrescription,
      message: `Invoice ${invoice.invoiceNumber} created successfully. Total amount: ${Number(invoice.totalAmount)}`,
    };
  }

  // ===== DISPENSING =====

  async dispenseMedication(
    prescriptionId: string,
    dispenseDto: DispenseMedicationDto,
  ) {
    const prescription = await this.findPrescriptionById(prescriptionId);

    if (prescription.status === 'DISPENSED') {
      throw new ConflictException('Prescription is already dispensed');
    }

    if (prescription.status === 'CANCELLED') {
      throw new ConflictException('Cannot dispense cancelled prescription');
    }

    // Check if prescription has an invoice and if it's fully paid
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: prescription.patientId,
        issuedDate: {
          gte: new Date(
            prescription.prescriptionDate.getTime() - 24 * 60 * 60 * 1000,
          ), // Within 24 hours
        },
      },
    });

    if (!invoice) {
      throw new ForbiddenException(
        'Prescription must have an invoice before dispensing',
      );
    }

    if (invoice.status !== 'PAID') {
      throw new ForbiddenException(
        `Invoice ${invoice.invoiceNumber} must be fully paid before dispensing. Current balance: ${Number(invoice.balance)}`,
      );
    }

    const { dispensedBy, notes } = dispenseDto;

    // Process dispensing for each medication
    const dispensedItems: any[] = [];

    for (const prescriptionMedication of prescription.medications) {
      if (prescriptionMedication.isPaid) {
        const dispensedItem = await this.dispenseSingleMedication(
          prescriptionMedication.id,
          dispensedBy,
          notes,
        );
        dispensedItems.push(dispensedItem);
      }
    }

    // Update prescription status to dispensed
    const updatedPrescription = await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: 'DISPENSED',
        notes:
          `${prescription.notes || ''}\nDispensed by: ${dispensedBy} on ${new Date().toISOString()}\n${notes || ''}`.trim(),
      },
      include: {
        patient: true,
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
            dispensedItems: {
              include: {
                inventoryItem: true,
              },
            },
          },
        },
      },
    });

    return {
      prescription: updatedPrescription,
      dispensedItems,
      message: 'Medication dispensed successfully',
    };
  }

  private async dispenseSingleMedication(
    prescriptionMedicationId: string,
    dispensedBy: string,
    notes?: string,
  ) {
    const prescriptionMedication =
      await this.prisma.prescriptionMedication.findUnique({
        where: { id: prescriptionMedicationId },
        include: {
          medication: {
            include: {
              inventoryItems: {
                where: { isActive: true },
                orderBy: { expiryDate: 'asc' },
              },
            },
          },
        },
      });

    if (!prescriptionMedication) {
      throw new NotFoundException('Prescription medication not found');
    }

    let remainingQuantity = prescriptionMedication.quantity;
    const dispensedItems: any[] = [];

    // Dispense from available inventory (FIFO - First In, First Out)
    for (const inventoryItem of prescriptionMedication.medication
      .inventoryItems) {
      if (remainingQuantity <= 0) break;

      const quantityToDispense = Math.min(
        remainingQuantity,
        inventoryItem.availableQuantity,
      );

      if (quantityToDispense > 0) {
        // Create dispensed item record
        const dispensedItem = await this.prisma.dispensedMedication.create({
          data: {
            prescriptionMedicationId,
            inventoryItemId: inventoryItem.id,
            quantity: quantityToDispense,
            dispensedBy,
            batchNumber: inventoryItem.batchNumber,
            expiryDate: inventoryItem.expiryDate,
            notes,
          },
        });

        // Update inventory quantities
        await this.prisma.medicationInventory.update({
          where: { id: inventoryItem.id },
          data: {
            availableQuantity:
              inventoryItem.availableQuantity - quantityToDispense,
          },
        });

        dispensedItems.push(dispensedItem);
        remainingQuantity -= quantityToDispense;
      }
    }

    if (remainingQuantity > 0) {
      throw new BadRequestException(
        `Insufficient stock to dispense ${prescriptionMedication.medication.name}. Remaining: ${remainingQuantity}`,
      );
    }

    // Mark prescription medication as dispensed
    await this.prisma.prescriptionMedication.update({
      where: { id: prescriptionMedicationId },
      data: { isPaid: true },
    });

    return dispensedItems;
  }

  // ===== REPORTS AND ANALYTICS =====

  async getPharmacyReport(startDate: Date, endDate: Date) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        prescriptionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        medications: {
          include: {
            medication: true,
          },
        },
      },
    });

    const report = {
      totalPrescriptions: prescriptions.length,
      totalRevenue: 0,
      totalDispensed: 0,
      totalCancelled: 0,
      medicationBreakdown: {},
      paymentMethods: {},
      dailyStats: {},
    };

    for (const prescription of prescriptions) {
      const prescriptionValue = Number(prescription.totalAmount);
      report.totalRevenue += prescriptionValue;

      if (prescription.status === 'DISPENSED') {
        report.totalDispensed++;
      } else if (prescription.status === 'CANCELLED') {
        report.totalCancelled++;
      }

      // Medication breakdown
      prescription.medications.forEach((med) => {
        const medName = med.medication.name;
        if (!report.medicationBreakdown[medName]) {
          report.medicationBreakdown[medName] = {
            quantity: 0,
            revenue: 0,
          };
        }
        report.medicationBreakdown[medName].quantity += med.quantity;
        report.medicationBreakdown[medName].revenue += Number(med.totalPrice);
      });

      // Get payment methods from invoice
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          patientId: prescription.patientId,
          issuedDate: {
            gte: new Date(
              prescription.prescriptionDate.getTime() - 24 * 60 * 60 * 1000,
            ),
          },
        },
      });

      if (invoice) {
        const payments = await this.prisma.payment.findMany({
          where: { invoiceId: invoice.id },
        });

        payments.forEach((payment) => {
          const method = payment.method;
          report.paymentMethods[method] =
            (report.paymentMethods[method] || 0) + Number(payment.amount);
        });
      }

      // Daily stats
      const date = prescription.prescriptionDate.toDateString();
      if (!report.dailyStats[date]) {
        report.dailyStats[date] = {
          prescriptions: 0,
          revenue: 0,
        };
      }
      report.dailyStats[date].prescriptions++;
      report.dailyStats[date].revenue += prescriptionValue;
    }

    return report;
  }

  async getLowStockAlerts() {
    const lowStockItems = await this.prisma.medicationInventory.findMany({
      where: {
        isActive: true,
        availableQuantity: {
          lte: 10, // Alert when 10 or fewer items available
        },
      },
      include: {
        medication: {
          select: {
            name: true,
            drugCode: true,
            category: true,
            controlledDrug: true,
          },
        },
      },
      orderBy: { availableQuantity: 'asc' },
    });

    return lowStockItems.map((item) => ({
      ...item,
      alertLevel: item.availableQuantity <= 5 ? 'CRITICAL' : 'LOW',
    }));
  }

  async getExpiringMedications(daysThreshold: number = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const expiringItems = await this.prisma.medicationInventory.findMany({
      where: {
        isActive: true,
        expiryDate: {
          lte: thresholdDate,
        },
        availableQuantity: {
          gt: 0,
        },
      },
      include: {
        medication: {
          select: {
            name: true,
            drugCode: true,
            category: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return expiringItems.map((item) => ({
      ...item,
      daysUntilExpiry: Math.ceil(
        (item.expiryDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
  }

  // ===== HELPER METHODS: BILLING, PAYMENT, AVAILABILITY =====
  async getPrescriptionInvoice(prescriptionId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        notes: {
          contains: prescriptionId,
        },
      },
      include: {
        charges: true,
        payments: true,
        refunds: true,
      },
      orderBy: { issuedDate: 'desc' },
    });

    return invoice;
  }

  async getPrescriptionPaymentStatus(prescriptionId: string) {
    const prescription = await this.findPrescriptionById(prescriptionId);

    const invoice = await this.getPrescriptionInvoice(prescriptionId);

    if (!invoice) {
      return {
        prescription: { id: prescription.id, status: prescription.status },
        paymentStatus: {
          hasInvoice: false,
          totalAmount: Number(prescription.totalAmount),
          totalPaid: 0,
          totalRefunded: 0,
          netPaid: 0,
          remainingBalance: Number(prescription.totalAmount),
          isFullyPaid: false,
          invoiceId: null,
          invoiceNumber: null,
        },
      };
    }

    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const totalRefunded = invoice.refunds.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );
    const netPaid = totalPaid - totalRefunded;
    const remainingBalance = Number(invoice.totalAmount) - netPaid;

    return {
      prescription: { id: prescription.id, status: prescription.status },
      paymentStatus: {
        hasInvoice: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        totalPaid,
        totalRefunded,
        netPaid,
        remainingBalance,
        isFullyPaid: remainingBalance <= 0,
      },
    };
  }

  async getPrescriptionBillingDetails(prescriptionId: string) {
    const prescription = await this.findPrescriptionById(prescriptionId);
    const invoice = await this.getPrescriptionInvoice(prescriptionId);

    if (!invoice) {
      return {
        prescription,
        invoice: null,
        charges: [],
        payments: [],
        refunds: [],
        message: 'No invoice found for this prescription',
      };
    }

    return {
      prescription,
      invoice,
      charges: invoice.charges.map((c) => ({
        id: c.id,
        description: c.description,
        quantity: c.quantity,
        unitPrice: Number(c.unitPrice),
        totalPrice: Number(c.totalPrice),
      })),
      payments: invoice.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        reference: p.reference,
        processedAt: p.processedAt,
      })),
      refunds: invoice.refunds.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        reason: r.reason,
        status: r.status,
        refundDate: r.refundDate,
      })),
    };
  }

  async getReadyToDispensePrescriptions() {
    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        patient: {
          select: { firstName: true, lastName: true, patientId: true },
        },
        medications: {
          include: { medication: true },
        },
      },
      orderBy: { prescriptionDate: 'desc' },
    });

    const results: any[] = [];
    for (const pres of prescriptions) {
      const invoice = await this.getPrescriptionInvoice(pres.id);
      if (invoice && invoice.status === 'PAID') {
        results.push({
          ...pres,
          invoice: { id: invoice.id, invoiceNumber: invoice.invoiceNumber },
        });
      }
    }

    return results;
  }

  async checkPrescriptionAvailability(prescriptionId: string) {
    const prescription = await this.findPrescriptionById(prescriptionId);

    const items = await Promise.all(
      prescription.medications.map(async (item) => {
        const inventoryItems = await this.prisma.medicationInventory.findMany({
          where: { medicationId: item.medicationId, isActive: true },
          orderBy: { expiryDate: 'asc' },
        });

        const available = inventoryItems.reduce(
          (sum, inv) => sum + inv.availableQuantity,
          0,
        );
        const required = item.quantity;
        return {
          prescriptionMedicationId: item.id,
          medicationId: item.medicationId,
          medicationName: item.medication.name,
          requiredQuantity: required,
          availableQuantity: available,
          canFulfill: available >= required,
        };
      }),
    );

    const canDispense = items.every((i) => i.canFulfill);
    return { prescriptionId, canDispense, items };
  }

  async getInventoryValuation() {
    const items = await this.prisma.medicationInventory.findMany({
      where: { isActive: true },
      include: { medication: true },
    });

    const totalCost = items.reduce(
      (sum, i) => sum + Number(i.unitCost) * i.availableQuantity,
      0,
    );
    const totalRetail = items.reduce(
      (sum, i) => sum + Number(i.sellingPrice) * i.availableQuantity,
      0,
    );

    return {
      totalCost,
      totalRetail,
      potentialGrossMargin: totalRetail - totalCost,
      items: items.map((i) => ({
        id: i.id,
        medicationName: i.medication.name,
        batchNumber: i.batchNumber,
        availableQuantity: i.availableQuantity,
        costPrice: Number(i.unitCost),
        sellingPrice: Number(i.sellingPrice),
        totalCost: Number(i.unitCost) * i.availableQuantity,
        totalRetail: Number(i.sellingPrice) * i.availableQuantity,
        expiryDate: i.expiryDate,
      })),
    };
  }

  async getInventoryAgingReport(buckets: number[] = [30, 60, 90]) {
    const items = await this.prisma.medicationInventory.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();

    const bucketLabels = [
      `0-${buckets[0]} days`,
      ...buckets
        .slice(0, -1)
        .map((b, idx) => `${buckets[idx]}-${buckets[idx + 1]} days`),
      `${buckets[buckets.length - 1]}+ days`,
    ];

    const result = bucketLabels.reduce(
      (acc, label) => {
        acc[label] = { count: 0, quantity: 0 };
        return acc;
      },
      {} as Record<string, { count: number; quantity: number }>,
    );

    for (const item of items) {
      const ageDays = Math.floor(
        (now.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      let labelIndex = 0;
      while (labelIndex < buckets.length && ageDays > buckets[labelIndex]) {
        labelIndex++;
      }
      const label = bucketLabels[labelIndex];
      result[label].count++;
      result[label].quantity += item.availableQuantity;
    }

    return {
      buckets: bucketLabels,
      data: result,
      generatedAt: now,
    };
  }
}
