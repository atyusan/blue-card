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
import { UserPermissionsService } from '../users/user-permissions.service';

@Injectable()
export class LabService {
  constructor(
    private prisma: PrismaService,
    private userPermissionsService: UserPermissionsService,
  ) {}

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

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if doctor has required permissions
    const hasPermission = await this.userPermissionsService.hasAnyPermission(
      doctor.userId,
      ['order_lab_tests', 'admin'],
    );

    if (!hasPermission) {
      throw new ForbiddenException('Doctor not authorized to order lab tests');
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
    if (labOrder.invoiceId) {
      throw new ConflictException('Invoice already exists for this lab order');
    }

    // Generate unique invoice number
    const invoiceNumber = `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create invoice with charges in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          patientId: labOrder.patientId,
          totalAmount,
          balance: totalAmount,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
          notes: `Lab Order #${labOrderId.slice(-8).toUpperCase()} - ${labOrder.tests.length} test(s)`,
        },
      });

      // Create charges for each test
      const charges = await Promise.all(
        labOrder.tests.map((test) =>
          tx.charge.create({
            data: {
              invoiceId: invoice.id,
              serviceId: test.serviceId,
              description: `${test.service.name} - Lab Test`,
              quantity: 1,
              unitPrice: test.unitPrice,
              totalPrice: test.totalPrice,
            },
          }),
        ),
      );

      // Update lab order to link with invoice
      const updatedLabOrder = await tx.labOrder.update({
        where: { id: labOrderId },
        data: {
          invoiceId: invoice.id,
        },
        include: {
          invoice: true,
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

      return {
        invoice,
        charges,
        labOrder: updatedLabOrder,
      };
    });

    return result;
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
            labTechnician: {
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
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
            balance: true,
            issuedDate: true,
            dueDate: true,
            paidDate: true,
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

  // Lab Test Pool Management (for paid orders)
  async getAvailableLabTests(status?: string) {
    // Only show tests from PAID lab orders
    const where: any = {
      order: {
        isPaid: true,
      },
    };

    // Filter by status if provided
    if (status) {
      where.status = status;
    } else {
      // By default, show PENDING tests (available to claim)
      where.status = 'PENDING';
    }

    const tests = await this.prisma.labTest.findMany({
      where,
      include: {
        order: {
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
        },
        service: true,
        labTechnician: {
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    return tests;
  }

  async claimLabTest(testId: string, technicianId: string) {
    const test = await this.prisma.labTest.findUnique({
      where: { id: testId },
      include: {
        order: {
          include: {
            invoice: true,
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Lab test not found');
    }

    if (test.status !== 'PENDING') {
      throw new ConflictException('Test is not available for claiming');
    }

    // Verify order is paid
    if (!test.order.isPaid) {
      throw new ForbiddenException(
        'Lab order must be paid before tests can be claimed',
      );
    }

    // Verify invoice is paid if exists
    if (test.order.invoice && test.order.invoice.status !== 'PAID') {
      throw new ForbiddenException(
        `Invoice ${test.order.invoice.invoiceNumber} must be fully paid before tests can be claimed`,
      );
    }

    const updatedTest = await this.prisma.labTest.update({
      where: { id: testId },
      data: {
        status: 'CLAIMED',
        labTechnicianId: technicianId,
        claimedAt: new Date(),
      },
      include: {
        service: true,
        order: {
          include: {
            patient: {
              select: {
                id: true,
                patientId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        labTechnician: {
          include: {
            user: true,
          },
        },
      },
    });

    return updatedTest;
  }

  async startLabTest(testId: string, technicianId: string) {
    const test = await this.prisma.labTest.findUnique({
      where: { id: testId },
      include: {
        order: {
          include: {
            invoice: true,
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Lab test not found');
    }

    if (test.status !== 'CLAIMED') {
      throw new ConflictException('Test must be claimed before starting');
    }

    if (test.labTechnicianId !== technicianId) {
      throw new ForbiddenException(
        'You can only start tests that you have claimed',
      );
    }

    // Verify order is paid
    if (!test.order.isPaid) {
      throw new ForbiddenException(
        'Lab order must be paid before tests can be started',
      );
    }

    const updatedTest = await this.prisma.labTest.update({
      where: { id: testId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        service: true,
        order: {
          include: {
            patient: true,
          },
        },
        labTechnician: {
          include: {
            user: true,
          },
        },
      },
    });

    return updatedTest;
  }

  async completeLabTestWithResults(
    testId: string,
    technicianId: string,
    resultData: {
      resultValue?: string;
      resultUnit?: string;
      referenceRange?: string;
      isCritical?: boolean;
      notes?: string;
    },
  ) {
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
      throw new ConflictException('Test must be in progress to complete');
    }

    if (test.labTechnicianId !== technicianId) {
      throw new ForbiddenException(
        'You can only complete tests that you are processing',
      );
    }

    const updatedTest = await this.prisma.labTest.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED',
        resultValue: resultData.resultValue,
        resultUnit: resultData.resultUnit,
        referenceRange: resultData.referenceRange,
        isCritical: resultData.isCritical || false,
        notes: resultData.notes,
        completedAt: new Date(),
      },
      include: {
        service: true,
        order: {
          include: {
            patient: true,
          },
        },
        labTechnician: {
          include: {
            user: true,
          },
        },
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

  async cancelLabTest(testId: string, technicianId: string, reason: string) {
    const test = await this.prisma.labTest.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new NotFoundException('Lab test not found');
    }

    if (test.labTechnicianId !== technicianId) {
      throw new ForbiddenException(
        'You can only cancel tests that you have claimed',
      );
    }

    if (test.status === 'COMPLETED' || test.status === 'CANCELLED') {
      throw new ConflictException(
        `Test is already ${test.status.toLowerCase()}`,
      );
    }

    const updatedTest = await this.prisma.labTest.update({
      where: { id: testId },
      data: {
        status: 'CANCELLED',
        notes: `Cancelled by technician. Reason: ${reason}`,
      },
      include: {
        service: true,
        order: {
          include: {
            patient: true,
          },
        },
      },
    });

    return updatedTest;
  }

  async getMyLabTests(technicianId: string, status?: string) {
    const where: any = {
      labTechnicianId: technicianId,
    };

    if (status) {
      where.status = status;
    } else {
      // By default, show active tests (claimed or in progress)
      where.status = {
        in: ['CLAIMED', 'IN_PROGRESS'],
      };
    }

    const tests = await this.prisma.labTest.findMany({
      where,
      include: {
        order: {
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
        },
        service: true,
      },
      orderBy: {
        claimedAt: 'desc',
      },
    });

    return tests;
  }

  // Payment and Status Management
  async markLabOrderAsPaid(orderId: string) {
    const labOrder = await this.findLabOrderById(orderId);

    if (labOrder.isPaid) {
      throw new ConflictException('Lab order is already marked as paid');
    }

    // Update both lab order and invoice in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update lab order
      const updatedOrder = await tx.labOrder.update({
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
          invoice: true,
        },
      });

      // Update linked invoice if exists
      if (labOrder.invoiceId) {
        await tx.invoice.update({
          where: { id: labOrder.invoiceId },
          data: {
            status: 'PAID',
            paidAmount: labOrder.totalAmount,
            balance: 0,
            paidDate: new Date(),
          },
        });
      }

      return updatedOrder;
    });

    return result;
  }

  // Mark invoice as paid and update lab order (called from payment service)
  async markLabOrderPaidByInvoice(invoiceId: string) {
    const labOrder = await this.prisma.labOrder.findUnique({
      where: { invoiceId },
    });

    if (!labOrder) {
      return null; // No lab order linked to this invoice
    }

    if (labOrder.isPaid) {
      return labOrder; // Already paid
    }

    // Update lab order payment status
    const updatedOrder = await this.prisma.labOrder.update({
      where: { id: labOrder.id },
      data: {
        isPaid: true,
        paidAmount: labOrder.totalAmount,
        balance: 0,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        tests: {
          include: {
            service: true,
          },
        },
        invoice: true,
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

  // Treatment-Based Lab Request Management
  async createLabRequests(createLabRequestDto: any) {
    const {
      treatmentId,
      requestingProviderId,
      tests,
      urgency,
      scheduledAt,
      notes,
    } = createLabRequestDto;

    // Verify treatment exists
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId },
      include: { patient: true },
    });

    if (!treatment) {
      throw new NotFoundException('Treatment not found');
    }

    // Verify requesting provider exists
    const provider = await this.prisma.staffMember.findUnique({
      where: { id: requestingProviderId },
    });

    if (!provider) {
      throw new NotFoundException('Requesting provider not found');
    }

    // Fetch services for tests to get pricing
    // Fetch services for tests using serviceId (provided directly from frontend)
    const testServices = await Promise.all(
      tests.map(async (test) => {
        let service: any = null;

        // If serviceId is provided, fetch the service directly
        if (test.serviceId) {
          service = await this.prisma.service.findUnique({
            where: { id: test.serviceId },
          });

          if (service) {
            console.log(
              `✅ Using service: "${service.name}" ($${Number(service.currentPrice)}) for lab request`,
            );
          } else {
            console.warn(
              `⚠️ Service ID "${test.serviceId}" not found for test: "${test.testName}"`,
            );
          }
        } else {
          console.warn(
            `⚠️ No service ID provided for test: "${test.testName}". Will create with $0 price.`,
          );
        }

        return { test, service };
      }),
    );

    // Calculate total amount for all tests
    let totalAmount = 0;
    const testsWithPrices = testServices.map(({ test, service }) => {
      const price = service ? Number(service.currentPrice) : 0;
      totalAmount += price;

      return {
        ...test,
        serviceId: service?.id || test.serviceId, // Use provided serviceId if service fetch failed
        totalPrice: price,
      };
    });

    // Always create invoice for lab requests to ensure payment gating
    let invoice: any = null;
    if (totalAmount > 0) {
      const invoiceNumber = `LAB-REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber,
          patientId: treatment.patientId,
          totalAmount: totalAmount,
          balance: totalAmount,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
          notes: `Lab Requests for Treatment #${treatmentId.slice(-8).toUpperCase()} - ${tests.length} test(s)`,
        },
      });

      // Create charges for each test that has a service
      if (invoice) {
        await Promise.all(
          testsWithPrices
            .filter((test) => test.serviceId && test.totalPrice > 0)
            .map((test) =>
              this.prisma.charge.create({
                data: {
                  invoiceId: invoice.id,
                  serviceId: test.serviceId,
                  description: `${test.testName} - Lab Test`,
                  quantity: 1,
                  unitPrice: test.totalPrice,
                  totalPrice: test.totalPrice,
                },
              }),
            ),
        );
      }
    }

    // Create multiple lab requests (one for each test)
    const createdRequests = await Promise.all(
      testsWithPrices.map((test) =>
        this.prisma.labRequest.create({
          data: {
            treatmentId,
            requestingProviderId,
            testType: test.testType,
            testName: test.testName,
            description: test.description,
            specimenType: test.specimenType,
            collectionInstructions: test.collectionInstructions,
            urgency: urgency || 'ROUTINE',
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            status: 'REQUESTED',
            serviceId: test.serviceId,
            totalPrice: test.totalPrice,
            // Require payment if an invoice was created (total > 0)
            requirePayment: totalAmount > 0,
            // Mark as paid only if no invoice was created (free tests)
            isPaid: totalAmount === 0,
            // Link ALL lab requests to the same invoice (not just the first one)
            invoiceId: invoice ? invoice.id : null,
          },
          include: {
            treatment: {
              include: {
                patient: { include: { user: true } },
              },
            },
            requestingProvider: {
              include: { user: true },
            },
            service: true,
            invoice: true,
          },
        }),
      ),
    );

    // Log summary
    const testsWithServices = testsWithPrices.filter((t) => t.serviceId).length;
    console.log(
      `📊 Lab Request Summary: ${tests.length} tests requested, ${testsWithServices} with billable services, Total: $${totalAmount}`,
    );

    if (invoice) {
      console.log(
        `💰 Invoice Created: ${invoice.invoiceNumber} - $${totalAmount} - Linked to ${createdRequests.length} lab request(s)`,
      );
      console.log(
        `🔒 Payment Gating: All ${createdRequests.length} lab requests require payment before processing`,
      );
    } else {
      console.log(
        `✅ No invoice created (free tests) - ${createdRequests.length} lab requests available immediately`,
      );
    }

    return {
      requests: createdRequests,
      invoice,
      totalAmount,
      testsCount: tests.length,
      message: invoice
        ? `Lab requests created successfully. Payment required: $${totalAmount}. Invoice: ${invoice.invoiceNumber}. All ${createdRequests.length} test(s) will be available after payment.`
        : `Lab requests created successfully. ${tests.length} test(s) requested. No payment required.`,
    };
  }

  async getLabRequestsPool(filters?: { status?: string; urgency?: string }) {
    const where: any = {
      labProviderId: null, // Only show unclaimed requests
      OR: [
        { isPaid: true }, // Show paid requests
        { requirePayment: false }, // Or requests that don't require payment
      ],
    };

    if (filters?.status) {
      where.status = filters.status;
    } else {
      // Default to show only requested requests
      where.status = { in: ['REQUESTED', 'IN_PROGRESS'] };
    }

    if (filters?.urgency) {
      where.urgency = filters.urgency;
    }

    return await this.prisma.labRequest.findMany({
      where,
      include: {
        treatment: {
          include: {
            patient: { include: { user: true } },
            primaryProvider: { include: { user: true } },
          },
        },
        requestingProvider: {
          include: { user: true },
        },
        results: true,
      },
      orderBy: [
        { urgency: 'asc' }, // STAT first, then URGENT, then ROUTINE
        { requestedAt: 'asc' }, // Oldest first
      ],
    });
  }

  // Mark lab requests as paid when invoice is paid
  async markLabRequestsPaidByInvoice(invoiceId: string) {
    const labRequests = await this.prisma.labRequest.findMany({
      where: { invoiceId },
    });

    if (labRequests.length === 0) {
      console.log(
        `ℹ️ No lab requests linked to invoice ${invoiceId.slice(-8)}`,
      );
      return null; // No lab requests linked to this invoice
    }

    console.log(
      `💳 Payment received for invoice ${invoiceId.slice(-8)} - Updating ${labRequests.length} lab request(s)`,
    );

    // Update all lab requests linked to this invoice
    await this.prisma.labRequest.updateMany({
      where: { invoiceId },
      data: {
        isPaid: true,
      },
    });

    console.log(
      `✅ Successfully marked ${labRequests.length} lab request(s) as PAID - Now available in lab pool`,
    );

    return labRequests;
  }

  async getLabResults(status?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    } else {
      // Default to show only completed requests with results
      where.status = 'COMPLETED';
    }

    return await this.prisma.labRequest.findMany({
      where,
      include: {
        treatment: {
          include: {
            patient: { include: { user: true } },
            primaryProvider: { include: { user: true } },
          },
        },
        requestingProvider: {
          include: { user: true },
        },
        labProvider: {
          include: { user: true },
        },
        results: true,
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  // Get all lab results from both lab orders and lab requests
  async getAllLabResults(filters?: { status?: string; patientId?: string }) {
    const labRequestWhere: any = {};
    const labTestWhere: any = {};

    if (filters?.status) {
      labRequestWhere.status = filters.status;
      labTestWhere.status = filters.status;
    } else {
      // Default to show only completed results
      labRequestWhere.status = 'COMPLETED';
      labTestWhere.status = 'COMPLETED';
    }

    if (filters?.patientId) {
      labRequestWhere.treatment = { patientId: filters.patientId };
      labTestWhere.order = { patientId: filters.patientId };
    }

    // Fetch lab requests (treatment-based)
    const labRequests = await this.prisma.labRequest.findMany({
      where: labRequestWhere,
      include: {
        treatment: {
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
          },
        },
        requestingProvider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        labProvider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        service: true,
        results: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    // Fetch lab tests (order-based)
    const labTests = await this.prisma.labTest.findMany({
      where: labTestWhere,
      include: {
        order: {
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
        },
        service: true,
        labTechnician: {
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
      orderBy: { completedAt: 'desc' },
    });

    // Transform both into a unified format
    const unifiedResults = [
      // Lab requests (treatment-based)
      ...labRequests.map((req) => ({
        id: req.id,
        type: 'LAB_REQUEST' as const,
        testName: req.testName,
        testType: req.testType,
        status: req.status,
        completedAt: req.completedAt,
        claimedAt: req.claimedAt,
        startedAt: req.startedAt,
        patient: req.treatment.patient,
        requestedBy: req.requestingProvider,
        labTechnician: req.labProvider,
        service: req.service,
        totalPrice: Number(req.totalPrice),
        // For lab requests, combine multiple results into single display
        results: req.results,
        hasResults: req.results && req.results.length > 0,
        isCritical: req.results?.some((r) => r.status === 'CRITICAL') || false,
        treatmentId: req.treatmentId,
      })),
      // Lab tests (order-based)
      ...labTests.map((test) => ({
        id: test.id,
        type: 'LAB_TEST' as const,
        testName: test.service?.name || 'Unknown Test',
        testType: 'LABORATORY',
        status: test.status,
        completedAt: test.completedAt,
        claimedAt: test.claimedAt,
        startedAt: test.startedAt,
        patient: test.order.patient,
        requestedBy: test.order.doctor,
        labTechnician: test.labTechnician,
        service: test.service,
        totalPrice: Number(test.totalPrice),
        // For lab tests, result is in the test itself
        resultValue: test.resultValue,
        resultUnit: test.resultUnit,
        referenceRange: test.referenceRange,
        isCritical: test.isCritical,
        notes: test.notes,
        hasResults: !!test.resultValue,
        orderId: test.orderId,
      })),
    ];

    // Sort by completion date, most recent first
    unifiedResults.sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });

    return unifiedResults;
  }

  // Administrative monitoring - fetch ALL lab tests from both sources
  async getAllLabTests(filters?: {
    status?: string;
    source?: string;
    patientId?: string;
    isPaid?: boolean;
  }) {
    const labRequestWhere: any = {};
    const labTestWhere: any = {};

    if (filters?.status) {
      labRequestWhere.status = filters.status;
      labTestWhere.status = filters.status;
    }

    if (filters?.patientId) {
      labRequestWhere.treatment = { patientId: filters.patientId };
      labTestWhere.order = { patientId: filters.patientId };
    }

    if (filters?.isPaid !== undefined) {
      labRequestWhere.isPaid = filters.isPaid;
      // For lab tests, filter by order payment status
      labTestWhere.order = {
        ...labTestWhere.order,
        isPaid: filters.isPaid,
      };
    }

    let labRequests: any[] = [];
    let labTests: any[] = [];

    // Fetch based on source filter
    if (!filters?.source || filters.source === 'TREATMENT') {
      labRequests = await this.prisma.labRequest.findMany({
        where: labRequestWhere,
        include: {
          treatment: {
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
            },
          },
          requestingProvider: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          labProvider: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          service: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              status: true,
            },
          },
          results: true,
        },
        orderBy: { requestedAt: 'desc' },
      });
    }

    if (!filters?.source || filters.source === 'EXTERNAL') {
      labTests = await this.prisma.labTest.findMany({
        where: labTestWhere,
        include: {
          order: {
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
              invoice: {
                select: {
                  id: true,
                  invoiceNumber: true,
                  totalAmount: true,
                  status: true,
                },
              },
            },
          },
          service: true,
          labTechnician: {
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
      });
    }

    // Transform both into a unified format for administrative monitoring
    const unifiedTests = [
      // Lab requests (treatment-based)
      ...labRequests.map((req) => ({
        id: req.id,
        type: 'LAB_REQUEST' as const,
        source: 'TREATMENT' as const,
        testName: req.testName,
        testType: req.testType,
        status: req.status,
        createdAt: req.requestedAt,
        claimedAt: req.claimedAt,
        startedAt: req.startedAt,
        completedAt: req.completedAt,
        patient: req.treatment.patient,
        requestedBy: req.requestingProvider,
        processedBy: req.labProvider,
        service: req.service,
        totalPrice: Number(req.totalPrice || 0),
        isPaid: req.isPaid,
        requirePayment: req.requirePayment,
        invoice: req.invoice,
        results: req.results,
        hasResults: req.results && req.results.length > 0,
        isCritical: req.results?.some((r) => r.status === 'CRITICAL') || false,
        treatmentId: req.treatmentId,
      })),
      // Lab tests (order-based)
      ...labTests.map((test) => ({
        id: test.id,
        type: 'LAB_TEST' as const,
        source: 'EXTERNAL' as const,
        testName: test.service?.name || 'Unknown Test',
        testType: 'LABORATORY' as const,
        status: test.status,
        createdAt: test.createdAt,
        claimedAt: test.claimedAt,
        startedAt: test.startedAt,
        completedAt: test.completedAt,
        patient: test.order.patient,
        requestedBy: test.order.doctor,
        processedBy: test.labTechnician,
        service: test.service,
        totalPrice: Number(test.totalPrice || 0),
        isPaid: test.order.isPaid,
        requirePayment: true, // External orders always require payment
        invoice: test.order.invoice,
        resultValue: test.resultValue,
        resultUnit: test.resultUnit,
        referenceRange: test.referenceRange,
        isCritical: test.isCritical,
        hasResults: !!test.resultValue,
        notes: test.notes,
        orderId: test.orderId,
      })),
    ];

    // Sort by creation date, most recent first
    unifiedTests.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return unifiedTests;
  }

  async getLabRequestsByTreatment(treatmentId: string) {
    return await this.prisma.labRequest.findMany({
      where: { treatmentId },
      include: {
        requestingProvider: {
          include: { user: true },
        },
        labProvider: {
          include: { user: true },
        },
        results: true,
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async getLabRequestById(id: string) {
    const labRequest = await this.prisma.labRequest.findUnique({
      where: { id },
      include: {
        treatment: {
          include: {
            patient: { include: { user: true } },
          },
        },
        requestingProvider: {
          include: { user: true },
        },
        labProvider: {
          include: { user: true },
        },
        results: {
          include: {
            reviewer: true,
          },
        },
      },
    });

    if (!labRequest) {
      throw new NotFoundException('Lab request not found');
    }

    return labRequest;
  }

  async claimLabRequest(id: string, labProviderId: string) {
    const labRequest = await this.prisma.labRequest.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });

    if (!labRequest) {
      throw new NotFoundException('Lab request not found');
    }

    if (labRequest.labProviderId) {
      throw new ConflictException('Lab request already claimed');
    }

    if (labRequest.status !== 'REQUESTED') {
      throw new ConflictException('Lab request is not available for claiming');
    }

    // Payment validation: Check if payment is required and has been made
    if (labRequest.requirePayment && !labRequest.isPaid) {
      if (labRequest.invoice) {
        throw new ForbiddenException(
          `Payment required before claiming. Invoice ${labRequest.invoice.invoiceNumber} must be paid. Balance: $${Number(labRequest.invoice.balance)}`,
        );
      } else {
        throw new ForbiddenException(
          'Payment required before claiming this lab request',
        );
      }
    }

    // Verify lab provider exists
    const labProvider = await this.prisma.staffMember.findUnique({
      where: { id: labProviderId },
    });

    if (!labProvider) {
      throw new NotFoundException('Lab provider not found');
    }

    return await this.prisma.labRequest.update({
      where: { id },
      data: {
        labProviderId,
        status: 'CLAIMED',
        claimedAt: new Date(),
      },
      include: {
        treatment: {
          include: {
            patient: { include: { user: true } },
          },
        },
        requestingProvider: {
          include: { user: true },
        },
        labProvider: {
          include: { user: true },
        },
      },
    });
  }

  async startLabRequest(id: string) {
    const labRequest = await this.prisma.labRequest.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });

    if (!labRequest) {
      throw new NotFoundException('Lab request not found');
    }

    if (!labRequest.labProviderId) {
      throw new ConflictException('Lab request must be claimed first');
    }

    if (labRequest.status !== 'CLAIMED' && labRequest.status !== 'REQUESTED') {
      throw new ConflictException('Lab request cannot be started');
    }

    // Payment validation: Ensure payment has been made if required
    if (labRequest.requirePayment && !labRequest.isPaid) {
      throw new ForbiddenException(
        'Payment must be completed before starting this lab request',
      );
    }

    return await this.prisma.labRequest.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        treatment: {
          include: {
            patient: { include: { user: true } },
          },
        },
        requestingProvider: {
          include: { user: true },
        },
        labProvider: {
          include: { user: true },
        },
      },
    });
  }

  async completeLabRequest(id: string, completeLabRequestDto: any) {
    const labRequest = await this.prisma.labRequest.findUnique({
      where: { id },
    });

    if (!labRequest) {
      throw new NotFoundException('Lab request not found');
    }

    if (labRequest.status !== 'IN_PROGRESS') {
      throw new ConflictException('Lab request is not in progress');
    }

    const { results, labProviderId } = completeLabRequestDto;

    // Update lab request status and create results
    return await this.prisma.$transaction(async (tx) => {
      // Create lab results
      await Promise.all(
        results.map((result) =>
          tx.labResult.create({
            data: {
              labRequestId: id,
              resultType: result.resultType,
              resultValue: result.resultValue,
              normalRange: result.normalRange,
              unit: result.unit,
              status: result.status || 'PENDING',
              notes: result.notes,
              completedAt: new Date(),
            },
          }),
        ),
      );

      // Update lab request
      const updatedRequest = await tx.labRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          labProviderId: labProviderId || labRequest.labProviderId,
        },
        include: {
          treatment: {
            include: {
              patient: { include: { user: true } },
            },
          },
          requestingProvider: {
            include: { user: true },
          },
          labProvider: {
            include: { user: true },
          },
          results: true,
        },
      });

      return updatedRequest;
    });
  }

  async cancelLabRequest(id: string, reason?: string) {
    const labRequest = await this.prisma.labRequest.findUnique({
      where: { id },
    });

    if (!labRequest) {
      throw new NotFoundException('Lab request not found');
    }

    if (labRequest.status === 'COMPLETED') {
      throw new ConflictException('Cannot cancel a completed lab request');
    }

    return await this.prisma.labRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        treatment: {
          include: {
            patient: { include: { user: true } },
          },
        },
        requestingProvider: {
          include: { user: true },
        },
        labProvider: {
          include: { user: true },
        },
      },
    });
  }

  async getAssignedLabRequests(providerId: string) {
    return await this.prisma.labRequest.findMany({
      where: {
        labProviderId: providerId,
        status: { in: ['CLAIMED', 'IN_PROGRESS'] },
      },
      include: {
        treatment: {
          include: {
            patient: { include: { user: true } },
          },
        },
        requestingProvider: {
          include: { user: true },
        },
        results: true,
      },
      orderBy: [{ urgency: 'asc' }, { requestedAt: 'asc' }],
    });
  }
}
