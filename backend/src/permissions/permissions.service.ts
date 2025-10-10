import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const permissions = await this.prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { displayName: 'asc' }],
    });

    // Group permissions by category
    const groupedPermissions = permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.category]) {
          acc[permission.category] = [];
        }
        acc[permission.category].push({
          name: permission.name,
          displayName: permission.displayName,
          description: permission.description,
          module: permission.module,
        });
        return acc;
      },
      {} as Record<
        string,
        Array<{
          name: string;
          displayName: string;
          description: string | null;
          module: string | null;
        }>
      >,
    );

    return {
      permissions,
      groupedPermissions,
      categories: Object.keys(groupedPermissions).sort(),
    };
  }

  async findByCategory(category: string) {
    return this.prisma.permission.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: { displayName: 'asc' },
    });
  }

  async findByModule(module: string) {
    return this.prisma.permission.findMany({
      where: {
        module,
        isActive: true,
      },
      orderBy: { displayName: 'asc' },
    });
  }

  async getCategories() {
    const permissions = await this.prisma.permission.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return permissions.map((p) => p.category);
  }

  async getModules() {
    const permissions = await this.prisma.permission.findMany({
      where: {
        isActive: true,
        module: { not: null },
      },
      select: { module: true },
      distinct: ['module'],
      orderBy: { module: 'asc' },
    });

    return permissions.map((p) => p.module).filter(Boolean);
  }
}
