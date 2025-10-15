/* eslint-disable @typescript-eslint/no-explicit-any */
import { http } from './api';
import type { User, LoginFormData } from '../types';
import { setLocalStorage, removeLocalStorage } from '../utils';
import { STORAGE_KEYS } from '../constants';

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthService {
  // Login user
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    try {
      const response = await http.post<LoginResponse>(
        '/auth/login',
        credentials
      );

      // The http.post extracts response.data, so we get the LoginResponse directly
      const loginData = response as LoginResponse;

      // Validate the response structure
      if (!loginData.access_token || !loginData.user) {
        throw new Error('Invalid response structure from server');
      }

      // Store auth data in localStorage
      setLocalStorage(STORAGE_KEYS.AUTH_TOKEN, loginData.access_token);
      setLocalStorage(STORAGE_KEYS.USER_DATA, loginData.user);
      // Note: Backend doesn't provide refreshToken, so we'll handle token refresh differently

      return loginData;
    } catch (error) {
      console.error('Login error:', error);

      // If it's an Axios error, extract the message from the response
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
        if (axiosError.response?.data) {
          throw new Error(axiosError.response.data);
        }
      }

      // Fallback error message
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token on server
      await http.post('/auth/logout');
    } catch {
      // Continue with logout even if server call fails
      console.warn('Server logout failed, continuing with local logout');
    } finally {
      // Clear local storage
      removeLocalStorage(STORAGE_KEYS.AUTH_TOKEN);
      removeLocalStorage(STORAGE_KEYS.USER_DATA);
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      const response = await http.get<User>('/auth/profile');
      return response;
    } catch {
      throw new Error('Failed to fetch user profile');
    }
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await http.put<User>('/auth/profile', userData);

      // Update stored user data
      const currentUser = this.getStoredUser();
      if (currentUser) {
        setLocalStorage(STORAGE_KEYS.USER_DATA, {
          ...currentUser,
          ...response,
        });
      }

      return response;
    } catch {
      throw new Error('Failed to update profile');
    }
  }

  // Change password
  async changePassword(passwordData: ChangePasswordData): Promise<void> {
    try {
      await http.post('/auth/change-password', passwordData);
    } catch {
      throw new Error('Failed to change password');
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await http.post('/auth/forgot-password', { email });
    } catch {
      throw new Error('Failed to request password reset');
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await http.post('/auth/reset-password', { token, newPassword });
    } catch {
      throw new Error('Failed to reset password');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    return !!token && !this.isTokenExpired(token);
  }

  // Get stored auth token
  getStoredToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // Get stored user data
  getStoredUser(): User | null {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  // Get token expiration time
  getTokenExpirationTime(token: string): Date | null {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  // Check if token will expire soon (within 5 minutes)
  isTokenExpiringSoon(token: string): boolean {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const fiveMinutes = 5 * 60;
      return payload.exp - currentTime < fiveMinutes;
    } catch {
      return true;
    }
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user?.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getStoredUser();
    return user ? roles.includes(user.role) : false;
  }

  // Check if user has permission for specific action
  hasPermission(action: string): boolean {
    const user = this.getStoredUser();
    if (!user) return false;

    // NOTE: These are fallback permissions. Real permissions come from the backend via AuthContext.
    // This is kept for backward compatibility but should not be relied upon for new features.
    const permissions: Record<string, string[]> = {
      ADMIN: ['*'], // Admin has all permissions
      DOCTOR: [
        'view_patients',
        'edit_patients',
        'view_appointments',
        'edit_appointments',
        'cancel_appointments',
        'reschedule_appointments',
        'manage_provider_availability',
        'view_provider_availability',
        'manage_provider_schedules',
        'manage_provider_time_off',
        'manage_appointment_slots',
        'view_appointment_slots',
        'manage_appointment_waitlist',
        'view_billing',
      ],
      NURSE: [
        'view_patients',
        'view_appointments',
        'update_appointments',
        'cancel_appointments',
        'reschedule_appointments',
        'manage_provider_availability',
        'view_provider_availability',
        'manage_provider_schedules',
        'manage_provider_time_off',
        'view_appointment_slots',
        'view_billing',
      ],
      RECEPTIONIST: [
        'view_patients',
        'edit_patients',
        'view_appointments',
        'edit_appointments',
        'cancel_appointments',
        'reschedule_appointments',
        'view_provider_availability',
        'view_appointment_slots',
        'manage_appointment_waitlist',
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

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(action);
  }

  // Get user's permissions
  getUserPermissions(): string[] {
    const user = this.getStoredUser();
    if (!user) return [];

    // NOTE: These are fallback permissions. Real permissions come from the backend via AuthContext.
    const permissions: Record<string, string[]> = {
      ADMIN: ['*'],
      DOCTOR: [
        'view_patients',
        'edit_patients',
        'view_appointments',
        'edit_appointments',
        'cancel_appointments',
        'reschedule_appointments',
        'manage_provider_availability',
        'view_provider_availability',
        'manage_provider_schedules',
        'manage_provider_time_off',
        'manage_appointment_slots',
        'view_appointment_slots',
        'manage_appointment_waitlist',
        'view_billing',
      ],
      NURSE: [
        'view_patients',
        'view_appointments',
        'update_appointments',
        'cancel_appointments',
        'reschedule_appointments',
        'manage_provider_availability',
        'view_provider_availability',
        'manage_provider_schedules',
        'manage_provider_time_off',
        'view_appointment_slots',
        'view_billing',
      ],
      RECEPTIONIST: [
        'view_patients',
        'edit_patients',
        'view_appointments',
        'edit_appointments',
        'cancel_appointments',
        'reschedule_appointments',
        'view_provider_availability',
        'view_appointment_slots',
        'manage_appointment_waitlist',
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
  }
}

export const authService = new AuthService();
export default authService;
