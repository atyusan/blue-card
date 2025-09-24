import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';

export const usePermissions = () => {
  const context = useAuth();

  if (!context) {
    throw new Error('usePermissions must be used within an AuthProvider');
  }

  const { user } = context;

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user || !user.permissions) return false;

      // Check if user has admin access
      if (user.permissions.includes('admin')) return true;

      // Check for specific permission
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user || !user.permissions) return false;

    // Check if user has admin access
    if (user.permissions.includes('admin')) return true;

    // Check if user has any of the required permissions
    return permissions.some((permission) =>
      user.permissions?.includes(permission)
    );
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user || !user.permissions) return false;

    // Check if user has admin access
    if (user.permissions.includes('admin')) return true;

    // Check if user has all required permissions
    return permissions.every((permission) =>
      user.permissions?.includes(permission)
    );
  };

  const getUserPermissions = (): string[] => {
    if (!user || !user.permissions) return [];
    return user.permissions;
  };

  const isAdmin = useCallback((): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('admin');
  }, [user]);

  // Specific permission check methods
  const canViewDepartments = useCallback((): boolean => {
    return (
      hasPermission('view_departments') ||
      hasPermission('manage_departments') ||
      isAdmin()
    );
  }, [hasPermission, isAdmin]);

  const canViewPermissionAnalytics = (): boolean => {
    return (
      hasPermission('view_permission_analytics') ||
      hasPermission('system_configuration') ||
      isAdmin()
    );
  };

  const canViewRoles = (): boolean => {
    return (
      hasPermission('view_roles') || hasPermission('manage_roles') || isAdmin()
    );
  };

  const canViewPermissionTemplates = (): boolean => {
    return (
      hasPermission('view_permission_templates') ||
      hasPermission('manage_permission_templates') ||
      isAdmin()
    );
  };

  const canViewPermissionWorkflows = (): boolean => {
    return (
      hasPermission('view_permission_workflows') ||
      hasPermission('manage_permission_workflows') ||
      isAdmin()
    );
  };

  const canViewTemporaryPermissions = (): boolean => {
    return (
      hasPermission('view_temporary_permissions') ||
      hasPermission('manage_temporary_permissions') ||
      isAdmin()
    );
  };

  const canViewSystemSettings = (): boolean => {
    return hasPermission('system_configuration') || isAdmin();
  };

  const canManageRoles = (): boolean => {
    return (
      hasPermission('manage_roles') ||
      hasPermission('system_configuration') ||
      isAdmin()
    );
  };

  const canManageDepartments = useCallback((): boolean => {
    return (
      hasPermission('manage_departments') ||
      hasPermission('system_configuration') ||
      isAdmin()
    );
  }, [hasPermission, isAdmin]);

  // Staff permission methods
  const canViewStaff = useCallback((): boolean => {
    return (
      hasPermission('view_staff') || hasPermission('manage_staff') || isAdmin()
    );
  }, [hasPermission, isAdmin]);

  const canManageStaff = useCallback((): boolean => {
    return (
      hasPermission('manage_staff') ||
      hasPermission('create_staff') ||
      hasPermission('edit_staff') ||
      hasPermission('delete_staff') ||
      isAdmin()
    );
  }, [hasPermission, isAdmin]);

  const canCreateStaff = useCallback((): boolean => {
    return (
      hasPermission('create_staff') ||
      hasPermission('manage_staff') ||
      isAdmin()
    );
  }, [hasPermission, isAdmin]);

  const canEditStaff = useCallback((): boolean => {
    return (
      hasPermission('edit_staff') || hasPermission('manage_staff') || isAdmin()
    );
  }, [hasPermission, isAdmin]);

  const canDeleteStaff = useCallback((): boolean => {
    return (
      hasPermission('delete_staff') ||
      hasPermission('manage_staff') ||
      isAdmin()
    );
  }, [hasPermission, isAdmin]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    isAdmin,
    canViewDepartments,
    canManageDepartments,
    canViewPermissionAnalytics,
    canViewRoles,
    canViewPermissionTemplates,
    canViewPermissionWorkflows,
    canViewTemporaryPermissions,
    canViewSystemSettings,
    canManageRoles,
    canViewStaff,
    canManageStaff,
    canCreateStaff,
    canEditStaff,
    canDeleteStaff,
    user,
  };
};
