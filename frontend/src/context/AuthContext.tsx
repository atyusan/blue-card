import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types/auth';
import type { StaffMember } from '@/types/staff';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  staffMember: StaffMember | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAdmin: () => boolean;
  getUserPermissions: () => string[];
  getTemporaryPermissions: () => Promise<unknown[]>;
  requestTemporaryPermission: (
    permission: string,
    reason: string,
    expiresAt: string
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (!token || !userData) {
        setIsLoading(false);
        return;
      }

      // Set token in API client
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Parse stored user data
      const parsedUserData = JSON.parse(userData);
      setUser(parsedUserData);
      setStaffMember(parsedUserData.staffMember || null);
      setError(null);
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      delete apiClient.defaults.headers.common['Authorization'];
      setUser(null);
      setStaffMember(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });
      const { access_token, user: userData } = response.data;

      // Store token and user data
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      apiClient.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${access_token}`;

      // Set user data
      setUser(userData);
      setStaffMember(userData.staffMember || null);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    setStaffMember(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      const userData = response.data;

      // Update localStorage with fresh user data
      localStorage.setItem('user_data', JSON.stringify(userData));

      setUser(userData);
      setStaffMember(userData.staffMember || null);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      logout();
    }
  };

  // Permission checking methods
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Check if user has admin permission
    if (user.permissions && Array.isArray(user.permissions)) {
      if (user.permissions.includes('admin')) return true;
      return user.permissions.includes(permission);
    }

    return false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;

    // Check if user has admin permission
    if (user.permissions && Array.isArray(user.permissions)) {
      if (user.permissions.includes('admin')) return true;
      return permissions.some((permission) =>
        user?.permissions?.includes(permission)
      );
    }

    return false;
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;

    // Check if user has admin permission
    if (user.permissions && Array.isArray(user.permissions)) {
      if (user.permissions.includes('admin')) return true;
      return permissions.every((permission) =>
        user?.permissions?.includes(permission)
      );
    }

    return false;
  };

  const isAdmin = (): boolean => {
    return hasPermission('admin');
  };

  const getUserPermissions = (): string[] => {
    if (!user || !user.permissions) return [];
    return Array.isArray(user.permissions) ? user.permissions : [];
  };

  // Temporary permission methods
  const getTemporaryPermissions = async (): Promise<unknown[]> => {
    try {
      const response = await apiClient.get('/temporary-permissions');
      return response.data;
    } catch (err) {
      console.error('Failed to get temporary permissions:', err);
      return [];
    }
  };

  const requestTemporaryPermission = async (
    permission: string,
    reason: string,
    expiresAt: string
  ): Promise<void> => {
    try {
      await apiClient.post('/temporary-permissions', {
        permission,
        reason,
        expiresAt,
      });

      // Refresh user data to get updated permissions
      await refreshUser();
    } catch (err) {
      console.error('Failed to request temporary permission:', err);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    staffMember,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    getUserPermissions,
    getTemporaryPermissions,
    requestTemporaryPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
