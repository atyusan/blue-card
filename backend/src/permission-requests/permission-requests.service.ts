import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePermissionRequestDto } from './dto/create-permission-request.dto';
import { UpdatePermissionRequestDto } from './dto/update-permission-request.dto';
import { ApprovePermissionRequestDto } from './dto/approve-permission-request.dto';
import { UserPermissionsService } from '../users/user-permissions.service';
import {
  PermissionRequestStatus,
  PermissionApprovalStatus,
  PermissionRequestUrgency,
} from '@prisma/client';

@Injectable()
export class PermissionRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  async create(
    createPermissionRequestDto: CreatePermissionRequestDto,
    requesterId: string,
  ) {
    const { permission, reason, urgency, expiresAt, approverIds } =
      createPermissionRequestDto;

    // Validate that the permission exists in the system
    // This could be enhanced to check against a permissions registry
    if (!permission || permission.trim() === '') {
      throw new BadRequestException('Permission is required');
    }

    // Create the permission request
    const permissionRequest = await this.prisma.permissionRequest.create({
      data: {
        requesterId,
        permission,
        reason,
        urgency,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: PermissionRequestStatus.PENDING,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create approver assignments
    if (approverIds && approverIds.length > 0) {
      const approvers = approverIds.map((userId) => ({
        permissionRequestId: permissionRequest.id,
        userId,
        role: 'APPROVER',
        status: PermissionApprovalStatus.PENDING,
        required: true,
      }));

      await this.prisma.permissionApprover.createMany({
        data: approvers,
      });
    }

    // Return the created request with approvers
    return this.findById(permissionRequest.id);
  }

  async findAll(filters?: {
    status?: string;
    urgency?: string;
    requesterId?: string;
    approverId?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.urgency) {
      where.urgency = filters.urgency;
    }

    if (filters?.requesterId) {
      where.requesterId = filters.requesterId;
    }

    if (filters?.approverId) {
      where.approvers = {
        some: {
          userId: filters.approverId,
        },
      };
    }

    return this.prisma.permissionRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
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
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const permissionRequest = await this.prisma.permissionRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
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
      throw new NotFoundException(`Permission request with ID ${id} not found`);
    }

    return permissionRequest;
  }

  async update(
    id: string,
    updatePermissionRequestDto: UpdatePermissionRequestDto,
  ) {
    await this.findById(id); // Verify the request exists

    const { reason, urgency, expiresAt, status } = updatePermissionRequestDto;

    return this.prisma.permissionRequest.update({
      where: { id },
      data: {
        reason,
        urgency,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status,
        updatedAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
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

  async approve(
    id: string,
    approverId: string,
    approveDto: ApprovePermissionRequestDto,
  ) {
    const { status, comments } = approveDto;

    // Find the permission request and approver
    const permissionRequest = await this.prisma.permissionRequest.findUnique({
      where: { id },
      include: {
        approvers: true,
      },
    });

    if (!permissionRequest) {
      throw new NotFoundException(`Permission request with ID ${id} not found`);
    }

    // Find the approver assignment
    const approver = permissionRequest.approvers.find(
      (a) => a.userId === approverId,
    );
    if (!approver) {
      throw new BadRequestException('User is not an approver for this request');
    }

    // Update the approver status
    await this.prisma.permissionApprover.update({
      where: { id: approver.id },
      data: {
        status,
        comments,
        approvedAt:
          status === PermissionApprovalStatus.APPROVED ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    // Check if all required approvers have approved
    const allApprovers = await this.prisma.permissionApprover.findMany({
      where: { permissionRequestId: id },
    });

    const allRequiredApproved = allApprovers
      .filter((a) => a.required)
      .every((a) => a.status === PermissionApprovalStatus.APPROVED);

    const anyRejected = allApprovers.some(
      (a) => a.status === PermissionApprovalStatus.REJECTED,
    );

    let newStatus = permissionRequest.status;
    if (anyRejected) {
      newStatus = PermissionRequestStatus.REJECTED;
    } else if (allRequiredApproved) {
      newStatus = PermissionRequestStatus.APPROVED;
    }

    // Update the permission request status if needed
    if (newStatus !== permissionRequest.status) {
      await this.prisma.permissionRequest.update({
        where: { id },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      // If approved, grant the temporary permission
      if (newStatus === PermissionRequestStatus.APPROVED) {
        await this.grantTemporaryPermission(permissionRequest);
      }
    }

    return this.findById(id);
  }

  async reject(id: string, approverId: string, reason: string) {
    return this.approve(id, approverId, {
      status: PermissionApprovalStatus.REJECTED,
      comments: reason,
    });
  }

  async cancel(id: string, requesterId: string) {
    const permissionRequest = await this.findById(id);

    if (permissionRequest.requesterId !== requesterId) {
      throw new BadRequestException(
        'Only the requester can cancel a permission request',
      );
    }

    if (permissionRequest.status !== PermissionRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    return this.prisma.permissionRequest.update({
      where: { id },
      data: {
        status: PermissionRequestStatus.CANCELLED,
        updatedAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
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

  async remove(id: string) {
    await this.findById(id); // Verify the request exists

    return this.prisma.permissionRequest.delete({
      where: { id },
    });
  }

  private async grantTemporaryPermission(permissionRequest: any) {
    // Calculate expiration time (default to 24 hours if not specified)
    const expiresAt =
      permissionRequest.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create temporary permission
    await this.prisma.temporaryPermission.create({
      data: {
        userId: permissionRequest.requesterId,
        permission: permissionRequest.permission,
        grantedBy: permissionRequest.approvers[0]?.userId || 'SYSTEM', // Use first approver or SYSTEM
        grantedAt: new Date(),
        expiresAt,
        reason: `Granted via permission request: ${permissionRequest.reason}`,
        isActive: true,
      },
    });

    // Refresh user permissions
    await this.userPermissionsService.refreshUserPermissions(
      permissionRequest.requesterId,
    );
  }

  async getStats() {
    const total = await this.prisma.permissionRequest.count();
    const pending = await this.prisma.permissionRequest.count({
      where: { status: PermissionRequestStatus.PENDING },
    });
    const approved = await this.prisma.permissionRequest.count({
      where: { status: PermissionRequestStatus.APPROVED },
    });
    const rejected = await this.prisma.permissionRequest.count({
      where: { status: PermissionRequestStatus.REJECTED },
    });

    return {
      total,
      pending,
      approved,
      rejected,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
    };
  }
}
