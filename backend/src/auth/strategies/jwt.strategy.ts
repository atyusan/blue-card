import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('jwt.secret');
    const jwtIssuer =
      configService.get<string>('jwt.issuer') || 'hospital-billing-system';
    const jwtAudience =
      configService.get<string>('jwt.audience') || 'hospital-users';

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in configuration');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      issuer: jwtIssuer,
      audience: jwtAudience,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Get staff member information if it exists
    const staffMember = await this.prisma.staffMember.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        employeeId: true,
        departmentId: true,
        specialization: true,
        licenseNumber: true,
        serviceProvider: true,
        hireDate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Get user's direct permissions
    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { permissions: true },
    });

    // Get user's role-based permissions if they are a staff member
    let rolePermissions: string[] = [];
    if (staffMember) {
      const staffRoleAssignments =
        await this.prisma.staffRoleAssignment.findMany({
          where: {
            staffMemberId: staffMember.id,
            isActive: true,
          },
          include: {
            role: {
              select: {
                permissions: true,
                isActive: true,
              },
            },
          },
        });

      // Aggregate permissions from all active roles
      rolePermissions = staffRoleAssignments
        .filter((assignment) => assignment.role.isActive)
        .flatMap((assignment) => {
          const permissions = assignment.role.permissions;
          if (Array.isArray(permissions)) {
            return permissions.filter(
              (p): p is string => typeof p === 'string',
            );
          }
          return [];
        });
    }

    // Combine direct user permissions and role-based permissions (remove duplicates)
    const directPermissions = Array.isArray(userWithPermissions?.permissions)
      ? (userWithPermissions.permissions as string[])
      : [];

    const allPermissions = [
      ...new Set([...directPermissions, ...rolePermissions]),
    ];

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      staffMemberId: staffMember?.id,
      staffMember: staffMember,
      permissions: allPermissions,
    };
  }
}
