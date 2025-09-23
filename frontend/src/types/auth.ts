export interface User {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  permissions?: string[]; // Array of permission strings
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// StaffMember interface moved to @/types/department

// Department interface moved to @/types/department

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffRoleAssignment {
  id: string;
  staffMemberId: string;
  roleId: string;
  assignedBy?: string;
  assignedAt: string;
  isActive: boolean;
  expiresAt?: string;
  scope: 'GLOBAL' | 'DEPARTMENT' | 'SERVICE' | 'PATIENT';
  scopeId?: string;
  conditions?: any[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  role?: Role;
  assignedByStaff?: any; // Will be typed as StaffMember from @/types/department
}

export interface TemporaryPermission {
  id: string;
  userId: string;
  permission: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string;
  reason: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  grantedByStaff?: any; // Will be typed as StaffMember from @/types/department
  auditTrail?: PermissionAuditEntry[];
}

export interface PermissionAuditEntry {
  id: string;
  action: 'GRANTED' | 'REVOKED' | 'EXPIRED' | 'EXTENDED';
  timestamp: string;
  performedBy: string;
  reason?: string;
  metadata?: any;
  temporaryPermissionId?: string;
}

export interface PermissionTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  permissions: string[];
  isSystem: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
  presets?: PermissionPreset[];
}

export interface PermissionPreset {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  customizations: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  template?: PermissionTemplate;
}

export interface PermissionRequest {
  id: string;
  requesterId: string;
  permission: string;
  reason: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  requestedAt: string;
  expiresAt?: string;
  approvers: PermissionApprover[];
  createdAt: string;
  updatedAt: string;
  requester?: User;
}

export interface PermissionApprover {
  id: string;
  permissionRequestId: string;
  userId: string;
  role: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  required: boolean;
  comments?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// Permission categories for organization
export type PermissionCategory =
  | 'Patient Management'
  | 'Billing & Finance'
  | 'Laboratory'
  | 'Pharmacy'
  | 'Surgery'
  | 'Cash Management'
  | 'System Administration'
  | 'General';

// Common permission strings
export const COMMON_PERMISSIONS = {
  // Patient Management
  VIEW_PATIENTS: 'view_patients',
  MANAGE_PATIENTS: 'manage_patients',
  CREATE_PATIENTS: 'create_patients',
  EDIT_PATIENTS: 'edit_patients',
  DELETE_PATIENTS: 'delete_patients',

  // Staff Management
  VIEW_STAFF: 'view_staff',
  MANAGE_STAFF: 'manage_staff',
  CREATE_STAFF: 'create_staff',
  EDIT_STAFF: 'edit_staff',
  DELETE_STAFF: 'delete_staff',

  // Department Management
  VIEW_DEPARTMENTS: 'view_departments',
  MANAGE_DEPARTMENTS: 'manage_departments',

  // Service Management
  VIEW_SERVICES: 'view_services',
  MANAGE_SERVICES: 'manage_services',

  // Appointments
  VIEW_APPOINTMENTS: 'view_appointments',
  MANAGE_APPOINTMENTS: 'manage_appointments',

  // Billing
  VIEW_BILLING: 'view_billing',
  EDIT_BILLING: 'edit_billing',
  MANAGE_BILLING: 'manage_billing',

  // Cash Management
  VIEW_CASH_TRANSACTIONS: 'view_cash_transactions',
  MANAGE_CASH_TRANSACTIONS: 'manage_cash_transactions',

  // Lab Tests
  VIEW_LAB_TESTS: 'view_lab_tests',
  MANAGE_LAB_TESTS: 'manage_lab_tests',

  // Medications
  VIEW_MEDICATIONS: 'view_medications',
  MANAGE_MEDICATIONS: 'manage_medications',

  // Surgery
  PERFORM_SURGERY: 'perform_surgery',
  VIEW_SURGERY: 'view_surgery',

  // System Administration
  MANAGE_PERMISSIONS: 'manage_permissions',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',

  // Temporary Permissions
  GRANT_TEMPORARY_PERMISSIONS: 'grant_temporary_permissions',
  MANAGE_TEMPORARY_PERMISSIONS: 'manage_temporary_permissions',

  // Permission Requests
  APPROVE_PERMISSION_REQUESTS: 'approve_permission_requests',
  MANAGE_PERMISSION_REQUESTS: 'manage_permission_requests',
  CREATE_PERMISSION_REQUESTS: 'create_permission_requests',
  VIEW_PERMISSION_REQUESTS: 'view_permission_requests',
  EDIT_PERMISSION_REQUESTS: 'edit_permission_requests',
  DELETE_PERMISSION_REQUESTS: 'delete_permission_requests',
  CANCEL_PERMISSION_REQUESTS: 'cancel_permission_requests',

  // Analytics
  VIEW_PERMISSION_ANALYTICS: 'view_permission_analytics',

  // Permission Templates
  VIEW_PERMISSION_TEMPLATES: 'view_permission_templates',
  MANAGE_PERMISSION_TEMPLATES: 'manage_permission_templates',

  // Temporary Permissions
  VIEW_TEMPORARY_PERMISSIONS: 'view_temporary_permissions',

  // Permission Workflows
  VIEW_PERMISSION_WORKFLOWS: 'view_permission_workflows',

  // Admin override
  ADMIN: 'admin',
} as const;

export type PermissionString =
  (typeof COMMON_PERMISSIONS)[keyof typeof COMMON_PERMISSIONS];
