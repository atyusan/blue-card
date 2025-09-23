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
  const { user, isLoading, hasPermission, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { requiredRole, requiredPermissions, redirectTo = '/login' } = options;

  const isAuthenticated = !!user;

  useEffect(() => {
    if (isLoading) return; // Wait for auth to load

    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate(redirectTo, { replace: true });
      return;
    }

    // Check if user has required role (simplified - just check if admin)
    if (requiredRole && requiredRole === 'admin' && !isAdmin()) {
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
    isAdmin,
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
  const { isAdmin } = useAuth();
  if (role === 'admin') return isAdmin();
  return false; // Simplified - only admin role is supported
};

/**
 * Hook for getting user permissions
 */
export const usePermissions = () => {
  const { getUserPermissions } = useAuth();
  return getUserPermissions();
};
