import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(identifier: string, password: string): Promise<any> {
    // Try to find user by username or email
    const user = await this.usersService.findByUsernameOrEmail(identifier);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    // Get user permissions from roles
    const userPermissions = await this.getUserPermissions(user.id);

    // Get staff member information
    const staffMember = await this.prisma.staffMember.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        employeeId: true,
        departmentId: true,
        specialization: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: userPermissions,
        staffMember: staffMember,
      },
    };
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Get staff member for this user
      const staffMember = await this.prisma.staffMember.findFirst({
        where: { userId },
        include: {
          roleAssignments: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!staffMember) {
        // If no staff member, return direct user permissions
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { permissions: true },
        });
        return (user?.permissions as string[]) || [];
      }

      // Aggregate permissions from all assigned roles
      const rolePermissions: string[] = [];
      for (const assignment of staffMember.roleAssignments) {
        if (assignment.role?.permissions) {
          const permissions = assignment.role.permissions as string[];
          rolePermissions.push(...permissions);
        }
      }

      // Get direct user permissions
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { permissions: true },
      });
      const directPermissions = (user?.permissions as string[]) || [];

      // Combine and deduplicate permissions
      const allPermissions = [...rolePermissions, ...directPermissions];
      const uniquePermissions = [...new Set(allPermissions)]; // Remove duplicates

      // If user has '*' permission, return only that (it means all permissions)
      if (
        uniquePermissions.includes('*') ||
        uniquePermissions.includes('admin')
      ) {
        return ['admin'];
      }

      return uniquePermissions;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async debugUserPermissions(userId: string) {
    try {
      console.log(`🔍 Debug: Fetching permissions for user: ${userId}`);

      // Get staff member for this user
      const staffMember = await this.prisma.staffMember.findFirst({
        where: { userId },
        include: {
          roleAssignments: {
            include: {
              role: true,
            },
          },
        },
      });

      console.log(`👤 Debug: Staff member found:`, staffMember ? 'Yes' : 'No');
      console.log(
        `👤 Debug: Staff member data:`,
        JSON.stringify(staffMember, null, 2),
      );

      if (!staffMember) {
        // If no staff member, return direct user permissions
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { permissions: true },
        });
        console.log(`👤 Debug: Direct user permissions:`, user?.permissions);
        return {
          userId,
          staffMember: null,
          directPermissions: user?.permissions || [],
          rolePermissions: [],
          finalPermissions: user?.permissions || [],
        };
      }

      console.log(
        `🎭 Debug: Staff role assignments:`,
        staffMember.roleAssignments.length,
      );

      // Aggregate permissions from all assigned roles
      const rolePermissions: string[] = [];
      for (const assignment of staffMember.roleAssignments) {
        console.log(
          `🎭 Debug: Role assignment:`,
          assignment.role?.name,
          assignment.role?.permissions,
        );
        if (assignment.role?.permissions) {
          const permissions = assignment.role.permissions as string[];
          rolePermissions.push(...permissions);
        }
      }

      // Get direct user permissions
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { permissions: true },
      });
      const directPermissions = (user?.permissions as string[]) || [];

      console.log(`🎭 Debug: Role permissions:`, rolePermissions);
      console.log(`👤 Debug: Direct permissions:`, directPermissions);

      // Combine and deduplicate permissions
      const allPermissions = [...rolePermissions, ...directPermissions];
      const uniquePermissions = [...new Set(allPermissions)]; // Remove duplicates

      console.log(`✅ Debug: Final permissions:`, uniquePermissions);

      return {
        userId,
        staffMember: {
          id: staffMember.id,
          employeeId: staffMember.employeeId,
          roleAssignments: staffMember.roleAssignments.map((ra) => ({
            id: ra.id,
            roleName: ra.role?.name,
            rolePermissions: ra.role?.permissions,
          })),
        },
        directPermissions,
        rolePermissions,
        finalPermissions: uniquePermissions,
      };
    } catch (error) {
      console.error('Debug: Error fetching user permissions:', error);
      return {
        userId,
        error: error.message,
        staffMember: null,
        directPermissions: [],
        rolePermissions: [],
        finalPermissions: [],
      };
    }
  }
}
