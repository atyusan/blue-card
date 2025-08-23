import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';

@Injectable()
export class LabService {
  constructor(private prisma: PrismaService) {}

  // Lab Order Management
  async createLabOrder(createLabOrderDto: CreateLabOrderDto) {
    const { patientId, doctorId, tests, ...orderData } = createLabOrderDto;

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

    if (!doctor || !['DOCTOR', 'LAB_TECHNICIAN'].includes(doctor.user.role)) {
      throw new NotFoundException(
        'Doctor not found or not authorized to order lab tests',
      );
    }

    // Validate that all tests exist and are active
    if (tests && tests.length > 0) {
      for (const test of tests) {
        const service = await this.prisma.service.findUnique({
          where: { id: test.serviceId },
        });

        if (!service || !service.isActive) {
          throw new NotFoundException(
            `Service with ID ${test.serviceId} not found or inactive`,
          );
        }
      }
    }

    // Calculate total cost for all tests
    let totalAmount = 0;
    const validatedTests: any[] = [];

    if (tests && tests.length > 0) {
      for (const test of tests) {
        const service = await this.prisma.service.findUnique({
          where: { id: test.serviceId },
        });

        if (service) {
          totalAmount += Number(service.currentPrice);
          validatedTests.push({
            serviceId: test.serviceId,
            status: 'PENDING',
            unitPrice: service.currentPrice,
            totalPrice: service.currentPrice,
          });
        }
      }
    }

    // Create lab order with tests
    const labOrder = await this.prisma.labOrder.create({
      data: {
        ...orderData,
        patientId,
        doctorId,
        totalAmount,
        balance: totalAmount,
        tests: {
          create: validatedTests,
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
        tests: {
          include: {
            service: true,
          },
        },
      },
    });

    // Create invoice for the lab order
    const invoice = await this.createInvoiceForLabOrder(
      labOrder.id,
      totalAmount,
    );

    return {
      labOrder,
      invoice,
      message: `Lab order created successfully. Total amount: $${totalAmount}. Invoice: ${invoice.invoice.invoiceNumber}`,
    };
  }

  // Create invoice for lab order
  async createInvoiceForLabOrder(labOrderId: string, totalAmount: number) {
    const labOrder = await this.findLabOrderById(labOrderId);

    // Check if invoice already exists
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: labOrder.patientId,
        notes: {
          contains: `Lab Order ${labOrderId}`,
        },
      },
    });

    if (existingInvoice) {
      throw new ConflictException('Invoice already exists for this lab order');
    }

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: `LAB-INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId: labOrder.patientId,
        totalAmount,
        balance: totalAmount,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        notes: `Invoice for Lab Order ${labOrderId}`,
      },
    });

    // Create charges for each test
    const charges: any[] = [];
    for (const test of labOrder.tests) {
      const charge = await this.prisma.charge.create({
        data: {
          invoiceId: invoice.id,
          serviceId: test.serviceId,
          description: `${test.service.name} - Lab Test`,
          quantity: 1,
          unitPrice: test.unitPrice,
          totalPrice: test.totalPrice,
        },
      });
      charges.push(charge);
    }

    // Update lab order to link with invoice
    const updatedLabOrder = await this.prisma.labOrder.update({
      where: { id: labOrderId },
      data: {
        notes:
          `${labOrder.notes || ''}\nInvoice created: ${invoice.invoiceNumber}`.trim(),
      },
    });

    return {
      invoice,
      charges,
      labOrder: updatedLabOrder,
    };
  }

  async findAllLabOrders(query?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
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

    if (query?.startDate || query?.endDate) {
      where.orderDate = {};
      if (query.startDate) where.orderDate.gte = query.startDate;
      if (query.endDate) where.orderDate.lte = query.endDate;
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
      ];
    }

    const labOrders = await this.prisma.labOrder.findMany({
      where,
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
        tests: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    return labOrders;
  }

  async findLabOrderById(id: string) {
    const labOrder = await this.prisma.labOrder.findUnique({
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
        tests: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!labOrder) {
      throw new NotFoundException('Lab order not found');
    }

    return labOrder;
  }

  async updateLabOrder(id: string, updateLabOrderDto: UpdateLabOrderDto) {
    const labOrder = await this.findLabOrderById(id);

    if (!labOrder) {
      throw new NotFoundException('Lab order not found');
    }

    // Remove patientId, doctorId, and tests from update data since they cannot be changed
    const { patientId, doctorId, tests, ...updateData } = updateLabOrderDto;

    const updatedLabOrder = await this.prisma.labOrder.update({
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
        tests: {
          include: {
            service: true,
          },
        },
      },
    });

    return updatedLabOrder;
  }

  async cancelLabOrder(id: string, reason?: string) {
    const labOrder = await this.findLabOrderById(id);

    if (labOrder.status === 'COMPLETED') {
      throw new ConflictException('Cannot cancel a completed lab order');
    }

    const cancelledOrder = await this.prisma.labOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason
          ? `${labOrder.notes || ''}\nCancelled: ${reason}`.trim()
          : labOrder.notes,
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
        tests: {
          include: {
            service: true,
          },
        },
      },
    });

    return cancelledOrder;
  }

  // Lab Test Management
  async addTestToOrder(orderId: string, createLabTestDto: CreateLabTestDto) {
    const labOrder = await this.findLabOrderById(orderId);

    if (labOrder.status !== 'PENDING') {
      throw new ConflictException(
        'Cannot add tests to a non-pending lab order',
      );
    }

    // Check if service exists and is active
    const service = await this.prisma.service.findUnique({
      where: { id: createLabTestDto.serviceId },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Service not found or inactive');
    }

    // Check if test already exists in this order
    const existingTest = await this.prisma.labTest.findFirst({
      where: {
        orderId,
        serviceId: createLabTestDto.serviceId,
      },
    });

    if (existingTest) {
      throw new ConflictException(
        'This test is already included in the lab order',
      );
    }

    // Calculate test cost
    const unitPrice = service.currentPrice;
    const totalPrice = service.currentPrice;

    const test = await this.prisma.labTest.create({
      data: {
        ...createLabTestDto,
        orderId,
        status: 'PENDING',
        unitPrice,
        totalPrice,
      },
      include: {
        service: true,
      },
    });

    // Update lab order total amount and balance
    const updatedOrder = await this.prisma.labOrder.update({
      where: { id: orderId },
      data: {
        totalAmount: {
          increment: totalPrice,
        },
        balance: {
          increment: totalPrice,
        },
      },
    });

    // Update invoice if it exists
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: labOrder.patientId,
        notes: {
          contains: `Lab Order ${orderId}`,
        },
      },
    });

    if (invoice) {
      // Add charge for the new test
      await this.prisma.charge.create({
        data: {
          invoiceId: invoice.id,
          serviceId: createLabTestDto.serviceId,
          description: `${service.name} - Lab Test`,
          quantity: 1,
          unitPrice,
          totalPrice,
        },
      });

      // Update invoice total
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          totalAmount: {
            increment: totalPrice,
          },
          balance: {
            increment: totalPrice,
          },
        },
      });
    }

    return {
      test,
      updatedOrder,
      message: `Test added successfully. New total amount: $${Number(updatedOrder.totalAmount)}`,
    };
  }

  async updateLabTest(testId: string, updateLabTestDto: UpdateLabTestDto) {
    const test = await this.prisma.labTest.findUnique({
      where: { id: testId },
      include: {
        service: true,
      },
    });

    if (!test) {
      throw new NotFoundException('Lab test not found');
    }

    const updatedTest = await this.prisma.labTest.update({
      where: { id: testId },
      data: updateLabTestDto,
      include: {
        service: true,
      },
    });

    return updatedTest;
  }

  async startLabTest(testId: string) {
    const test = await this.prisma.labTest.findUnique({
      where: { id: testId },
      include: {
        order: {
          include: {
            patient: true,
          },
        },
        service: true,
      },
    });

    if (!test) {
      throw new NotFoundException('Lab test not found');
    }

    if (test.status !== 'PENDING') {
      throw new ConflictException('Test is not in pending status');
    }

    // Check if the lab order invoice is fully paid
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        patientId: test.order.patientId,
        notes: {
          contains: `Lab Order ${test.orderId}`,
        },
      },
    });

    if (!invoice) {
      throw new ForbiddenException(
        'No invoice found for this lab order. Payment must be processed first.',
      );
    }

    if (invoice.status !== 'PAID') {
      throw new ForbiddenException(
        `Invoice ${invoice.invoiceNumber} must be fully paid before tests can start. Current balance: $${Number(invoice.balance)}`,
      );
    }

    const updatedTest = await this.prisma.labTest.update({
      where: { id: testId },
      data: { status: 'IN_PROGRESS' },
      include: {
        service: true,
      },
    });

    return updatedTest;
  }

  async completeLabTest(testId: string, result: string, completedBy: string) {
    const test = await this.prisma.labTest.findUnique({
      where: { id: testId },
      include: {
        order: {
          include: {
            tests: true,
          },
        },
        service: true,
      },
    });

    if (!test) {
      throw new NotFoundException('Lab test not found');
    }

    if (test.status !== 'IN_PROGRESS') {
      throw new ConflictException('Test is not in progress');
    }

    const updatedTest = await this.prisma.labTest.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED',
        result,
        notes: `Completed by: ${completedBy} on ${new Date().toISOString()}`,
      },
      include: {
        service: true,
      },
    });

    // Check if all tests in the order are completed
    const order = await this.prisma.labOrder.findUnique({
      where: { id: test.orderId },
      include: {
        tests: true,
      },
    });

    if (order && order.tests.every((t) => t.status === 'COMPLETED')) {
      await this.prisma.labOrder.update({
        where: { id: test.orderId },
        data: { status: 'COMPLETED' },
      });
    }

    return updatedTest;
  }

  // Payment and Status Management
  async markLabOrderAsPaid(orderId: string) {
    const labOrder = await this.findLabOrderById(orderId);

    if (labOrder.isPaid) {
      throw new ConflictException('Lab order is already marked as paid');
    }

    const updatedOrder = await this.prisma.labOrder.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paidAmount: labOrder.totalAmount,
        balance: 0,
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
        tests: {
          include: {
            service: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  // Get lab orders that are ready for testing (paid and pending)
  async getReadyForTestingLabOrders() {
    return await this.prisma.labOrder.findMany({
      where: {
        status: 'PENDING',
        isPaid: true, // Only show paid orders
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
      orderBy: { orderDate: 'asc' },
    });
  }

  // Get lab orders by payment status
  async getLabOrdersByPaymentStatus(isPaid: boolean) {
    return await this.prisma.labOrder.findMany({
      where: { isPaid },
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
        tests: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  // Get lab test results by patient
  async getLabTestResultsByPatient(patientId: string) {
    const labTests = await this.prisma.labTest.findMany({
      where: {
        order: {
          patientId,
        },
        status: 'COMPLETED',
      },
      include: {
        order: {
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
        },
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return labTests;
  }

  async getLabOrderSummary(patientId: string) {
    // Check if patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const labOrders = await this.prisma.labOrder.findMany({
      where: { patientId },
      include: {
        tests: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    const totalTests = labOrders.reduce(
      (sum, order) => sum + order.tests.length,
      0,
    );
    const completedTests = labOrders.reduce(
      (sum, order) =>
        sum + order.tests.filter((test) => test.status === 'COMPLETED').length,
      0,
    );
    const pendingTests = labOrders.reduce(
      (sum, order) =>
        sum + order.tests.filter((test) => test.status === 'PENDING').length,
      0,
    );

    return {
      labOrders,
      summary: {
        totalOrders: labOrders.length,
        totalTests,
        completedTests,
        pendingTests,
        inProgressTests: totalTests - completedTests - pendingTests,
      },
    };
  }

  async getPendingLabOrders() {
    return await this.prisma.labOrder.findMany({
      where: {
        status: 'PENDING',
        isPaid: true, // Only show paid orders
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
      orderBy: { orderDate: 'asc' },
    });
  }

  async getLabOrderByPatientAndDate(patientId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.prisma.labOrder.findMany({
      where: {
        patientId,
        orderDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        tests: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });
  }
}
