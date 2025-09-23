import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCashRequestDto } from './dto/create-cash-request.dto';
import { UpdateCashRequestDto } from './dto/update-cash-request.dto';
import { QueryCashRequestDto } from './dto/query-cash-request.dto';
import { ApproveCashRequestDto } from './dto/approve-cash-request.dto';
import { RejectCashRequestDto } from './dto/reject-cash-request.dto';
import { RequestStatus, RequestUrgency } from './entities/cash-request.enums';
import { TransactionType } from '@prisma/client';

@Injectable()
export class CashRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a unique request number
   */
  private async generateRequestNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get the count of requests for today
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    const count = await this.prisma.cashRequest.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(3, '0');
    return `CR-${dateStr}-${sequence}`;
  }

  /**
   * Create a new cash request
   */
  async create(
    createCashRequestDto: CreateCashRequestDto,
    requesterId: string,
  ) {
    const requestNumber = await this.generateRequestNumber();

    return this.prisma.cashRequest.create({
      data: {
        ...createCashRequestDto,
        requestNumber,
        requesterId,
        urgency: createCashRequestDto.urgency || RequestUrgency.NORMAL,
        status: RequestStatus.PENDING,
        attachments: createCashRequestDto.attachments || [],
      },
      include: {
        requester: {
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
  }

  /**
   * Find all cash requests with pagination and filtering
   */
  async findAll(query: QueryCashRequestDto, userId: string) {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      urgency,
      status,
      requesterId,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } }, // Removed department search
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (urgency) {
      where.urgency = urgency;
    }

    if (status) {
      where.status = status;
    }

    if (requesterId) {
      where.requesterId = requesterId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await this.prisma.cashRequest.count({ where });

    // Get requests with pagination
    const requests = await this.prisma.cashRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
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
        approver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        rejector: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        cashTransactions: true,
      },
    });

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a cash request by ID
   */
  async findOne(id: string) {
    const request = await this.prisma.cashRequest.findUnique({
      where: { id },
      include: {
        requester: {
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
        approver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        rejector: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        cashTransactions: {
          include: {
            cashier: {
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
    });

    if (!request) {
      throw new NotFoundException(`Cash request with ID ${id} not found`);
    }

    return request;
  }

  /**
   * Update a cash request
   */
  async update(
    id: string,
    updateCashRequestDto: UpdateCashRequestDto,
    userId: string,
  ) {
    const request = await this.findOne(id);

    // Only the requester can update their own request if it's still pending
    if (
      request.requesterId !== userId &&
      request.status !== RequestStatus.PENDING
    ) {
      throw new ForbiddenException(
        'You can only update your own pending requests',
      );
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        'Cannot update a request that is not pending',
      );
    }

    return this.prisma.cashRequest.update({
      where: { id },
      data: updateCashRequestDto,
      include: {
        requester: {
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
  }

  /**
   * Approve a cash request
   */
  async approve(
    id: string,
    approveCashRequestDto: ApproveCashRequestDto,
    approverId: string,
  ) {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Can only approve pending requests');
    }

    // Update the request status
    const updatedRequest = await this.prisma.cashRequest.update({
      where: { id },
      data: {
        status: RequestStatus.APPROVED,
        approvedBy: approverId,
        approvedAt: new Date(),
        notes: approveCashRequestDto.notes,
      },
      include: {
        requester: {
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
        approver: {
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

    // Create a cash-out transaction for the approved request
    await this.prisma.cashTransaction.create({
      data: {
        cashierId: approverId,
        cashRequestId: id,
        transactionType: TransactionType.CASH_OUT,
        amount: request.amount,
        description: `Cash disbursement for request ${request.requestNumber}: ${request.purpose}`,
        referenceNumber: `CR-${request.requestNumber}`,
        notes: `Approved cash request: ${request.purpose}`,
        status: 'COMPLETED',
      },
    });

    return updatedRequest;
  }

  /**
   * Reject a cash request
   */
  async reject(
    id: string,
    rejectCashRequestDto: RejectCashRequestDto,
    rejectorId: string,
  ) {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Can only reject pending requests');
    }

    return this.prisma.cashRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectedBy: rejectorId,
        rejectedAt: new Date(),
        rejectionReason: rejectCashRequestDto.rejectionReason,
        notes: rejectCashRequestDto.notes,
      },
      include: {
        requester: {
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
        rejector: {
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
  }

  /**
   * Cancel a cash request
   */
  async cancel(id: string, userId: string) {
    const request = await this.findOne(id);

    if (request.requesterId !== userId) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending requests');
    }

    return this.prisma.cashRequest.update({
      where: { id },
      data: {
        status: RequestStatus.CANCELLED,
      },
      include: {
        requester: {
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
  }

  /**
   * Mark a cash request as completed
   */
  async markAsCompleted(id: string, userId: string) {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.APPROVED) {
      throw new BadRequestException(
        'Can only mark approved requests as completed',
      );
    }

    return this.prisma.cashRequest.update({
      where: { id },
      data: {
        status: RequestStatus.COMPLETED,
      },
      include: {
        requester: {
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
        approver: {
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
  }

  /**
   * Delete a cash request
   */
  async remove(id: string, userId: string) {
    const request = await this.findOne(id);

    if (request.requesterId !== userId) {
      throw new ForbiddenException('You can only delete your own requests');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Can only delete pending requests');
    }

    return this.prisma.cashRequest.delete({
      where: { id },
    });
  }

  /**
   * Get cash request statistics
   */
  async getStatistics(userId: string) {
    const totalRequests = await this.prisma.cashRequest.count();
    const pendingRequests = await this.prisma.cashRequest.count({
      where: { status: RequestStatus.PENDING },
    });
    const approvedRequests = await this.prisma.cashRequest.count({
      where: { status: RequestStatus.APPROVED },
    });
    const rejectedRequests = await this.prisma.cashRequest.count({
      where: { status: RequestStatus.REJECTED },
    });

    const totalAmount = await this.prisma.cashRequest.aggregate({
      _sum: { amount: true },
      where: { status: RequestStatus.APPROVED },
    });

    const urgentRequests = await this.prisma.cashRequest.count({
      where: { urgency: RequestUrgency.URGENT, status: RequestStatus.PENDING },
    });

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalAmount: totalAmount._sum.amount || 0,
      urgentRequests,
    };
  }
}
