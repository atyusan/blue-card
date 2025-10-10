import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import {
  TreatmentResponse,
  TreatmentSummaryResponse,
  TreatmentLinkResponse,
} from './interfaces/treatment.interface';
import {
  TreatmentStatus,
  TreatmentPriority,
  TreatmentType,
  ProviderRole,
  TreatmentLinkType,
} from '@prisma/client';
import { CreateTreatmentLinkDto } from './dto/create-treatment-link.dto';
import { UpdateTreatmentLinkDto } from './dto/update-treatment-link.dto';

@Injectable()
export class TreatmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createTreatmentDto: CreateTreatmentDto,
    userId: string,
  ): Promise<TreatmentResponse> {
    const {
      patientId,
      primaryProviderId,
      appointmentId,
      title,
      description,
      treatmentType,
      priority,
      chiefComplaint,
      historyOfPresentIllness,
      pastMedicalHistory,
      allergies,
      medications,
      isEmergency,
      emergencyLevel,
      additionalProviders,
    } = createTreatmentDto;

    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Validate primary provider exists and is a service provider
    const primaryProvider = await this.prisma.staffMember.findUnique({
      where: { id: primaryProviderId },
      include: { user: true },
    });

    if (!primaryProvider || !primaryProvider.serviceProvider) {
      throw new BadRequestException(
        'Primary provider must be a service provider',
      );
    }

    // Validate appointment if provided
    if (appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (appointment.patientId !== patientId) {
        throw new BadRequestException(
          'Appointment does not belong to the specified patient',
        );
      }
    }

    // Validate additional providers
    if (additionalProviders && additionalProviders.length > 0) {
      const providerIds = additionalProviders.map((p) => p.providerId);
      const providers = await this.prisma.staffMember.findMany({
        where: { id: { in: providerIds } },
      });

      if (providers.length !== providerIds.length) {
        throw new BadRequestException(
          'One or more additional providers not found',
        );
      }

      const nonServiceProviders = providers.filter((p) => !p.serviceProvider);
      if (nonServiceProviders.length > 0) {
        throw new BadRequestException(
          'All additional providers must be service providers',
        );
      }
    }

    // Create treatment with transaction
    const treatment = await this.prisma.$transaction(async (prisma) => {
      // Create the main treatment
      const newTreatment = await prisma.treatment.create({
        data: {
          patientId,
          primaryProviderId,
          appointmentId,
          title,
          description,
          treatmentType,
          priority,
          chiefComplaint,
          historyOfPresentIllness,
          pastMedicalHistory,
          allergies,
          medications,
          isEmergency,
          emergencyLevel,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Add primary provider to treatment providers
      await prisma.treatmentProvider.create({
        data: {
          treatmentId: newTreatment.id,
          providerId: primaryProviderId,
          role: ProviderRole.PRIMARY,
        },
      });

      // Add additional providers if provided
      if (additionalProviders && additionalProviders.length > 0) {
        const providerData = additionalProviders.map((provider) => ({
          treatmentId: newTreatment.id,
          providerId: provider.providerId,
          role: provider.role || ProviderRole.CONSULTANT,
        }));

        await prisma.treatmentProvider.createMany({
          data: providerData,
        });
      }

      return newTreatment;
    });

    // Fetch the complete treatment with all relations for the response
    const completeTreatment = await this.prisma.treatment.findUnique({
      where: { id: treatment.id },
      include: {
        patient: true,
        primaryProvider: {
          include: {
            user: true,
            department: true,
          },
        },
        appointment: true,
        providers: {
          include: {
            provider: {
              include: {
                user: true,
              },
            },
          },
        },
        diagnoses: true,
        prescriptions: true,
        labRequests: true,
        imagingRequests: true,
        procedures: true,
        referrals: true,
        notes: true,
        linkedFromTreatments: {
          include: {
            fromTreatment: true,
          },
        },
        linkedToTreatments: {
          include: {
            toTreatment: true,
          },
        },
        creator: true,
        updater: true,
      },
    });

    if (!completeTreatment) {
      throw new NotFoundException('Treatment not found after creation');
    }

    return this.mapToResponse(completeTreatment);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    patientId?: string,
    providerId?: string,
    appointmentId?: string,
    status?: TreatmentStatus,
    treatmentType?: TreatmentType,
    isEmergency?: boolean,
  ): Promise<{
    treatments: TreatmentResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (patientId) where.patientId = patientId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (providerId) {
      where.OR = [
        { primaryProviderId: providerId },
        { providers: { some: { providerId, isActive: true } } },
      ];
    }
    if (status) where.status = status;
    if (treatmentType) where.treatmentType = treatmentType;
    if (isEmergency !== undefined) where.isEmergency = isEmergency;

    const [treatments, total] = await Promise.all([
      this.prisma.treatment.findMany({
        where,
        include: {
          patient: {
            include: { user: true },
          },
          primaryProvider: {
            include: { user: true },
          },
          appointment: true,
          providers: {
            where: { isActive: true },
            include: {
              provider: {
                include: { user: true },
              },
            },
          },
          diagnoses: true,
          prescriptions: true,
          labRequests: true,
          imagingRequests: true,
          procedures: true,
          referrals: true,
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: [
          { isEmergency: 'desc' },
          { priority: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.treatment.count({ where }),
    ]);

    return {
      treatments: treatments.map((treatment) => this.mapToResponse(treatment)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<TreatmentResponse> {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: true },
        },
        primaryProvider: {
          include: { user: true },
        },
        appointment: true,
        providers: {
          where: { isActive: true },
          include: {
            provider: {
              include: { user: true },
            },
          },
        },
        diagnoses: {
          include: {
            provider: {
              include: { user: true },
            },
          },
          orderBy: { diagnosedAt: 'desc' },
        },
        prescriptions: {
          include: {
            doctor: {
              include: { user: true },
            },
            medications: true,
          },
          orderBy: { prescriptionDate: 'desc' },
        },
        labRequests: {
          include: {
            requestingProvider: {
              include: { user: true },
            },
            labProvider: {
              include: { user: true },
            },
            results: true,
          },
          orderBy: { requestedAt: 'desc' },
        },
        imagingRequests: {
          include: {
            requestingProvider: {
              include: { user: true },
            },
            imagingProvider: {
              include: { user: true },
            },
            results: true,
          },
          orderBy: { requestedAt: 'desc' },
        },
        procedures: {
          include: {
            provider: {
              include: { user: true },
            },
          },
          orderBy: { scheduledAt: 'desc' },
        },
        referrals: {
          include: {
            fromProvider: {
              include: { user: true },
            },
            toProvider: {
              include: { user: true },
            },
            toDepartment: true,
          },
          orderBy: { referredAt: 'desc' },
        },
        notes: {
          include: {
            provider: {
              include: { user: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!treatment) {
      throw new NotFoundException('Treatment not found');
    }

    return this.mapToResponse(treatment);
  }

  async update(
    id: string,
    updateTreatmentDto: UpdateTreatmentDto,
    userId: string,
  ): Promise<TreatmentResponse> {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id },
    });

    if (!treatment) {
      throw new NotFoundException('Treatment not found');
    }

    // Check if user can update this treatment
    const canUpdate = await this.canUserUpdateTreatment(id, userId);
    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this treatment',
      );
    }

    const updatedTreatment = await this.prisma.treatment.update({
      where: { id },
      data: {
        ...updateTreatmentDto,
        updatedBy: userId,
        lastUpdated: new Date(),
      },
      include: {
        patient: {
          include: { user: true },
        },
        primaryProvider: {
          include: { user: true },
        },
        appointment: true,
        providers: {
          where: { isActive: true },
          include: {
            provider: {
              include: { user: true },
            },
          },
        },
        diagnoses: true,
        prescriptions: true,
        labRequests: true,
        imagingRequests: true,
        procedures: true,
        referrals: true,
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return this.mapToResponse(updatedTreatment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id },
    });

    if (!treatment) {
      throw new NotFoundException('Treatment not found');
    }

    // Check if user can delete this treatment
    const canDelete = await this.canUserDeleteTreatment(id, userId);
    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this treatment',
      );
    }

    await this.prisma.treatment.delete({
      where: { id },
    });
  }

  async getTreatmentHistory(
    patientId: string,
  ): Promise<TreatmentSummaryResponse[]> {
    const treatments = await this.prisma.treatment.findMany({
      where: { patientId },
      include: {
        primaryProvider: {
          include: { user: true },
        },
        appointment: true,
        diagnoses: {
          take: 3,
          orderBy: { diagnosedAt: 'desc' },
        },
        prescriptions: {
          take: 3,
          orderBy: { prescriptionDate: 'desc' },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return treatments.map((treatment) => ({
      id: treatment.id,
      title: treatment.title,
      treatmentType: treatment.treatmentType,
      status: treatment.status,
      priority: treatment.priority,
      startDate: treatment.startDate,
      endDate: treatment.endDate || undefined,
      primaryProvider: {
        id: treatment.primaryProvider.id,
        firstName: treatment.primaryProvider.user.firstName,
        lastName: treatment.primaryProvider.user.lastName,
        specialization: treatment.primaryProvider.specialization || undefined,
      },
      appointment: treatment.appointment
        ? {
            id: treatment.appointment.id,
            scheduledStart: treatment.appointment.scheduledStart,
            status: treatment.appointment.status,
          }
        : undefined,
      diagnosisCount: treatment.diagnoses.length,
      prescriptionCount: treatment.prescriptions.length,
      isEmergency: treatment.isEmergency,
    }));
  }

  async addProviderToTreatment(
    treatmentId: string,
    providerId: string,
    role: ProviderRole,
    userId: string,
  ): Promise<void> {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId },
    });

    if (!treatment) {
      throw new NotFoundException('Treatment not found');
    }

    // Check if user can modify this treatment
    const canModify = await this.canUserUpdateTreatment(treatmentId, userId);
    if (!canModify) {
      throw new ForbiddenException(
        'You do not have permission to modify this treatment',
      );
    }

    // Check if provider is already part of the treatment
    const existingProvider = await this.prisma.treatmentProvider.findUnique({
      where: {
        treatmentId_providerId: {
          treatmentId,
          providerId,
        },
      },
    });

    if (existingProvider) {
      if (existingProvider.isActive) {
        throw new BadRequestException(
          'Provider is already part of this treatment',
        );
      } else {
        // Reactivate the provider
        await this.prisma.treatmentProvider.update({
          where: { id: existingProvider.id },
          data: { isActive: true, leftAt: null },
        });
        return;
      }
    }

    // Validate provider exists and is a service provider
    const provider = await this.prisma.staffMember.findUnique({
      where: { id: providerId },
    });

    if (!provider || !provider.serviceProvider) {
      throw new BadRequestException('Provider must be a service provider');
    }

    await this.prisma.treatmentProvider.create({
      data: {
        treatmentId,
        providerId,
        role,
      },
    });
  }

  async removeProviderFromTreatment(
    treatmentId: string,
    providerId: string,
    userId: string,
  ): Promise<void> {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId },
    });

    if (!treatment) {
      throw new NotFoundException('Treatment not found');
    }

    // Check if user can modify this treatment
    const canModify = await this.canUserUpdateTreatment(treatmentId, userId);
    if (!canModify) {
      throw new ForbiddenException(
        'You do not have permission to modify this treatment',
      );
    }

    // Cannot remove primary provider
    if (treatment.primaryProviderId === providerId) {
      throw new BadRequestException(
        'Cannot remove primary provider from treatment',
      );
    }

    const treatmentProvider = await this.prisma.treatmentProvider.findUnique({
      where: {
        treatmentId_providerId: {
          treatmentId,
          providerId,
        },
      },
    });

    if (!treatmentProvider || !treatmentProvider.isActive) {
      throw new BadRequestException('Provider is not part of this treatment');
    }

    await this.prisma.treatmentProvider.update({
      where: { id: treatmentProvider.id },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });
  }

  async updateTreatmentStatus(
    treatmentId: string,
    status: TreatmentStatus,
    userId: string,
  ): Promise<TreatmentResponse> {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId },
    });

    if (!treatment) {
      throw new NotFoundException('Treatment not found');
    }

    // Check if user can update this treatment
    const canUpdate = await this.canUserUpdateTreatment(treatmentId, userId);
    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this treatment',
      );
    }

    const updateData: any = {
      status,
      updatedBy: userId,
      lastUpdated: new Date(),
    };

    // Set end date if treatment is completed
    if (status === TreatmentStatus.COMPLETED && !treatment.endDate) {
      updateData.endDate = new Date();
    }

    const updatedTreatment = await this.prisma.treatment.update({
      where: { id: treatmentId },
      data: updateData,
      include: {
        patient: {
          include: { user: true },
        },
        primaryProvider: {
          include: { user: true },
        },
        appointment: true,
        providers: {
          where: { isActive: true },
          include: {
            provider: {
              include: { user: true },
            },
          },
        },
        diagnoses: true,
        prescriptions: true,
        labRequests: true,
        imagingRequests: true,
        procedures: true,
        referrals: true,
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return this.mapToResponse(updatedTreatment);
  }

  async createTreatmentLink(
    createLinkDto: CreateTreatmentLinkDto,
    userId: string,
  ): Promise<TreatmentLinkResponse> {
    const { fromTreatmentId, toTreatmentId, linkType, linkReason, notes } =
      createLinkDto;

    // Validate treatments exist
    const [fromTreatment, toTreatment] = await Promise.all([
      this.prisma.treatment.findUnique({ where: { id: fromTreatmentId } }),
      this.prisma.treatment.findUnique({ where: { id: toTreatmentId } }),
    ]);

    if (!fromTreatment) {
      throw new NotFoundException('From treatment not found');
    }

    if (!toTreatment) {
      throw new NotFoundException('To treatment not found');
    }

    // Prevent self-linking
    if (fromTreatmentId === toTreatmentId) {
      throw new BadRequestException('Cannot link treatment to itself');
    }

    // Check if user can modify the from treatment
    const canModifyFrom = await this.canUserUpdateTreatment(
      fromTreatmentId,
      userId,
    );
    if (!canModifyFrom) {
      throw new ForbiddenException(
        'You do not have permission to link from this treatment',
      );
    }

    // Check for existing link
    const existingLink = await this.prisma.treatmentLink.findUnique({
      where: {
        fromTreatmentId_toTreatmentId_linkType: {
          fromTreatmentId,
          toTreatmentId,
          linkType,
        },
      },
    });

    if (existingLink) {
      if (existingLink.isActive) {
        throw new BadRequestException(
          'Treatment link already exists for this type',
        );
      } else {
        // Reactivate the existing link
        const reactivatedLink = await this.prisma.treatmentLink.update({
          where: { id: existingLink.id },
          data: { isActive: true, notes },
          include: {
            fromTreatment: {
              include: {
                primaryProvider: {
                  include: { user: true },
                },
              },
            },
            toTreatment: {
              include: {
                primaryProvider: {
                  include: { user: true },
                },
              },
            },
            creator: true,
          },
        });
        return this.mapTreatmentLinkToResponse(reactivatedLink);
      }
    }

    // Create new link
    const treatmentLink = await this.prisma.treatmentLink.create({
      data: {
        fromTreatmentId,
        toTreatmentId,
        linkType,
        linkReason,
        notes,
        createdBy: userId,
      },
      include: {
        fromTreatment: {
          include: {
            primaryProvider: {
              include: { user: true },
            },
          },
        },
        toTreatment: {
          include: {
            primaryProvider: {
              include: { user: true },
            },
          },
        },
        creator: true,
      },
    });

    return this.mapTreatmentLinkToResponse(treatmentLink);
  }

  async getTreatmentLinks(treatmentId: string): Promise<{
    linkedFrom: TreatmentLinkResponse[];
    linkedTo: TreatmentLinkResponse[];
  }> {
    const [linkedFrom, linkedTo] = await Promise.all([
      this.prisma.treatmentLink.findMany({
        where: {
          fromTreatmentId: treatmentId,
          isActive: true,
        },
        include: {
          fromTreatment: {
            include: {
              primaryProvider: {
                include: { user: true },
              },
            },
          },
          toTreatment: {
            include: {
              primaryProvider: {
                include: { user: true },
              },
            },
          },
          creator: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.treatmentLink.findMany({
        where: {
          toTreatmentId: treatmentId,
          isActive: true,
        },
        include: {
          fromTreatment: {
            include: {
              primaryProvider: {
                include: { user: true },
              },
            },
          },
          toTreatment: {
            include: {
              primaryProvider: {
                include: { user: true },
              },
            },
          },
          creator: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      linkedFrom: linkedFrom.map((link) =>
        this.mapTreatmentLinkToResponse(link),
      ),
      linkedTo: linkedTo.map((link) => this.mapTreatmentLinkToResponse(link)),
    };
  }

  async updateTreatmentLink(
    linkId: string,
    updateLinkDto: UpdateTreatmentLinkDto,
    userId: string,
  ): Promise<TreatmentLinkResponse> {
    const treatmentLink = await this.prisma.treatmentLink.findUnique({
      where: { id: linkId },
      include: {
        fromTreatment: true,
        toTreatment: true,
      },
    });

    if (!treatmentLink) {
      throw new NotFoundException('Treatment link not found');
    }

    // Check if user can modify the from treatment
    const canModify = await this.canUserUpdateTreatment(
      treatmentLink.fromTreatmentId,
      userId,
    );
    if (!canModify) {
      throw new ForbiddenException(
        'You do not have permission to modify this treatment link',
      );
    }

    const updatedLink = await this.prisma.treatmentLink.update({
      where: { id: linkId },
      data: updateLinkDto,
      include: {
        fromTreatment: {
          include: {
            primaryProvider: {
              include: { user: true },
            },
          },
        },
        toTreatment: {
          include: {
            primaryProvider: {
              include: { user: true },
            },
          },
        },
        creator: true,
      },
    });

    return this.mapTreatmentLinkToResponse(updatedLink);
  }

  async deleteTreatmentLink(linkId: string, userId: string): Promise<void> {
    const treatmentLink = await this.prisma.treatmentLink.findUnique({
      where: { id: linkId },
    });

    if (!treatmentLink) {
      throw new NotFoundException('Treatment link not found');
    }

    // Check if user can modify the from treatment
    const canModify = await this.canUserUpdateTreatment(
      treatmentLink.fromTreatmentId,
      userId,
    );
    if (!canModify) {
      throw new ForbiddenException(
        'You do not have permission to delete this treatment link',
      );
    }

    await this.prisma.treatmentLink.update({
      where: { id: linkId },
      data: { isActive: false },
    });
  }

  async getTreatmentChain(treatmentId: string): Promise<{
    chain: TreatmentLinkResponse[];
    allTreatments: TreatmentSummaryResponse[];
  }> {
    // Get all treatments in the chain (both directions)
    const treatmentLinks = await this.prisma.treatmentLink.findMany({
      where: {
        OR: [
          { fromTreatmentId: treatmentId, isActive: true },
          { toTreatmentId: treatmentId, isActive: true },
        ],
      },
      include: {
        fromTreatment: {
          include: {
            primaryProvider: {
              include: { user: true },
            },
          },
        },
        toTreatment: {
          include: {
            primaryProvider: {
              include: { user: true },
            },
          },
        },
        creator: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get all unique treatment IDs in the chain
    const treatmentIds = new Set<string>();
    treatmentLinks.forEach((link) => {
      treatmentIds.add(link.fromTreatmentId);
      treatmentIds.add(link.toTreatmentId);
    });

    // Get all treatments in the chain
    const treatments = await this.prisma.treatment.findMany({
      where: { id: { in: Array.from(treatmentIds) } },
      include: {
        primaryProvider: {
          include: { user: true },
        },
        appointment: true,
        diagnoses: { take: 1 },
        prescriptions: { take: 1 },
      },
      orderBy: { startDate: 'asc' },
    });

    return {
      chain: treatmentLinks.map((link) =>
        this.mapTreatmentLinkToResponse(link),
      ),
      allTreatments: treatments.map((treatment) => ({
        id: treatment.id,
        title: treatment.title,
        treatmentType: treatment.treatmentType,
        status: treatment.status,
        priority: treatment.priority,
        startDate: treatment.startDate,
        endDate: treatment.endDate || undefined,
        primaryProvider: {
          id: treatment.primaryProvider.id,
          firstName: treatment.primaryProvider.user.firstName,
          lastName: treatment.primaryProvider.user.lastName,
          specialization: treatment.primaryProvider.specialization || undefined,
        },
        appointment: treatment.appointment
          ? {
              id: treatment.appointment.id,
              scheduledStart: treatment.appointment.scheduledStart,
              status: treatment.appointment.status,
            }
          : undefined,
        diagnosisCount: treatment.diagnoses.length,
        prescriptionCount: treatment.prescriptions.length,
        isEmergency: treatment.isEmergency,
      })),
    };
  }

  private async canUserUpdateTreatment(
    treatmentId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if user is part of the treatment team
    const treatmentProvider = await this.prisma.treatmentProvider.findFirst({
      where: {
        treatmentId,
        providerId: {
          in: await this.prisma.staffMember
            .findMany({
              where: { userId },
              select: { id: true },
            })
            .then((staff) => staff.map((s) => s.id)),
        },
        isActive: true,
      },
    });

    if (treatmentProvider) {
      return true;
    }

    // Check if user has admin permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return (user?.permissions as string[])?.includes('admin') || false;
  }

  private async canUserDeleteTreatment(
    treatmentId: string,
    userId: string,
  ): Promise<boolean> {
    // Only primary provider or admin can delete treatment
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId },
      include: {
        primaryProvider: true,
      },
    });

    if (!treatment) {
      return false;
    }

    // Check if user is the primary provider
    const staffMember = await this.prisma.staffMember.findUnique({
      where: { userId },
    });

    if (staffMember && staffMember.id === treatment.primaryProviderId) {
      return true;
    }

    // Check if user has admin permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return (user?.permissions as string[])?.includes('admin') || false;
  }

  private mapToResponse(treatment: any): TreatmentResponse {
    return {
      id: treatment.id,
      patientId: treatment.patientId,
      primaryProviderId: treatment.primaryProviderId,
      appointmentId: treatment.appointmentId,
      title: treatment.title,
      description: treatment.description,
      treatmentType: treatment.treatmentType,
      status: treatment.status,
      priority: treatment.priority,
      startDate: treatment.startDate,
      endDate: treatment.endDate,
      lastUpdated: treatment.lastUpdated,
      chiefComplaint: treatment.chiefComplaint,
      historyOfPresentIllness: treatment.historyOfPresentIllness,
      pastMedicalHistory: treatment.pastMedicalHistory,
      allergies: treatment.allergies,
      medications: treatment.medications,
      isEmergency: treatment.isEmergency,
      emergencyLevel: treatment.emergencyLevel,
      createdAt: treatment.createdAt,
      updatedAt: treatment.updatedAt,
      patient: treatment.patient
        ? {
            id: treatment.patient.id,
            patientId: treatment.patient.patientId,
            firstName: treatment.patient.firstName,
            lastName: treatment.patient.lastName,
            dateOfBirth: treatment.patient.dateOfBirth,
            gender: treatment.patient.gender,
            phoneNumber: treatment.patient.phoneNumber,
            email: treatment.patient.email,
          }
        : undefined,
      primaryProvider: {
        id: treatment.primaryProvider.id,
        firstName: treatment.primaryProvider.user.firstName,
        lastName: treatment.primaryProvider.user.lastName,
        specialization: treatment.primaryProvider.specialization,
        licenseNumber: treatment.primaryProvider.licenseNumber,
      },
      appointment: treatment.appointment,
      providers:
        treatment.providers?.map((tp: any) => ({
          id: tp.id,
          providerId: tp.providerId,
          role: tp.role,
          isActive: tp.isActive,
          joinedAt: tp.joinedAt,
          leftAt: tp.leftAt,
          transferAcknowledged: tp.transferAcknowledged,
          transferAcknowledgedAt: tp.transferAcknowledgedAt,
          provider: {
            id: tp.provider.id,
            firstName: tp.provider.user.firstName,
            lastName: tp.provider.user.lastName,
            specialization: tp.provider.specialization,
            licenseNumber: tp.provider.licenseNumber,
          },
        })) || [],
      diagnoses: treatment.diagnoses || [],
      prescriptions: treatment.prescriptions || [],
      labRequests: treatment.labRequests || [],
      imagingRequests: treatment.imagingRequests || [],
      procedures: treatment.procedures || [],
      admissions: treatment.admissions || [],
      referrals: treatment.referrals || [],
      notes: treatment.notes || [],
      linkedFromTreatments:
        treatment.linkedFromTreatments?.map((link: any) =>
          this.mapTreatmentLinkToResponse(link),
        ) || [],
      linkedToTreatments:
        treatment.linkedToTreatments?.map((link: any) =>
          this.mapTreatmentLinkToResponse(link),
        ) || [],
    };
  }

  private mapTreatmentLinkToResponse(link: any): TreatmentLinkResponse {
    return {
      id: link.id,
      fromTreatmentId: link.fromTreatmentId,
      toTreatmentId: link.toTreatmentId,
      linkType: link.linkType,
      linkReason: link.linkReason,
      isActive: link.isActive,
      createdAt: link.createdAt,
      notes: link.notes,
      fromTreatment: {
        id: link.fromTreatment.id,
        title: link.fromTreatment.title,
        treatmentType: link.fromTreatment.treatmentType,
        status: link.fromTreatment.status,
        startDate: link.fromTreatment.startDate,
        primaryProvider: {
          id: link.fromTreatment.primaryProvider.id,
          firstName: link.fromTreatment.primaryProvider.user.firstName,
          lastName: link.fromTreatment.primaryProvider.user.lastName,
          specialization: link.fromTreatment.primaryProvider.specialization,
        },
      },
      toTreatment: {
        id: link.toTreatment.id,
        title: link.toTreatment.title,
        treatmentType: link.toTreatment.treatmentType,
        status: link.toTreatment.status,
        startDate: link.toTreatment.startDate,
        primaryProvider: {
          id: link.toTreatment.primaryProvider.id,
          firstName: link.toTreatment.primaryProvider.user.firstName,
          lastName: link.toTreatment.primaryProvider.user.lastName,
          specialization: link.toTreatment.primaryProvider.specialization,
        },
      },
      creator: {
        id: link.creator.id,
        firstName: link.creator.firstName,
        lastName: link.creator.lastName,
      },
    };
  }

  async transferTreatment(
    treatmentId: string,
    newProviderId: string,
    reason: string,
    notes: string | undefined,
    userId: string,
  ): Promise<TreatmentResponse> {
    // Verify treatment exists
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId },
      include: {
        primaryProvider: {
          include: { user: true },
        },
      },
    });

    if (!treatment) {
      throw new NotFoundException('Treatment not found');
    }

    // Verify new provider exists and is a service provider
    const newProvider = await this.prisma.staffMember.findUnique({
      where: { id: newProviderId },
      include: { user: true },
    });

    if (!newProvider) {
      throw new NotFoundException('New provider not found');
    }

    if (!newProvider.serviceProvider) {
      throw new BadRequestException('New provider must be a service provider');
    }

    // Check if user can update this treatment
    const canUpdate = await this.canUserUpdateTreatment(treatmentId, userId);
    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to transfer this treatment',
      );
    }

    // Check if trying to transfer to the same provider
    if (treatment.primaryProviderId === newProviderId) {
      throw new BadRequestException(
        'Cannot transfer treatment to the same provider',
      );
    }

    const currentProviderId = treatment.primaryProviderId;

    // Perform the transfer in a transaction
    const updatedTreatment = await this.prisma.$transaction(async (tx) => {
      // Update treatment with new primary provider
      const updated = await tx.treatment.update({
        where: { id: treatmentId },
        data: {
          primaryProviderId: newProviderId,
          updatedBy: userId,
          status: TreatmentStatus.ACTIVE, // Keep treatment active after transfer
        },
        include: {
          patient: {
            include: { user: true },
          },
          primaryProvider: {
            include: { user: true },
          },
          appointment: true,
          providers: {
            include: {
              provider: {
                include: { user: true },
              },
            },
            where: { isActive: true },
          },
          diagnoses: true,
          prescriptions: true,
          labRequests: true,
          procedures: true,
          creator: true,
          updater: true,
        },
      });

      // Create a treatment note to record the transfer
      await tx.treatmentNote.create({
        data: {
          treatmentId: treatmentId,
          providerId: newProviderId,
          noteType: 'PROGRESS',
          content: `Treatment transferred from ${treatment.primaryProvider.user.firstName} ${treatment.primaryProvider.user.lastName} to ${newProvider.user.firstName} ${newProvider.user.lastName}. Reason: ${reason}${notes ? `. Notes: ${notes}` : ''}`,
          isPrivate: false,
        },
      });

      // Add the previous primary provider to the treatment team as a consultant (if not already there)
      const existingTeamMember = await tx.treatmentProvider.findFirst({
        where: {
          treatmentId: treatmentId,
          providerId: currentProviderId,
          isActive: true,
        },
      });

      if (!existingTeamMember) {
        await tx.treatmentProvider.create({
          data: {
            treatmentId: treatmentId,
            providerId: currentProviderId,
            role: ProviderRole.CONSULTANT,
            isActive: true,
          },
        });
      } else {
        // Update their role to consultant if it was primary
        if (existingTeamMember.role === ProviderRole.PRIMARY) {
          await tx.treatmentProvider.update({
            where: { id: existingTeamMember.id },
            data: { role: ProviderRole.CONSULTANT },
          });
        }
      }

      // Add the new provider to the treatment team as primary (if not already there)
      const newProviderTeamMember = await tx.treatmentProvider.findFirst({
        where: {
          treatmentId: treatmentId,
          providerId: newProviderId,
          isActive: true,
        },
      });

      if (!newProviderTeamMember) {
        await tx.treatmentProvider.create({
          data: {
            treatmentId: treatmentId,
            providerId: newProviderId,
            role: ProviderRole.PRIMARY,
            isActive: true,
            transferAcknowledged: false, // Mark as unacknowledged
          },
        });
      } else {
        // Update their role to primary and mark as unacknowledged
        await tx.treatmentProvider.update({
          where: { id: newProviderTeamMember.id },
          data: {
            role: ProviderRole.PRIMARY,
            transferAcknowledged: false,
            transferAcknowledgedAt: null,
          },
        });
      }

      return updated;
    });

    return this.mapToResponse(updatedTreatment);
  }

  async getTransferredTreatments(
    providerId: string,
    acknowledged?: boolean,
  ): Promise<{
    treatments: TreatmentResponse[];
    total: number;
    unacknowledged: number;
  }> {
    // Find treatments where this provider is the primary provider
    // and joined recently (within last 30 days) with role PRIMARY
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const whereClause: any = {
      primaryProviderId: providerId,
      status: {
        in: [TreatmentStatus.ACTIVE, TreatmentStatus.SUSPENDED],
      },
      providers: {
        some: {
          providerId: providerId,
          role: ProviderRole.PRIMARY,
          joinedAt: {
            gte: thirtyDaysAgo,
          },
        },
      },
    };

    // Filter by acknowledgment status if provided
    if (acknowledged !== undefined) {
      whereClause.providers.some.transferAcknowledged = acknowledged;
    }

    const treatments = await this.prisma.treatment.findMany({
      where: whereClause,
      include: {
        patient: {
          include: { user: true },
        },
        primaryProvider: {
          include: { user: true },
        },
        appointment: true,
        providers: {
          include: {
            provider: {
              include: { user: true },
            },
          },
          where: { isActive: true },
        },
        diagnoses: true,
        prescriptions: true,
        labRequests: true,
        procedures: true,
        creator: true,
        updater: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Count unacknowledged transfers
    const unacknowledgedCount = await this.prisma.treatment.count({
      where: {
        primaryProviderId: providerId,
        status: {
          in: [TreatmentStatus.ACTIVE, TreatmentStatus.SUSPENDED],
        },
        providers: {
          some: {
            providerId: providerId,
            role: ProviderRole.PRIMARY,
            transferAcknowledged: false,
            joinedAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });

    return {
      treatments: treatments.map((t) => this.mapToResponse(t)),
      total: treatments.length,
      unacknowledged: unacknowledgedCount,
    };
  }

  async acknowledgeTransfer(
    treatmentId: string,
    providerId: string,
  ): Promise<{ success: boolean; message: string }> {
    console.log('🔍 Acknowledging transfer:', { treatmentId, providerId });

    // Find the treatment provider record
    const treatmentProvider = await this.prisma.treatmentProvider.findFirst({
      where: {
        treatmentId: treatmentId,
        providerId: providerId,
        role: ProviderRole.PRIMARY,
        isActive: true,
      },
    });

    console.log('🔍 Found treatment provider:', treatmentProvider);

    if (!treatmentProvider) {
      // Let's also check if the user is the primary provider on the treatment itself
      const treatment = await this.prisma.treatment.findUnique({
        where: { id: treatmentId },
        select: { primaryProviderId: true },
      });

      console.log('🔍 Treatment primary provider:', treatment);

      if (treatment?.primaryProviderId === providerId) {
        // User is primary provider but TreatmentProvider record doesn't exist
        // This might happen if the treatment was created without explicitly adding to providers table
        // Let's create the record
        const newRecord = await this.prisma.treatmentProvider.create({
          data: {
            treatmentId: treatmentId,
            providerId: providerId,
            role: ProviderRole.PRIMARY,
            isActive: true,
            transferAcknowledged: true,
            transferAcknowledgedAt: new Date(),
          },
        });

        console.log(
          '✅ Created and acknowledged treatment provider record:',
          newRecord,
        );

        return {
          success: true,
          message: 'Transfer acknowledged successfully',
        };
      }

      throw new NotFoundException(
        'Treatment provider record not found or you are not the primary provider',
      );
    }

    // Update acknowledgment status
    await this.prisma.treatmentProvider.update({
      where: { id: treatmentProvider.id },
      data: {
        transferAcknowledged: true,
        transferAcknowledgedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Transfer acknowledged successfully',
    };
  }
}
