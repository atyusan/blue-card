import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTemporaryPermissionDto } from './dto/create-temporary-permission.dto';
import { UpdateTemporaryPermissionDto } from './dto/update-temporary-permission.dto';
import { ExtendTemporaryPermissionDto } from './dto/extend-temporary-permission.dto';
import { UserPermissionsService } from '../users/user-permissions.service';

@Injectable()
export class TemporaryPermissionsService {
  constructor(
    private prisma: PrismaService,
    private userPermissionsService: UserPermissionsService,
  ) {}

  async createTemporaryPermission(
    createDto: CreateTemporaryPermissionDto,
    grantedByStaffId: string,
  ) {
    const { userId, permission, expiresAt, reason } = createDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    // Check if staff member exists and has permission to grant permissions
    const grantedByStaff = await this.prisma.staffMember.findUnique({
      where: { id: grantedByStaffId },
      include: { user: true },
    });

    if (!grantedByStaff) {
      throw new NotFoundException(
        `Staff member with ID '${grantedByStaffId}' not found`,
      );
    }

    // Check if the granting staff member has permission to grant this permission
    const hasPermission = await this.userPermissionsService.hasAnyPermission(
      grantedByStaff.userId,
      ['grant_temporary_permissions', 'admin'],
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to grant temporary permissions',
      );
    }

    // Check if temporary permission already exists and is active
    const existingPermission = await this.prisma.temporaryPermission.findFirst({
      where: {
        userId,
        permission,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingPermission) {
      throw new BadRequestException(
        `User already has an active temporary permission for '${permission}'`,
      );
    }

    // Create temporary permission
    const temporaryPermission = await this.prisma.temporaryPermission.create({
      data: {
        userId,
        permission,
        grantedBy: grantedByStaffId,
        expiresAt: new Date(expiresAt),
        reason,
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        grantedByStaff: {
          select: {
            id: true,
            employeeId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Create audit entry
    await this.prisma.permissionAuditEntry.create({
      data: {
        action: 'GRANTED',
        performedBy: grantedByStaffId,
        reason: `Temporary permission granted: ${reason}`,
        temporaryPermissionId: temporaryPermission.id,
        metadata: {
          grantedBy:
            grantedByStaff.user.firstName + ' ' + grantedByStaff.user.lastName,
          duration: this.calculateDuration(new Date(), new Date(expiresAt)),
        },
      },
    });

    // Refresh user permissions
    await this.userPermissionsService.refreshUserPermissions(userId);

    return temporaryPermission;
  }

  async findAllTemporaryPermissions(filters?: {
    userId?: string;
    permission?: string;
    isActive?: boolean;
    grantedBy?: string;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.permission) {
      where.permission = filters.permission;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.grantedBy) {
      where.grantedBy = filters.grantedBy;
    }

    return this.prisma.temporaryPermission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        grantedByStaff: {
          select: {
            id: true,
            employeeId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        auditTrail: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    });
  }

  async findTemporaryPermissionById(id: string) {
    const temporaryPermission =
      await this.prisma.temporaryPermission.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          grantedByStaff: {
            select: {
              id: true,
              employeeId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          auditTrail: {
            orderBy: { timestamp: 'desc' },
          },
        },
      });

    if (!temporaryPermission) {
      throw new NotFoundException(
        `Temporary permission with ID '${id}' not found`,
      );
    }

    return temporaryPermission;
  }

  async findActiveTemporaryPermissionsByUser(userId: string) {
    return this.prisma.temporaryPermission.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
      include: {
        grantedByStaff: {
          select: {
            id: true,
            employeeId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async updateTemporaryPermission(
    id: string,
    updateDto: UpdateTemporaryPermissionDto,
    updatedByStaffId: string,
  ) {
    const temporaryPermission =
      await this.prisma.temporaryPermission.findUnique({
        where: { id },
      });

    if (!temporaryPermission) {
      throw new NotFoundException(
        `Temporary permission with ID '${id}' not found`,
      );
    }

    // Check if the updating staff member has permission
    const hasPermission = await this.userPermissionsService.hasAnyPermission(
      updatedByStaffId,
      ['manage_temporary_permissions', 'admin'],
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to modify temporary permissions',
      );
    }

    const { reason, isActive } = updateDto;

    const updatedPermission = await this.prisma.temporaryPermission.update({
      where: { id },
      data: {
        reason,
        isActive,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        grantedByStaff: {
          select: {
            id: true,
            employeeId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Create audit entry
    await this.prisma.permissionAuditEntry.create({
      data: {
        action: isActive ? 'ACTIVATED' : 'DEACTIVATED',
        performedBy: updatedByStaffId,
        reason: `Permission ${isActive ? 'activated' : 'deactivated'}: ${reason}`,
        temporaryPermissionId: id,
      },
    });

    // Refresh user permissions if status changed
    if (temporaryPermission.isActive !== isActive) {
      await this.userPermissionsService.refreshUserPermissions(
        temporaryPermission.userId,
      );
    }

    return updatedPermission;
  }

  async extendTemporaryPermission(
    id: string,
    extendDto: ExtendTemporaryPermissionDto,
    extendedByStaffId: string,
  ) {
    const temporaryPermission =
      await this.prisma.temporaryPermission.findUnique({
        where: { id },
      });

    if (!temporaryPermission) {
      throw new NotFoundException(
        `Temporary permission with ID '${id}' not found`,
      );
    }

    if (!temporaryPermission.isActive) {
      throw new BadRequestException(
        'Cannot extend an inactive temporary permission',
      );
    }

    // Check if the extending staff member has permission
    const hasPermission = await this.userPermissionsService.hasAnyPermission(
      extendedByStaffId,
      ['manage_temporary_permissions', 'admin'],
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to extend temporary permissions',
      );
    }

    const { newExpiresAt, reason } = extendDto;

    if (new Date(newExpiresAt) <= temporaryPermission.expiresAt) {
      throw new BadRequestException(
        'New expiration date must be after current expiration date',
      );
    }

    const extendedPermission = await this.prisma.temporaryPermission.update({
      where: { id },
      data: {
        expiresAt: new Date(newExpiresAt),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        grantedByStaff: {
          select: {
            id: true,
            employeeId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Create audit entry
    await this.prisma.permissionAuditEntry.create({
      data: {
        action: 'EXTENDED',
        performedBy: extendedByStaffId,
        reason: `Permission extended: ${reason}`,
        temporaryPermissionId: id,
        metadata: {
          oldExpiresAt: temporaryPermission.expiresAt,
          newExpiresAt: new Date(newExpiresAt),
          extendedBy: extendedByStaffId,
        },
      },
    });

    return extendedPermission;
  }

  async revokeTemporaryPermission(
    id: string,
    reason: string,
    revokedByStaffId: string,
  ) {
    const temporaryPermission =
      await this.prisma.temporaryPermission.findUnique({
        where: { id },
      });

    if (!temporaryPermission) {
      throw new NotFoundException(
        `Temporary permission with ID '${id}' not found`,
      );
    }

    if (!temporaryPermission.isActive) {
      throw new BadRequestException('Permission is already inactive');
    }

    // Check if the revoking staff member has permission
    const hasPermission = await this.userPermissionsService.hasAnyPermission(
      revokedByStaffId,
      ['manage_temporary_permissions', 'admin'],
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to revoke temporary permissions',
      );
    }

    const revokedPermission = await this.prisma.temporaryPermission.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        grantedByStaff: {
          select: {
            id: true,
            employeeId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Create audit entry
    await this.prisma.permissionAuditEntry.create({
      data: {
        action: 'REVOKED',
        performedBy: revokedByStaffId,
        reason: `Permission revoked: ${reason}`,
        temporaryPermissionId: id,
      },
    });

    // Refresh user permissions
    await this.userPermissionsService.refreshUserPermissions(
      temporaryPermission.userId,
    );

    return revokedPermission;
  }

  async deleteTemporaryPermission(id: string, deletedByStaffId: string) {
    const temporaryPermission =
      await this.prisma.temporaryPermission.findUnique({
        where: { id },
      });

    if (!temporaryPermission) {
      throw new NotFoundException(
        `Temporary permission with ID '${id}' not found`,
      );
    }

    // Check if the deleting staff member has permission
    const hasPermission = await this.userPermissionsService.hasAnyPermission(
      deletedByStaffId,
      ['manage_temporary_permissions', 'admin'],
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete temporary permissions',
      );
    }

    // Delete audit entries first
    await this.prisma.permissionAuditEntry.deleteMany({
      where: { temporaryPermissionId: id },
    });

    // Delete temporary permission
    await this.prisma.temporaryPermission.delete({
      where: { id },
    });

    // Refresh user permissions if it was active
    if (temporaryPermission.isActive) {
      await this.userPermissionsService.refreshUserPermissions(
        temporaryPermission.userId,
      );
    }

    return { message: 'Temporary permission deleted successfully' };
  }

  // Utility methods
  async cleanupExpiredPermissions() {
    const expiredPermissions = await this.prisma.temporaryPermission.findMany({
      where: {
        isActive: true,
        expiresAt: { lte: new Date() },
      },
    });

    for (const permission of expiredPermissions) {
      await this.prisma.temporaryPermission.update({
        where: { id: permission.id },
        data: { isActive: false },
      });

      await this.prisma.permissionAuditEntry.create({
        data: {
          action: 'EXPIRED',
          performedBy: 'SYSTEM',
          reason: 'Permission expired automatically',
          temporaryPermissionId: permission.id,
        },
      });

      // Refresh user permissions
      await this.userPermissionsService.refreshUserPermissions(
        permission.userId,
      );
    }

    return {
      message: `Cleaned up ${expiredPermissions.length} expired permissions`,
    };
  }

  private calculateDuration(startDate: Date, endDate: Date): string {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
    return `${Math.ceil(diffDays / 365)} years`;
  }
}

