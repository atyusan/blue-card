import { SetMetadata } from '@nestjs/common';
import { PermissionMetadata } from '../guards/permissions.guard';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route
 * @param permissions Array of required permissions
 * @param requireAll If true, user must have ALL permissions. If false, user must have AT LEAST ONE permission
 */
export const RequirePermissions = (
  permissions: string[],
  requireAll: boolean = false,
) => SetMetadata(PERMISSIONS_KEY, { permissions, requireAll });

/**
 * Decorator to require a single permission
 * @param permission The required permission
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSIONS_KEY, { permissions: [permission], requireAll: true });

/**
 * Decorator to require admin access
 */
export const RequireAdmin = () =>
  SetMetadata(PERMISSIONS_KEY, { permissions: ['admin'], requireAll: true });

