import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export interface PermissionMetadata {
  permissions?: string[];
  requireAll?: boolean;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.get<PermissionMetadata>(
      'permissions',
      context.getHandler(),
    );

    if (
      !metadata ||
      !metadata.permissions ||
      metadata.permissions.length === 0
    ) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userPermissions = user.permissions || [];

    // Check if user has admin permissions
    if (userPermissions.includes('admin')) {
      return true;
    }

    const requiredPermissions = metadata.permissions;
    const requireAll = metadata.requireAll || false;

    if (requireAll) {
      // User must have ALL required permissions
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
        );
      }
    } else {
      // User must have AT LEAST ONE of the required permissions
      const hasAnyPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAnyPermission) {
        throw new ForbiddenException(
          `Insufficient permissions. Required one of: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    return true;
  }
}

