import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createStaffDto: CreateStaffDto) {
    // Check if employee ID already exists
    const existingStaff = await this.prisma.staffMember.findUnique({
      where: { employeeId: createStaffDto.employeeId },
    });

    if (existingStaff) {
      throw new ConflictException(
        'Staff member with this employee ID already exists',
      );
    }

    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: createStaffDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Verify department exists if departmentId is provided
    if (createStaffDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: createStaffDto.departmentId },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    // Create user record for the staff member
    const username = await this.generateUniqueUsername(
      createStaffDto.firstName,
      createStaffDto.lastName,
    );
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        email: createStaffDto.email,
        username,
        password: hashedPassword,
        firstName: createStaffDto.firstName,
        lastName: createStaffDto.lastName,
        isActive: true,
      },
    });

    // Create staff member record
    const staffMember = await this.prisma.staffMember.create({
      data: {
        userId: user.id,
        employeeId: createStaffDto.employeeId,
        departmentId: createStaffDto.departmentId,
        specialization: createStaffDto.specialization,
        licenseNumber: createStaffDto.licenseNumber,
        serviceProvider: createStaffDto.serviceProvider ?? false,
        hireDate: new Date(createStaffDto.hireDate),
        isActive: createStaffDto.isActive ?? true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            roleAssignments: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    // Send password setup email to the new staff member
    try {
      await this.sendPasswordSetupEmail(
        createStaffDto.email,
        createStaffDto.firstName,
        createStaffDto.lastName,
        username,
        tempPassword,
      );
    } catch (error) {
      // Log error but don't fail the staff creation
      console.error('Failed to send password setup email:', error);
    }

    return staffMember;
  }

  async findAll(query?: {
    search?: string;
    departmentId?: string;
    department?: string;
    isActive?: boolean;
    specialization?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: Record<string, unknown> = {};

    if (query?.search) {
      where.OR = [
        { employeeId: { contains: query.search, mode: 'insensitive' } },
        { specialization: { contains: query.search, mode: 'insensitive' } },
        {
          department: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          user: {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (query?.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query?.department) {
      where.department = {
        name: {
          contains: query.department,
          mode: 'insensitive',
        },
      };
    }

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query?.specialization) {
      where.specialization = {
        contains: query.specialization,
        mode: 'insensitive',
      };
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const sortBy = query?.sortBy || 'hireDate';
    const sortOrder = query?.sortOrder || 'desc';

    const [
      staffMembers,
      total,
      totalStaff,
      activeStaff,
      inactiveStaff,
      totalDepartments,
      totalRoles,
    ] = await Promise.all([
      this.prisma.staffMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              isActive: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              roleAssignments: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.staffMember.count({ where }),
      this.prisma.staffMember.count(),
      this.prisma.staffMember.count({ where: { isActive: true } }),
      this.prisma.staffMember.count({ where: { isActive: false } }),
      this.prisma.department.count(),
      this.prisma.role.count(),
    ]);

    return {
      data: staffMembers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      counts: {
        totalStaff,
        activeStaff,
        inactiveStaff,
        totalDepartments,
        totalRoles,
      },
    };
  }

  async findById(id: string) {
    const staffMember = await this.prisma.staffMember.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        roleAssignments: {
          where: { isActive: true },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
                permissions: true,
              },
            },
          },
        },
        _count: {
          select: {
            roleAssignments: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!staffMember) {
      throw new NotFoundException('Staff member not found');
    }

    return staffMember;
  }

  async findByEmployeeId(employeeId: string) {
    const staffMember = await this.prisma.staffMember.findUnique({
      where: { employeeId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            roleAssignments: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!staffMember) {
      throw new NotFoundException('Staff member not found');
    }

    return staffMember;
  }

  async findByDepartment(departmentId: string) {
    return this.prisma.staffMember.findMany({
      where: { departmentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            roleAssignments: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { hireDate: 'desc' },
    });
  }

  async findBySpecialization(specialization: string) {
    return this.prisma.staffMember.findMany({
      where: {
        specialization: { contains: specialization, mode: 'insensitive' },
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            roleAssignments: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { hireDate: 'desc' },
    });
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    const staffMember = await this.prisma.staffMember.findUnique({
      where: { id },
    });

    if (!staffMember) {
      throw new NotFoundException('Staff member not found');
    }

    // Check if employee ID already exists (if being updated)
    if (
      updateStaffDto.employeeId &&
      updateStaffDto.employeeId !== staffMember.employeeId
    ) {
      const existingStaff = await this.prisma.staffMember.findUnique({
        where: { employeeId: updateStaffDto.employeeId },
      });

      if (existingStaff) {
        throw new ConflictException(
          'Staff member with this employee ID already exists',
        );
      }
    }

    // Verify department exists if departmentId is being updated
    if (updateStaffDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: updateStaffDto.departmentId },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    // Separate staff fields from user fields (user fields are ignored in staff update)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email, firstName, lastName, hireDate, ...staffFields } =
      updateStaffDto;

    // Update staff member fields only
    const updatedStaffMember = await this.prisma.staffMember.update({
      where: { id },
      data: {
        ...staffFields,
        ...(hireDate && {
          hireDate: new Date(hireDate),
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            roleAssignments: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return updatedStaffMember;
  }

  async remove(id: string) {
    const staffMember = await this.prisma.staffMember.findUnique({
      where: { id },
    });

    if (!staffMember) {
      throw new NotFoundException('Staff member not found');
    }

    await this.prisma.staffMember.delete({
      where: { id },
    });

    return { message: 'Staff member deleted successfully' };
  }

  async deactivate(id: string) {
    const staffMember = await this.prisma.staffMember.findUnique({
      where: { id },
    });

    if (!staffMember) {
      throw new NotFoundException('Staff member not found');
    }

    const updatedStaffMember = await this.prisma.staffMember.update({
      where: { id },
      data: { isActive: false },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            roleAssignments: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return updatedStaffMember;
  }

  async getStaffStats() {
    const [
      totalStaff,
      activeStaff,
      inactiveStaff,
      totalDepartments,
      totalRoles,
    ] = await Promise.all([
      this.prisma.staffMember.count(),
      this.prisma.staffMember.count({ where: { isActive: true } }),
      this.prisma.staffMember.count({ where: { isActive: false } }),
      this.prisma.department.count(),
      this.prisma.role.count(),
    ]);

    return {
      totalStaff,
      activeStaff,
      inactiveStaff,
      totalDepartments,
      totalRoles,
    };
  }

  // Role management methods
  async assignRole(
    staffId: string,
    roleId: string,
    scope?: string,
    scopeId?: string,
  ) {
    const staffMember = await this.prisma.staffMember.findUnique({
      where: { id: staffId },
    });

    if (!staffMember) {
      throw new NotFoundException('Staff member not found');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if role is already assigned
    const existingAssignment = await this.prisma.staffRoleAssignment.findFirst({
      where: {
        staffMemberId: staffId,
        roleId,
        scope,
        scopeId,
        isActive: true,
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        'Role is already assigned to this staff member',
      );
    }

    return this.prisma.staffRoleAssignment.create({
      data: {
        staffMemberId: staffId,
        roleId,
        scope,
        scopeId,
        isActive: true,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            permissions: true,
          },
        },
      },
    });
  }

  async removeRole(staffId: string, roleId: string) {
    const assignment = await this.prisma.staffRoleAssignment.findFirst({
      where: {
        staffMemberId: staffId,
        roleId,
        isActive: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Role assignment not found');
    }

    return this.prisma.staffRoleAssignment.update({
      where: { id: assignment.id },
      data: { isActive: false },
    });
  }

  async getStaffRoles(staffId: string) {
    return this.prisma.staffRoleAssignment.findMany({
      where: {
        staffMemberId: staffId,
        isActive: true,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            permissions: true,
          },
        },
      },
    });
  }

  async getStaffMemberStats(id: string) {
    const staffMember = await this.prisma.staffMember.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            roleAssignments: {
              where: { isActive: true },
            },
            admissions: true,
            consultations: true,
            labOrders: true,
            prescriptions: true,
            surgeries: true,
            appointments: true,
          },
        },
      },
    });

    if (!staffMember) {
      throw new NotFoundException('Staff member not found');
    }

    return {
      totalRoleAssignments: staffMember._count.roleAssignments,
      totalAdmissions: staffMember._count.admissions,
      totalConsultations: staffMember._count.consultations,
      totalLabOrders: staffMember._count.labOrders,
      totalPrescriptions: staffMember._count.prescriptions,
      totalSurgeries: staffMember._count.surgeries,
      totalAppointments: staffMember._count.appointments,
    };
  }

  // ===== SERVICE PROVIDER METHODS =====

  async findServiceProviders(query?: {
    departmentId?: string;
    specialization?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {
      serviceProvider: true, // Only staff members who can provide services
    };

    if (query?.search) {
      where.OR = [
        { employeeId: { contains: query.search, mode: 'insensitive' } },
        { specialization: { contains: query.search, mode: 'insensitive' } },
        {
          department: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          user: {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (query?.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query?.specialization) {
      where.specialization = {
        contains: query.specialization,
        mode: 'insensitive',
      };
    }

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const [serviceProviders, total] = await Promise.all([
      this.prisma.staffMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              isActive: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              roleAssignments: {
                where: { isActive: true },
              },
              appointments: true,
            },
          },
        },
        orderBy: [{ user: { firstName: 'asc' } }],
        skip,
        take: limit,
      }),
      this.prisma.staffMember.count({ where }),
    ]);

    return {
      data: serviceProviders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findServiceProvidersByDepartment(departmentId: string) {
    return this.prisma.staffMember.findMany({
      where: {
        departmentId,
        serviceProvider: true,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: { user: { firstName: 'asc' } },
    });
  }

  async findServiceProvidersBySpecialization(specialization: string) {
    return this.prisma.staffMember.findMany({
      where: {
        specialization: { contains: specialization, mode: 'insensitive' },
        serviceProvider: true,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: [{ user: { firstName: 'asc' } }],
    });
  }

  async getServiceProviderStats() {
    const [
      totalServiceProviders,
      activeServiceProviders,
      inactiveServiceProviders,
      serviceProvidersByDepartment,
      serviceProvidersBySpecialization,
    ] = await Promise.all([
      this.prisma.staffMember.count({ where: { serviceProvider: true } }),
      this.prisma.staffMember.count({
        where: { serviceProvider: true, isActive: true },
      }),
      this.prisma.staffMember.count({
        where: { serviceProvider: true, isActive: false },
      }),
      this.prisma.staffMember.groupBy({
        by: ['departmentId'],
        where: { serviceProvider: true, isActive: true },
        _count: { id: true },
      }),
      this.prisma.staffMember.groupBy({
        by: ['specialization'],
        where: { serviceProvider: true, isActive: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalServiceProviders,
      activeServiceProviders,
      inactiveServiceProviders,
      serviceProvidersByDepartment: serviceProvidersByDepartment.map(
        (item) => ({
          departmentId: item.departmentId,
          count: item._count.id,
        }),
      ),
      serviceProvidersBySpecialization: serviceProvidersBySpecialization.map(
        (item) => ({
          specialization: item.specialization,
          count: item._count.id,
        }),
      ),
    };
  }

  async updateServiceProviderStatus(id: string, serviceProvider: boolean) {
    const staffMember = await this.prisma.staffMember.findUnique({
      where: { id },
    });

    if (!staffMember) {
      throw new NotFoundException('Staff member not found');
    }

    return this.prisma.staffMember.update({
      where: { id },
      data: { serviceProvider },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  // Helper methods for user creation
  private generateTempPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async generateUniqueUsername(
    firstName: string,
    lastName: string,
  ): Promise<string> {
    const baseUsername =
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(
        /[^a-z0-9.]/g,
        '',
      );

    // Check if base username exists
    let username = baseUsername;
    let counter = 1;

    while (true) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username },
      });

      if (!existingUser) {
        break;
      }

      // Try with counter suffix
      username = `${baseUsername}${counter}`;
      counter++;

      // Prevent infinite loop
      if (counter > 100) {
        // Fallback to timestamp-based username
        username = `${baseUsername}_${Date.now()}`;
        break;
      }
    }

    return username;
  }

  private async sendPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    username: string,
    tempPassword: string,
  ): Promise<void> {
    const subject =
      'Welcome to Hospital Management System - Set Up Your Password';
    const content = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Welcome to Hospital Management System</h2>
            
            <p>Dear ${firstName} ${lastName},</p>
            
            <p>Your staff account has been created successfully. Please use the following credentials to log in and set up your password:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Username:</strong> ${username}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            
            <p><strong>Important Security Notice:</strong></p>
            <ul>
              <li>Please log in immediately and change your temporary password</li>
              <li>Use a strong password with at least 8 characters</li>
              <li>Include uppercase, lowercase, numbers, and special characters</li>
              <li>Do not share your credentials with anyone</li>
            </ul>
            
            <p>If you have any questions or need assistance, please contact the IT department.</p>
            
            <p>Best regards,<br>
            Hospital Management System</p>
          </div>
        </body>
      </html>
    `;

    // Create and send notification
    await this.notificationsService.createNotification({
      type: 'STAFF_WELCOME',
      channel: 'EMAIL',
      recipientId: email,
      recipientType: 'STAFF',
      subject,
      content,
      priority: 'HIGH',
    });
  }
}
