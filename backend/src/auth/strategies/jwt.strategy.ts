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
      select: { id: true, employeeId: true, department: true },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      staffMemberId: staffMember?.id,
      employeeId: staffMember?.employeeId,
      department: staffMember?.department,
    };
  }
}
