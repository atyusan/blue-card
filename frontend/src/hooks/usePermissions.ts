import { useAuth } from '@/context/AuthContext';

export const usePermissions = () => {
  const context = useAuth();

  if (!context) {
    throw new Error('usePermissions must be used within an AuthProvider');
  }

  const { user } = context;

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;

    // Check if user has admin access
    if (user.permissions.includes('admin')) return true;

    // Check for specific permission
    return user.permissions.includes(permission);
  };

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

  const isAdmin = (): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('admin');
  };

  // Specific permission check methods
  const canViewDepartments = (): boolean => {
    return (
      hasPermission('view_departments') ||
      hasPermission('manage_departments') ||
      isAdmin()
    );
  };

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

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    isAdmin,
    canViewDepartments,
    canViewPermissionAnalytics,
    canViewRoles,
    canViewPermissionTemplates,
    canViewPermissionWorkflows,
    canViewTemporaryPermissions,
    canViewSystemSettings,
    canManageRoles,
    user,
  };
};
