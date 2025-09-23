import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UserPermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all permissions for a user by aggregating from their roles
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        staffMember: {
          include: {
            roleAssignments: {
              where: { isActive: true },
              include: {
                role: {
                  select: {
                    permissions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    // Check if user has direct admin permissions
    if (user.permissions && Array.isArray(user.permissions)) {
      if (user.permissions.includes('admin')) {
        return ['admin']; // Admin has all permissions
      }
    }

    // Aggregate permissions from roles
    const rolePermissions: string[] = [];

    if (user.staffMember?.roleAssignments) {
      for (const assignment of user.staffMember.roleAssignments) {
        if (
          assignment.role.permissions &&
          Array.isArray(assignment.role.permissions)
        ) {
          const rolePerms = assignment.role.permissions as string[];
          rolePermissions.push(...rolePerms);
        }
      }
    }

    // Add direct user permissions (excluding admin)
    if (user.permissions && Array.isArray(user.permissions)) {
      const directPermissions = (user.permissions as string[]).filter(
        (p) => p !== 'admin',
      );
      rolePermissions.push(...directPermissions);
    }

    // Remove duplicates and return
    return [...new Set(rolePermissions)];
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    // Admin has all permissions
    if (permissions.includes('admin')) {
      return true;
    }

    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(
    userId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    // Admin has all permissions
    if (permissions.includes('admin')) {
      return true;
    }

    return requiredPermissions.some((permission) =>
      permissions.includes(permission),
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(
    userId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    // Admin has all permissions
    if (permissions.includes('admin')) {
      return true;
    }

    return requiredPermissions.every((permission) =>
      permissions.includes(permission),
    );
  }

  /**
   * Update user's direct permissions
   */
  async updateUserPermissions(
    userId: string,
    permissions: string[],
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { permissions },
    });
  }

  /**
   * Add a permission directly to a user
   */
  async addUserPermission(userId: string, permission: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentPermissions = (user.permissions as string[]) || [];

    if (!currentPermissions.includes(permission)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { permissions: [...currentPermissions, permission] },
      });
    }
  }

  /**
   * Remove a permission directly from a user
   */
  async removeUserPermission(
    userId: string,
    permission: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentPermissions = (user.permissions as string[]) || [];
    const updatedPermissions = currentPermissions.filter(
      (p) => p !== permission,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { permissions: updatedPermissions },
    });
  }

  /**
   * Refresh user permissions by recalculating from roles
   * This should be called when roles are assigned/removed
   */
  async refreshUserPermissions(userId: string): Promise<void> {
    const permissions = await this.getUserPermissions(userId);

    // Update the user's permissions field
    await this.prisma.user.update({
      where: { id: userId },
      data: { permissions },
    });
  }

  /**
   * Get users with specific permissions
   */
  async getUsersWithPermission(permission: string): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { permissions: { array_contains: [permission] } },
          { permissions: { array_contains: ['admin'] } },
        ],
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  /**
   * Get users with any of the specified permissions
   */
  async getUsersWithAnyPermission(permissions: string[]): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          ...permissions.map((permission) => ({
            permissions: { array_contains: [permission] },
          })),
          { permissions: { array_contains: ['admin'] } },
        ],
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }
}
