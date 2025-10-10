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

  // Appointment permission methods
  const canViewAppointments = useCallback((): boolean => {
    return hasPermission('view_appointments') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canCreateAppointments = useCallback((): boolean => {
    return hasPermission('create_appointments') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canUpdateAppointments = useCallback((): boolean => {
    return hasPermission('update_appointments') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canCancelAppointments = useCallback((): boolean => {
    return hasPermission('cancel_appointments') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canRescheduleAppointments = useCallback((): boolean => {
    return hasPermission('reschedule_appointments') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canManageAppointmentPayments = useCallback((): boolean => {
    return hasPermission('manage_appointment_payments') || isAdmin();
  }, [hasPermission, isAdmin]);

  // Treatment permission methods
  const canViewTreatments = useCallback((): boolean => {
    return hasPermission('view_treatments') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canCreateTreatments = useCallback((): boolean => {
    return hasPermission('create_treatments') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canUpdateTreatments = useCallback((): boolean => {
    return hasPermission('update_treatments') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canDeleteTreatments = useCallback((): boolean => {
    return hasPermission('delete_treatments') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canUpdateTreatmentStatus = useCallback((): boolean => {
    return hasPermission('update_treatment_status') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canManageTreatmentProviders = useCallback((): boolean => {
    return hasPermission('manage_treatment_providers') || isAdmin();
  }, [hasPermission, isAdmin]);

  const canManageTreatmentLinks = useCallback((): boolean => {
    return hasPermission('manage_treatment_links') || isAdmin();
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
    // Appointment permissions
    canViewAppointments,
    canCreateAppointments,
    canUpdateAppointments,
    canCancelAppointments,
    canRescheduleAppointments,
    canManageAppointmentPayments,
    // Treatment permissions
    canViewTreatments,
    canCreateTreatments,
    canUpdateTreatments,
    canDeleteTreatments,
    canUpdateTreatmentStatus,
    canManageTreatmentProviders,
    canManageTreatmentLinks,
    user,
  };
};
