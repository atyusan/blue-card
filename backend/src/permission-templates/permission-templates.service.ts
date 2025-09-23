import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePermissionTemplateDto } from './dto/create-permission-template.dto';
import { UpdatePermissionTemplateDto } from './dto/update-permission-template.dto';
import { CreatePermissionPresetDto } from './dto/create-permission-preset.dto';
import { UpdatePermissionPresetDto } from './dto/update-permission-preset.dto';

@Injectable()
export class PermissionTemplatesService {
  constructor(private prisma: PrismaService) {}

  async createTemplate(createTemplateDto: CreatePermissionTemplateDto) {
    const {
      name,
      description,
      category,
      permissions,
      isSystem = false,
      version = '1.0.0',
    } = createTemplateDto;

    // Validate permissions array
    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw new BadRequestException('Permissions must be a non-empty array');
    }

    // Check if template with same name already exists
    const existingTemplate = await this.prisma.permissionTemplate.findUnique({
      where: { name },
    });

    if (existingTemplate) {
      throw new BadRequestException(
        `Template with name '${name}' already exists`,
      );
    }

    return this.prisma.permissionTemplate.create({
      data: {
        name,
        description,
        category,
        permissions,
        isSystem,
        version,
      },
    });
  }

  async findAllTemplates() {
    return this.prisma.permissionTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        presets: {
          where: { isActive: true },
          select: { id: true, name: true, description: true },
        },
        _count: {
          select: { presets: true },
        },
      },
    });
  }

  async findTemplateById(id: string) {
    const template = await this.prisma.permissionTemplate.findUnique({
      where: { id },
      include: {
        presets: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(
        `Permission template with ID '${id}' not found`,
      );
    }

    return template;
  }

  async findTemplateByName(name: string) {
    const template = await this.prisma.permissionTemplate.findUnique({
      where: { name },
      include: {
        presets: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(
        `Permission template with name '${name}' not found`,
      );
    }

    return template;
  }

  async findTemplatesByCategory(category: string) {
    return this.prisma.permissionTemplate.findMany({
      where: { category },
      orderBy: { name: 'asc' },
      include: {
        presets: {
          where: { isActive: true },
          select: { id: true, name: true, description: true },
        },
        _count: {
          select: { presets: true },
        },
      },
    });
  }

  async updateTemplate(
    id: string,
    updateTemplateDto: UpdatePermissionTemplateDto,
  ) {
    const template = await this.prisma.permissionTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(
        `Permission template with ID '${id}' not found`,
      );
    }

    if (template.isSystem) {
      throw new BadRequestException('System templates cannot be modified');
    }

    const { name, description, category, permissions, version } =
      updateTemplateDto;

    // Check if name is being changed and if it conflicts with existing template
    if (name && name !== template.name) {
      const existingTemplate = await this.prisma.permissionTemplate.findUnique({
        where: { name },
      });

      if (existingTemplate) {
        throw new BadRequestException(
          `Template with name '${name}' already exists`,
        );
      }
    }

    // Validate permissions array if provided
    if (
      permissions &&
      (!Array.isArray(permissions) || permissions.length === 0)
    ) {
      throw new BadRequestException('Permissions must be a non-empty array');
    }

    return this.prisma.permissionTemplate.update({
      where: { id },
      data: {
        name,
        description,
        category,
        permissions,
        version,
        updatedAt: new Date(),
      },
    });
  }

  async deleteTemplate(id: string) {
    const template = await this.prisma.permissionTemplate.findUnique({
      where: { id },
      include: {
        presets: {
          where: { isActive: true },
          select: { id: true, name: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(
        `Permission template with ID '${id}' not found`,
      );
    }

    if (template.isSystem) {
      throw new BadRequestException('System templates cannot be deleted');
    }

    if (template.presets.length > 0) {
      throw new BadRequestException(
        `Cannot delete template. It has ${template.presets.length} active presets. Delete presets first.`,
      );
    }

    return this.prisma.permissionTemplate.delete({
      where: { id },
    });
  }

  // Permission Preset Methods
  async createPreset(createPresetDto: CreatePermissionPresetDto) {
    const { name, description, templateId, customizations } = createPresetDto;

    // Check if template exists
    const template = await this.prisma.permissionTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(
        `Permission template with ID '${templateId}' not found`,
      );
    }

    // Check if preset with same name already exists
    const existingPreset = await this.prisma.permissionPreset.findUnique({
      where: { name },
    });

    if (existingPreset) {
      throw new BadRequestException(
        `Preset with name '${name}' already exists`,
      );
    }

    // Validate customizations
    if (customizations && !Array.isArray(customizations)) {
      throw new BadRequestException('Customizations must be an array');
    }

    return this.prisma.permissionPreset.create({
      data: {
        name,
        description,
        templateId,
        customizations: customizations || [],
      },
      include: {
        template: {
          select: { id: true, name: true, category: true, permissions: true },
        },
      },
    });
  }

  async findAllPresets() {
    return this.prisma.permissionPreset.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: { id: true, name: true, category: true, permissions: true },
        },
      },
    });
  }

  async findPresetById(id: string) {
    const preset = await this.prisma.permissionPreset.findUnique({
      where: { id },
      include: {
        template: {
          select: { id: true, name: true, category: true, permissions: true },
        },
      },
    });

    if (!preset) {
      throw new NotFoundException(
        `Permission preset with ID '${id}' not found`,
      );
    }

    return preset;
  }

  async updatePreset(id: string, updatePresetDto: UpdatePermissionPresetDto) {
    const preset = await this.prisma.permissionPreset.findUnique({
      where: { id },
    });

    if (!preset) {
      throw new NotFoundException(
        `Permission preset with ID '${id}' not found`,
      );
    }

    const { name, description, templateId, customizations, isActive } =
      updatePresetDto;

    // Check if name is being changed and if it conflicts with existing preset
    if (name && name !== preset.name) {
      const existingPreset = await this.prisma.permissionPreset.findUnique({
        where: { name },
      });

      if (existingPreset) {
        throw new BadRequestException(
          `Preset with name '${name}' already exists`,
        );
      }
    }

    // Check if template exists if templateId is being changed
    if (templateId && templateId !== preset.templateId) {
      const template = await this.prisma.permissionTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new NotFoundException(
          `Permission template with ID '${templateId}' not found`,
        );
      }
    }

    // Validate customizations if provided
    if (customizations && !Array.isArray(customizations)) {
      throw new BadRequestException('Customizations must be an array');
    }

    return this.prisma.permissionPreset.update({
      where: { id },
      data: {
        name,
        description,
        templateId,
        customizations,
        isActive,
        updatedAt: new Date(),
      },
      include: {
        template: {
          select: { id: true, name: true, category: true, permissions: true },
        },
      },
    });
  }

  async deletePreset(id: string) {
    const preset = await this.prisma.permissionPreset.findUnique({
      where: { id },
    });

    if (!preset) {
      throw new NotFoundException(
        `Permission preset with ID '${id}' not found`,
      );
    }

    return this.prisma.permissionPreset.delete({
      where: { id },
    });
  }

  // Utility Methods
  async getTemplateCategories() {
    const categories = await this.prisma.permissionTemplate.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return categories.map((cat) => cat.category);
  }

  async getPresetPermissions(presetId: string) {
    const preset = await this.prisma.permissionPreset.findUnique({
      where: { id: presetId },
      include: {
        template: {
          select: { permissions: true },
        },
      },
    });

    if (!preset) {
      throw new NotFoundException(
        `Permission preset with ID '${presetId}' not found`,
      );
    }

    const basePermissions = preset.template.permissions as string[];
    const customizations = preset.customizations as any[];

    // Apply customizations to base permissions
    let finalPermissions = [...basePermissions];

    if (customizations && customizations.length > 0) {
      customizations.forEach((customization) => {
        if (
          customization.action === 'ADD' &&
          !finalPermissions.includes(customization.permission)
        ) {
          finalPermissions.push(customization.permission);
        } else if (customization.action === 'REMOVE') {
          finalPermissions = finalPermissions.filter(
            (p) => p !== customization.permission,
          );
        }
      });
    }

    return finalPermissions;
  }
}

