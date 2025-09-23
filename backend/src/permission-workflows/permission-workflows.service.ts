import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePermissionRequestDto } from '../permission-requests/dto/create-permission-request.dto';
import { UpdatePermissionRequestDto } from '../permission-requests/dto/update-permission-request.dto';
import { ApprovePermissionRequestDto } from '../permission-requests/dto/approve-permission-request.dto';
import { UserPermissionsService } from '../users/user-permissions.service';
import {
  PermissionRequestStatus,
  PermissionApprovalStatus,
} from '@prisma/client';

@Injectable()
export class PermissionWorkflowsService {
  constructor(
    private prisma: PrismaService,
    private userPermissionsService: UserPermissionsService,
  ) {}

  async createPermissionRequest(
    createDto: CreatePermissionRequestDto,
    requesterId: string,
  ) {
    const { permission, reason, urgency, expiresAt, approverIds } = createDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${requesterId}' not found`);
    }

    // Validate approvers
    if (!approverIds || approverIds.length === 0) {
      throw new BadRequestException('At least one approver is required');
    }

    // Validate approver permissions
    for (const approverId of approverIds) {
      const approverUser = await this.prisma.user.findUnique({
        where: { id: approverId },
      });

      if (!approverUser) {
        throw new NotFoundException(
          `Approver user with ID '${approverId}' not found`,
        );
      }

      // Check if approver has permission to approve this type of permission
      const hasApprovalPermission =
        await this.userPermissionsService.hasAnyPermission(approverId, [
          'approve_permission_requests',
          'admin',
        ]);

      if (!hasApprovalPermission) {
        throw new BadRequestException(
          `User '${approverUser.firstName} ${approverUser.lastName}' does not have approval permissions`,
        );
      }
    }

    // Create permission request
    const permissionRequest = await this.prisma.permissionRequest.create({
      data: {
        requesterId,
        permission,
        reason,
        urgency,
        status: 'PENDING',
        requestedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        approvers: {
          create: approverIds.map((approverId) => ({
            userId: approverId,
            role: 'APPROVER',
            status: 'PENDING',
            required: true,
          })),
        },
      },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return permissionRequest;
  }

  async findAllPermissionRequests(filters?: {
    requesterId?: string;
    permission?: string;
    status?: string;
    urgency?: string;
  }) {
    const where: any = {};

    if (filters?.requesterId) {
      where.requesterId = filters.requesterId;
    }

    if (filters?.permission) {
      where.permission = filters.permission;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.urgency) {
      where.urgency = filters.urgency;
    }

    return this.prisma.permissionRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvers: {
          include: {
            user: {
              select: {
                id: true,
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

  async findPermissionRequestById(id: string) {
    const permissionRequest = await this.prisma.permissionRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!permissionRequest) {
      throw new NotFoundException(
        `Permission request with ID '${id}' not found`,
      );
    }

    return permissionRequest;
  }

  async findPermissionRequestsByUser(userId: string) {
    return this.prisma.permissionRequest.findMany({
      where: { requesterId: userId },
      orderBy: { requestedAt: 'desc' },
      include: {
        approvers: {
          include: {
            user: {
              select: {
                id: true,
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

  async findPendingApprovalsForUser(userId: string) {
    return this.prisma.permissionRequest.findMany({
      where: {
        approvers: {
          some: {
            userId,
            status: 'PENDING',
          },
        },
        status: 'PENDING',
      },
      orderBy: { requestedAt: 'asc' },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvers: {
          include: {
            user: {
              select: {
                id: true,
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

  async approvePermissionRequest(
    requestId: string,
    approverId: string,
    approveDto: ApprovePermissionRequestDto,
  ) {
    const permissionRequest = await this.prisma.permissionRequest.findUnique({
      where: { id: requestId },
      include: {
        approvers: {
          where: { userId: approverId },
        },
        requester: true,
      },
    });

    if (!permissionRequest) {
      throw new NotFoundException(
        `Permission request with ID '${requestId}' not found`,
      );
    }

    if (permissionRequest.status !== PermissionRequestStatus.PENDING) {
      throw new BadRequestException(
        'Permission request is not pending approval',
      );
    }

    const approver = permissionRequest.approvers[0];
    if (!approver) {
      throw new BadRequestException('You are not an approver for this request');
    }

    if (approver.status !== PermissionApprovalStatus.PENDING) {
      throw new BadRequestException('You have already processed this request');
    }

    // Update approver status
    await this.prisma.permissionApprover.update({
      where: { id: approver.id },
      data: {
        status: approveDto.status,
        comments: approveDto.comments,
        approvedAt: new Date(),
      },
    });

    // Check if all required approvers have approved
    const allApprovers = await this.prisma.permissionApprover.findMany({
      where: { permissionRequestId: requestId },
    });

    const requiredApprovers = allApprovers.filter((a) => a.required);
    const approvedRequiredApprovers = requiredApprovers.filter(
      (a) => a.status === PermissionApprovalStatus.APPROVED,
    );
    const rejectedApprovers = allApprovers.filter(
      (a) => a.status === PermissionApprovalStatus.REJECTED,
    );

    let newStatus: PermissionRequestStatus = PermissionRequestStatus.PENDING;

    if (rejectedApprovers.length > 0) {
      newStatus = PermissionRequestStatus.REJECTED;
    } else if (approvedRequiredApprovers.length === requiredApprovers.length) {
      newStatus = PermissionRequestStatus.APPROVED;
    }

    // Update request status
    const updatedRequest = await this.prisma.permissionRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // If approved, grant the permission
    if (newStatus === PermissionRequestStatus.APPROVED) {
      await this.grantApprovedPermission(updatedRequest);
    }

    return updatedRequest;
  }

  async updatePermissionRequest(
    id: string,
    updateDto: UpdatePermissionRequestDto,
    updatedBy: string,
  ) {
    const permissionRequest = await this.prisma.permissionRequest.findUnique({
      where: { id },
    });

    if (!permissionRequest) {
      throw new NotFoundException(
        `Permission request with ID '${id}' not found`,
      );
    }

    if (permissionRequest.status !== PermissionRequestStatus.PENDING) {
      throw new BadRequestException(
        'Cannot update non-pending permission request',
      );
    }

    // Check if user has permission to update
    if (permissionRequest.requesterId !== updatedBy) {
      const hasPermission = await this.userPermissionsService.hasAnyPermission(
        updatedBy,
        ['manage_permission_requests', 'admin'],
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to update this request',
        );
      }
    }

    const updatedRequest = await this.prisma.permissionRequest.update({
      where: { id },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updatedRequest;
  }

  async cancelPermissionRequest(id: string, cancelledBy: string) {
    const permissionRequest = await this.prisma.permissionRequest.findUnique({
      where: { id },
    });

    if (!permissionRequest) {
      throw new NotFoundException(
        `Permission request with ID '${id}' not found`,
      );
    }

    if (permissionRequest.status !== PermissionRequestStatus.PENDING) {
      throw new BadRequestException(
        'Cannot cancel non-pending permission request',
      );
    }

    // Check if user has permission to cancel
    if (permissionRequest.requesterId !== cancelledBy) {
      const hasPermission = await this.userPermissionsService.hasAnyPermission(
        cancelledBy,
        ['manage_permission_requests', 'admin'],
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to cancel this request',
        );
      }
    }

    const cancelledRequest = await this.prisma.permissionRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return cancelledRequest;
  }

  private async grantApprovedPermission(permissionRequest: any) {
    // This method would integrate with the temporary permissions system
    // For now, we'll just log that the permission should be granted
    console.log(
      `Permission ${permissionRequest.permission} should be granted to user ${permissionRequest.requesterId}`,
    );

    // In a real implementation, you would:
    // 1. Create a temporary permission
    // 2. Send notification to the requester
    // 3. Log the approval in audit trail
    // 4. Update any related systems
  }

  // Utility methods
  async getPermissionRequestStats() {
    const stats = await this.prisma.permissionRequest.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const total = stats.reduce((sum, stat) => sum + stat._count.status, 0);

    return {
      total,
      byStatus: stats.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async cleanupExpiredRequests() {
    const expiredRequests = await this.prisma.permissionRequest.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lte: new Date() },
      },
    });

    for (const request of expiredRequests) {
      await this.prisma.permissionRequest.update({
        where: { id: request.id },
        data: { status: 'EXPIRED' },
      });
    }

    return {
      message: `Cleaned up ${expiredRequests.length} expired permission requests`,
    };
  }
}
