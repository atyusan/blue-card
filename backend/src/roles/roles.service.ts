import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UserPermissionsService } from '../users/user-permissions.service';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private userPermissionsService: UserPermissionsService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    // Check if role with same name or code already exists
    const existingRole = await this.prisma.role.findFirst({
      where: {
        OR: [{ name: createRoleDto.name }, { code: createRoleDto.code }],
      },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name or code already exists');
    }

    const role = await this.prisma.role.create({
      data: createRoleDto,
    });

    return role;
  }

  async findAll(query?: { isActive?: boolean; search?: string }) {
    const where: any = {};

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.role.findMany({
      where,
      include: {
        _count: {
          select: {
            staffRoleAssignments: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        staffRoleAssignments: {
          where: { isActive: true },
          include: {
            staffMember: {
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
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByCode(code: string) {
    const role = await this.prisma.role.findUnique({
      where: { code },
    });

    if (!role) {
      throw new NotFoundException(`Role with code ${code} not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if name or code conflicts with other roles
    if (updateRoleDto.name || updateRoleDto.code) {
      const conflictingRole = await this.prisma.role.findFirst({
        where: {
          OR: [
            ...(updateRoleDto.name ? [{ name: updateRoleDto.name }] : []),
            ...(updateRoleDto.code ? [{ code: updateRoleDto.code }] : []),
          ],
          NOT: { id },
        },
      });

      if (conflictingRole) {
        throw new ConflictException(
          'Role with this name or code already exists',
        );
      }
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });

    return updatedRole;
  }

  async remove(id: string) {
    // Check if role exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        staffRoleAssignments: { select: { id: true } },
      },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check if role has associated staff members
    if (existingRole.staffRoleAssignments.length > 0) {
      throw new ConflictException(
        'Cannot delete role with associated staff members',
      );
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { message: 'Role deleted successfully' };
  }

  async assignRoleToStaff(
    staffId: string,
    assignRoleDto: AssignRoleDto,
    assignedBy?: string,
    scope?: string,
    scopeId?: string,
    conditions?: any,
    expiresAt?: Date,
  ) {
    const { roleId } = assignRoleDto;

    // Check if staff member exists
    const staffMember = await this.prisma.staffMember.findUnique({
      where: { id: staffId },
    });

    if (!staffMember) {
      throw new NotFoundException(`Staff member with ID ${staffId} not found`);
    }

    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check if role is already assigned to this staff member
    const existingAssignment = await this.prisma.staffRoleAssignment.findFirst({
      where: {
        staffMemberId: staffId,
        roleId: roleId,
        scope: scope || 'GLOBAL',
        scopeId: scopeId || null,
      },
    });

    if (existingAssignment) {
      if (existingAssignment.isActive) {
        throw new ConflictException(
          'Role is already assigned to this staff member',
        );
      } else {
        // Reactivate existing assignment
        const reactivatedAssignment =
          await this.prisma.staffRoleAssignment.update({
            where: { id: existingAssignment.id },
            data: {
              isActive: true,
              assignedAt: new Date(),
              assignedBy,
              scope,
              scopeId,
              conditions,
              expiresAt,
            },
          });

        // Refresh user permissions after role reactivation
        if (reactivatedAssignment.staffMemberId) {
          const staffMember = await this.prisma.staffMember.findUnique({
            where: { id: reactivatedAssignment.staffMemberId },
            select: { userId: true },
          });

          if (staffMember?.userId) {
            await this.userPermissionsService.refreshUserPermissions(
              staffMember.userId,
            );
          }
        }

        return reactivatedAssignment;
      }
    }

    // Create new role assignment
    const roleAssignment = await this.prisma.staffRoleAssignment.create({
      data: {
        staffMemberId: staffId,
        roleId: roleId,
        assignedBy,
        scope,
        scopeId,
        conditions,
        expiresAt,
      },
    });

    // Refresh user permissions after role assignment
    if (roleAssignment.staffMemberId) {
      const staffMember = await this.prisma.staffMember.findUnique({
        where: { id: roleAssignment.staffMemberId },
        select: { userId: true },
      });

      if (staffMember?.userId) {
        await this.userPermissionsService.refreshUserPermissions(
          staffMember.userId,
        );
      }
    }

    return roleAssignment;
  }

  async removeRoleFromStaff(staffId: string, roleId: string) {
    const roleAssignment = await this.prisma.staffRoleAssignment.findFirst({
      where: {
        staffMemberId: staffId,
        roleId: roleId,
        isActive: true,
      },
    });

    if (!roleAssignment) {
      throw new NotFoundException(
        'Role assignment not found for this staff member',
      );
    }

    await this.prisma.staffRoleAssignment.update({
      where: { id: roleAssignment.id },
      data: { isActive: false },
    });

    // Refresh user permissions after role removal
    if (roleAssignment.staffMemberId) {
      const staffMember = await this.prisma.staffMember.findUnique({
        where: { id: roleAssignment.staffMemberId },
        select: { userId: true },
      });

      if (staffMember?.userId) {
        await this.userPermissionsService.refreshUserPermissions(
          staffMember.userId,
        );
      }
    }

    return { message: 'Role removed from staff member successfully' };
  }

  async getStaffRoles(staffId: string) {
    const roleAssignments = await this.prisma.staffRoleAssignment.findMany({
      where: { staffMemberId: staffId, isActive: true },
      include: {
        role: true,
        assignedByStaff: {
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
      orderBy: { assignedAt: 'desc' },
    });

    return roleAssignments;
  }

  async getRoleStats(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            staffRoleAssignments: true,
          },
        },
        staffRoleAssignments: {
          where: { isActive: true },
          include: {
            staffMember: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Group staff members by department
    const departmentStats = role.staffRoleAssignments.reduce(
      (acc, assignment) => {
        const deptName = assignment.staffMember.department?.name || 'Unknown';
        if (!acc[deptName]) {
          acc[deptName] = 0;
        }
        acc[deptName]++;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      id: role.id,
      name: role.name,
      code: role.code,
      totalAssignments: role.staffRoleAssignments.length,
      activeAssignments: role.staffRoleAssignments.length,
      departmentDistribution: departmentStats,
    };
  }
}
