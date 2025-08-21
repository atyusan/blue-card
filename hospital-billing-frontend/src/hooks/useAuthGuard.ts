import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface UseAuthGuardOptions {
  requiredRole?: string;
  requiredPermissions?: string[];
  redirectTo?: string;
}

/**
 * Hook for protecting routes based on authentication and permissions
 */
export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } =
    useAuth();
  const navigate = useNavigate();
  const { requiredRole, requiredPermissions, redirectTo = '/login' } = options;

  useEffect(() => {
    if (isLoading) return; // Wait for auth to load

    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate(redirectTo, { replace: true });
      return;
    }

    // Check if user has required role
    if (requiredRole && !hasRole(requiredRole)) {
      navigate('/unauthorized', { replace: true });
      return;
    }

    // Check if user has required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        hasPermission(permission)
      );

      if (!hasAllPermissions) {
        navigate('/unauthorized', { replace: true });
        return;
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    hasRole,
    hasPermission,
    requiredRole,
    requiredPermissions,
    redirectTo,
    navigate,
  ]);

  return {
    isAuthenticated,
    isLoading,
    user,
    hasRole,
    hasPermission,
  };
};

/**
 * Hook for checking if user can perform a specific action
 */
export const useCan = (action: string): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(action);
};

/**
 * Hook for checking if user has a specific role
 */
export const useHasRole = (role: string): boolean => {
  const { hasRole } = useAuth();
  return hasRole(role);
};

/**
 * Hook for getting user permissions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  if (!user) return [];

  const permissions: Record<string, string[]> = {
    ADMIN: ['*'],
    DOCTOR: [
      'view_patients',
      'edit_patients',
      'view_appointments',
      'edit_appointments',
      'view_billing',
    ],
    NURSE: ['view_patients', 'view_appointments', 'view_billing'],
    RECEPTIONIST: [
      'view_patients',
      'edit_patients',
      'view_appointments',
      'edit_appointments',
      'view_billing',
      'edit_billing',
    ],
    ACCOUNTANT: [
      'view_patients',
      'view_billing',
      'edit_billing',
      'view_payments',
      'edit_payments',
    ],
    CASHIER: [
      'view_patients',
      'view_billing',
      'view_payments',
      'edit_payments',
    ],
  };

  return permissions[user.role] || [];
};
