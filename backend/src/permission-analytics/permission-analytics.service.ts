import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserPermissionsService } from '../users/user-permissions.service';

export interface OptimizationSuggestion {
  type: string;
  title: string;
  description: string;
  severity: string;
  permissions: any[];
  recommendations: string[];
}

@Injectable()
export class PermissionAnalyticsService {
  constructor(
    private prisma: PrismaService,
    private userPermissionsService: UserPermissionsService,
  ) {}

  async getUserPermissionUsage(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's current permissions
    const userPermissions =
      await this.userPermissionsService.getUserPermissions(userId);

    // Get temporary permissions
    const temporaryPermissions = await this.prisma.temporaryPermission.findMany(
      {
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      },
    );

    // Get role assignments
    const roleAssignments = await this.prisma.staffRoleAssignment.findMany({
      where: {
        staffMember: { userId },
        isActive: true,
      },
      include: {
        role: {
          select: { permissions: true },
        },
      },
    });

    // Calculate permission usage statistics
    const permissionStats = userPermissions.map((permission) => {
      const tempPermission = temporaryPermissions.find(
        (tp) => tp.permission === permission,
      );
      const roleSources = roleAssignments.filter((ra) =>
        (ra.role.permissions as string[])?.includes(permission),
      );

      return {
        permission,
        source: tempPermission ? 'temporary' : 'role',
        assignedAt: tempPermission?.grantedAt || roleSources[0]?.assignedAt,
        expiresAt: tempPermission?.expiresAt || roleSources[0]?.expiresAt,
        scope: roleSources[0]?.scope || 'GLOBAL',
        isActive: true,
      };
    });

    return {
      userId,
      totalPermissions: userPermissions.length,
      temporaryPermissions: temporaryPermissions.length,
      roleBasedPermissions: roleAssignments.length,
      permissions: permissionStats,
      analysisPeriod: `${days} days`,
    };
  }

  async getPermissionUsageAcrossSystem(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all active role assignments
    const roleAssignments = await this.prisma.staffRoleAssignment.findMany({
      where: {
        isActive: true,
        assignedAt: { gte: startDate },
      },
      include: {
        role: {
          select: { permissions: true },
        },
        staffMember: {
          select: { department: { select: { name: true } } },
        },
      },
    });

    // Get all temporary permissions
    const temporaryPermissions = await this.prisma.temporaryPermission.findMany(
      {
        where: {
          isActive: true,
          grantedAt: { gte: startDate },
        },
      },
    );

    // Aggregate permission usage
    const permissionUsage: Record<string, any> = {};

    // Count role-based permissions
    roleAssignments.forEach((assignment) => {
      const permissions = assignment.role.permissions as string[];
      permissions?.forEach((permission) => {
        if (!permissionUsage[permission]) {
          permissionUsage[permission] = {
            permission,
            totalUsage: 0,
            roleBased: 0,
            temporary: 0,
            departments: new Set(),
            lastUsed: assignment.assignedAt,
          };
        }
        permissionUsage[permission].totalUsage++;
        permissionUsage[permission].roleBased++;
        if (assignment.staffMember.department?.name) {
          permissionUsage[permission].departments.add(
            assignment.staffMember.department.name,
          );
        }
      });
    });

    // Count temporary permissions
    temporaryPermissions.forEach((tempPermission) => {
      if (!permissionUsage[tempPermission.permission]) {
        permissionUsage[tempPermission.permission] = {
          permission: tempPermission.permission,
          totalUsage: 0,
          roleBased: 0,
          temporary: 0,
          departments: new Set(),
          lastUsed: tempPermission.grantedAt,
        };
      }
      permissionUsage[tempPermission.permission].totalUsage++;
      permissionUsage[tempPermission.permission].temporary++;
      permissionUsage[tempPermission.permission].lastUsed =
        tempPermission.grantedAt;
    });

    // Convert to array and format
    const usageArray = Object.values(permissionUsage).map((usage: any) => ({
      ...usage,
      departments: Array.from(usage.departments),
      averageUsagePerDay: Math.round((usage.totalUsage / days) * 100) / 100,
    }));

    return {
      analysisPeriod: `${days} days`,
      totalPermissions: usageArray.length,
      totalUsage: usageArray.reduce((sum, usage) => sum + usage.totalUsage, 0),
      permissions: usageArray.sort((a, b) => b.totalUsage - a.totalUsage),
    };
  }

  async getDepartmentPermissionDistribution() {
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        staffMembers: {
          where: { isActive: true },
          include: {
            roleAssignments: {
              where: { isActive: true },
              include: {
                role: {
                  select: { permissions: true },
                },
              },
            },
          },
        },
      },
    });

    const departmentStats = departments.map((dept) => {
      const allPermissions = new Set<string>();
      let totalRoleAssignments = 0;

      dept.staffMembers.forEach((staff) => {
        staff.roleAssignments.forEach((assignment) => {
          const permissions = assignment.role.permissions as string[];
          permissions?.forEach((permission) => allPermissions.add(permission));
          totalRoleAssignments++;
        });
      });

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code,
        staffCount: dept.staffMembers.length,
        totalRoleAssignments,
        uniquePermissions: allPermissions.size,
        permissions: Array.from(allPermissions),
      };
    });

    return departmentStats.sort(
      (a, b) => b.uniquePermissions - a.uniquePermissions,
    );
  }

  async getPermissionRiskAssessment() {
    // Get all permissions and their usage
    const allPermissions = await this.getAllPermissions();

    const riskAssessment = allPermissions.map((permission) => {
      const riskFactors = this.calculateRiskFactors(permission);
      const riskScore = this.calculateRiskScore(riskFactors);

      return {
        permission: permission.name,
        riskScore,
        riskLevel: this.getRiskLevel(riskScore),
        riskFactors,
        recommendations: this.getRiskRecommendations(riskFactors),
      };
    });

    return riskAssessment.sort((a, b) => b.riskScore - a.riskScore);
  }

  async getPermissionOptimizationSuggestions() {
    const usageStats = await this.getPermissionUsageAcrossSystem(90);

    const suggestions: OptimizationSuggestion[] = [];

    // Find underused permissions
    const underusedPermissions = usageStats.permissions.filter(
      (usage) => usage.averageUsagePerDay < 0.1 && usage.totalUsage < 5,
    );

    if (underusedPermissions.length > 0) {
      suggestions.push({
        type: 'UNDERUSED_PERMISSIONS',
        title: 'Underused Permissions Detected',
        description: `${underusedPermissions.length} permissions are rarely used`,
        severity: 'MEDIUM',
        permissions: underusedPermissions.map((p) => p.permission),
        recommendations: [
          'Consider removing these permissions from roles if they are not essential',
          'Review if these permissions are still needed in the system',
          'Check if users are aware of these permissions',
        ],
      });
    }

    // Find overused permissions
    const overusedPermissions = usageStats.permissions.filter(
      (usage) => usage.averageUsagePerDay > 10,
    );

    if (overusedPermissions.length > 0) {
      suggestions.push({
        type: 'OVERUSED_PERMISSIONS',
        title: 'Overused Permissions Detected',
        description: `${overusedPermissions.length} permissions are used very frequently`,
        severity: 'LOW',
        permissions: overusedPermissions.map((p) => p.permission),
        recommendations: [
          'These permissions might be too broad - consider splitting into more specific ones',
          'Review if these permissions are being used appropriately',
          'Consider implementing additional validation for these permissions',
        ],
      });
    }

    // Find permissions with high temporary usage
    const highTempUsage = usageStats.permissions.filter(
      (usage) => usage.temporary > usage.roleBased * 0.5,
    );

    if (highTempUsage.length > 0) {
      suggestions.push({
        type: 'HIGH_TEMPORARY_USAGE',
        title: 'High Temporary Permission Usage',
        description: `${highTempUsage.length} permissions are frequently granted temporarily`,
        severity: 'MEDIUM',
        permissions: highTempUsage.map((p) => p.permission),
        recommendations: [
          'Consider adding these permissions to appropriate roles',
          'Review if the approval process for temporary permissions is too restrictive',
          'Analyze why these permissions need to be temporary',
        ],
      });
    }

    return suggestions;
  }

  private async getAllPermissions() {
    // Get all unique permissions from roles
    const roles = await this.prisma.role.findMany({
      select: { permissions: true },
    });

    const allPermissions = new Set<string>();
    roles.forEach((role) => {
      const permissions = role.permissions as string[];
      permissions?.forEach((permission) => allPermissions.add(permission));
    });

    return Array.from(allPermissions).map((name) => ({ name }));
  }

  private calculateRiskFactors(permission: any) {
    // This is a simplified risk calculation
    // In a real system, you'd have more sophisticated risk modeling
    const factors = {
      hasTemporaryGrants: false,
      highUsage: false,
      broadScope: false,
      sensitiveOperation: false,
    };

    // Determine if permission is for sensitive operations
    const sensitiveKeywords = ['delete', 'admin', 'system', 'config', 'audit'];
    factors.sensitiveOperation = sensitiveKeywords.some((keyword) =>
      permission.name.toLowerCase().includes(keyword),
    );

    return factors;
  }

  private calculateRiskScore(riskFactors: any) {
    let score = 0;

    if (riskFactors.sensitiveOperation) score += 40;
    if (riskFactors.hasTemporaryGrants) score += 20;
    if (riskFactors.highUsage) score += 15;
    if (riskFactors.broadScope) score += 25;

    return Math.min(score, 100);
  }

  private getRiskLevel(riskScore: number) {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    if (riskScore >= 20) return 'LOW';
    return 'MINIMAL';
  }

  private getRiskRecommendations(riskFactors: any) {
    const recommendations: string[] = [];

    if (riskFactors.sensitiveOperation) {
      recommendations.push(
        'Implement additional approval workflows for this permission',
      );
      recommendations.push(
        'Consider requiring MFA for users with this permission',
      );
      recommendations.push(
        'Implement detailed audit logging for this permission',
      );
    }

    if (riskFactors.hasTemporaryGrants) {
      recommendations.push('Review temporary permission approval process');
      recommendations.push(
        'Implement shorter expiration times for this permission',
      );
      recommendations.push('Add additional validation for temporary grants');
    }

    if (riskFactors.highUsage) {
      recommendations.push('Monitor usage patterns for unusual activity');
      recommendations.push('Consider implementing rate limiting');
      recommendations.push('Review if this permission is too broad');
    }

    return recommendations;
  }
}
