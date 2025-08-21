import type { NavigationItem } from '../types';
import { UserRole } from '../types';

// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
export const API_TIMEOUT = 30000;

// Navigation Items
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'Dashboard',
    path: '/dashboard',
    permission: [
      UserRole.ADMIN,
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
      UserRole.ACCOUNTANT,
      UserRole.CASHIER,
    ],
  },
  {
    id: 'patients',
    label: 'Patients',
    icon: 'People',
    path: '/patients',
    permission: [
      UserRole.ADMIN,
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
      UserRole.ACCOUNTANT,
      UserRole.CASHIER,
    ],
    children: [
      {
        id: 'patients-list',
        label: 'Patient List',
        icon: 'People',
        path: '/patients',
        permission: [
          UserRole.ADMIN,
          UserRole.DOCTOR,
          UserRole.NURSE,
          UserRole.RECEPTIONIST,
          UserRole.ACCOUNTANT,
          UserRole.CASHIER,
        ],
      },
      {
        id: 'patients-add',
        label: 'Add Patient',
        icon: 'Person',
        path: '/patients/add',
        permission: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST],
      },
      {
        id: 'patients-import',
        label: 'Import Patients',
        icon: 'BusinessCenter',
        path: '/patients/import',
        permission: [UserRole.ADMIN, UserRole.RECEPTIONIST],
      },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    icon: 'MedicalServices',
    path: '/services',
    permission: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.ACCOUNTANT],
    children: [
      {
        id: 'services-list',
        label: 'Service Catalog',
        icon: 'MedicalServices',
        path: '/services',
        permission: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.ACCOUNTANT],
      },
      {
        id: 'services-add',
        label: 'Add Service',
        icon: 'LocalHospital',
        path: '/services/add',
        permission: [UserRole.ADMIN, UserRole.DOCTOR],
      },
      {
        id: 'service-categories',
        label: 'Categories',
        icon: 'BusinessCenter',
        path: '/services/categories',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT],
      },
    ],
  },
  {
    id: 'admissions',
    label: 'Admissions & Wards',
    icon: 'Hotel',
    path: '/admissions',
    permission: [
      UserRole.ADMIN,
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
    ],
    children: [
      {
        id: 'admissions-list',
        label: 'All Admissions',
        icon: 'Hotel',
        path: '/admissions',
        permission: [
          UserRole.ADMIN,
          UserRole.DOCTOR,
          UserRole.NURSE,
          UserRole.RECEPTIONIST,
        ],
      },
      {
        id: 'admissions-active',
        label: 'Active Admissions',
        icon: 'LocalHospital',
        path: '/admissions/active',
        permission: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE],
      },
      {
        id: 'admissions-wards',
        label: 'Ward Management',
        icon: 'BusinessCenter',
        path: '/admissions/wards',
        permission: [UserRole.ADMIN, UserRole.NURSE],
      },
      {
        id: 'admissions-discharge',
        label: 'Discharge Planning',
        icon: 'Timeline',
        path: '/admissions/discharge',
        permission: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE],
      },
    ],
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    icon: 'LocalPharmacy',
    path: '/pharmacy',
    permission: [
      UserRole.ADMIN,
      UserRole.DOCTOR,
      UserRole.PHARMACIST,
      UserRole.NURSE,
    ],
    children: [
      {
        id: 'pharmacy-medications',
        label: 'Medications',
        icon: 'LocalPharmacy',
        path: '/pharmacy/medications',
        permission: [UserRole.ADMIN, UserRole.PHARMACIST, UserRole.DOCTOR],
      },
      {
        id: 'pharmacy-prescriptions',
        label: 'Prescriptions',
        icon: 'Receipt',
        path: '/pharmacy/prescriptions',
        permission: [
          UserRole.ADMIN,
          UserRole.DOCTOR,
          UserRole.PHARMACIST,
          UserRole.NURSE,
        ],
      },
      {
        id: 'pharmacy-inventory',
        label: 'Inventory',
        icon: 'BusinessCenter',
        path: '/pharmacy/inventory',
        permission: [UserRole.ADMIN, UserRole.PHARMACIST],
      },
      {
        id: 'pharmacy-dispensing',
        label: 'Dispensing',
        icon: 'LocalHospital',
        path: '/pharmacy/dispensing',
        permission: [UserRole.ADMIN, UserRole.PHARMACIST],
      },
    ],
  },
  {
    id: 'laboratory',
    label: 'Laboratory',
    icon: 'Biotech',
    path: '/laboratory',
    permission: [
      UserRole.ADMIN,
      UserRole.DOCTOR,
      UserRole.LAB_TECHNICIAN,
      UserRole.NURSE,
    ],
    children: [
      {
        id: 'lab-orders',
        label: 'Lab Orders',
        icon: 'Biotech',
        path: '/laboratory/orders',
        permission: [
          UserRole.ADMIN,
          UserRole.DOCTOR,
          UserRole.LAB_TECHNICIAN,
          UserRole.NURSE,
        ],
      },
      {
        id: 'lab-tests',
        label: 'Tests & Results',
        icon: 'Assessment',
        path: '/laboratory/tests',
        permission: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN],
      },
      {
        id: 'lab-pending',
        label: 'Pending Tests',
        icon: 'Timeline',
        path: '/laboratory/pending',
        permission: [UserRole.ADMIN, UserRole.LAB_TECHNICIAN],
      },
      {
        id: 'lab-reports',
        label: 'Test Reports',
        icon: 'Assessment',
        path: '/laboratory/reports',
        permission: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN],
      },
    ],
  },
  {
    id: 'surgery',
    label: 'Surgery',
    icon: 'LocalHospitalOutlined',
    path: '/surgery',
    permission: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE],
    children: [
      {
        id: 'surgery-schedule',
        label: 'Surgery Schedule',
        icon: 'Event',
        path: '/surgery/schedule',
        permission: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE],
      },
      {
        id: 'surgery-upcoming',
        label: 'Upcoming Surgeries',
        icon: 'Timeline',
        path: '/surgery/upcoming',
        permission: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE],
      },
      {
        id: 'surgery-rooms',
        label: 'Operating Rooms',
        icon: 'LocalHospital',
        path: '/surgery/rooms',
        permission: [UserRole.ADMIN, UserRole.DOCTOR],
      },
      {
        id: 'surgery-procedures',
        label: 'Procedures',
        icon: 'MedicalServices',
        path: '/surgery/procedures',
        permission: [UserRole.ADMIN, UserRole.DOCTOR],
      },
    ],
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: 'Event',
    path: '/appointments',
    permission: [
      UserRole.ADMIN,
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
    ],
    children: [
      {
        id: 'appointments-list',
        label: 'All Appointments',
        icon: 'Event',
        path: '/appointments',
        permission: [
          UserRole.ADMIN,
          UserRole.DOCTOR,
          UserRole.NURSE,
          UserRole.RECEPTIONIST,
        ],
      },
      {
        id: 'appointments-schedule',
        label: 'Schedule',
        icon: 'Timeline',
        path: '/appointments/schedule',
        permission: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST],
      },
      {
        id: 'appointments-calendar',
        label: 'Calendar View',
        icon: 'Event',
        path: '/appointments/calendar',
        permission: [
          UserRole.ADMIN,
          UserRole.DOCTOR,
          UserRole.NURSE,
          UserRole.RECEPTIONIST,
        ],
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing & Invoices',
    icon: 'Receipt',
    path: '/billing',
    permission: [
      UserRole.ADMIN,
      UserRole.DOCTOR,
      UserRole.RECEPTIONIST,
      UserRole.ACCOUNTANT,
      UserRole.CASHIER,
    ],
    children: [
      {
        id: 'invoices-list',
        label: 'All Invoices',
        icon: 'Receipt',
        path: '/billing',
        permission: [
          UserRole.ADMIN,
          UserRole.DOCTOR,
          UserRole.RECEPTIONIST,
          UserRole.ACCOUNTANT,
          UserRole.CASHIER,
        ],
      },
      {
        id: 'invoices-create',
        label: 'Create Invoice',
        icon: 'BusinessCenter',
        path: '/billing/create',
        permission: [
          UserRole.ADMIN,
          UserRole.RECEPTIONIST,
          UserRole.ACCOUNTANT,
        ],
      },
      {
        id: 'billing-settings',
        label: 'Billing Settings',
        icon: 'Settings',
        path: '/billing/settings',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT],
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: 'Payment',
    path: '/payments',
    permission: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.CASHIER],
    children: [
      {
        id: 'payments-list',
        label: 'Payment History',
        icon: 'Payment',
        path: '/payments',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.CASHIER],
      },
      {
        id: 'payments-process',
        label: 'Process Payment',
        icon: 'BusinessCenter',
        path: '/payments/process',
        permission: [UserRole.ADMIN, UserRole.CASHIER],
      },
      {
        id: 'payments-refunds',
        label: 'Refunds',
        icon: 'Timeline',
        path: '/payments/refunds',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT],
      },
    ],
  },
  {
    id: 'cash-office',
    label: 'Cash Office',
    icon: 'AccountBalance',
    path: '/cash-office',
    permission: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.CASHIER],
    children: [
      {
        id: 'cash-transactions',
        label: 'Transactions',
        icon: 'Payment',
        path: '/cash-office/transactions',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.CASHIER],
      },
      {
        id: 'petty-cash',
        label: 'Petty Cash',
        icon: 'BusinessCenter',
        path: '/cash-office/petty-cash',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.CASHIER],
      },
      {
        id: 'cash-reconciliation',
        label: 'Reconciliation',
        icon: 'Assessment',
        path: '/cash-office/reconciliation',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT],
      },
      {
        id: 'cash-reports',
        label: 'Cash Reports',
        icon: 'Timeline',
        path: '/cash-office/reports',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: 'Assessment',
    path: '/reports',
    permission: [UserRole.ADMIN, UserRole.ACCOUNTANT],
    children: [
      {
        id: 'reports-financial',
        label: 'Financial Reports',
        icon: 'Assessment',
        path: '/reports/financial',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT],
      },
      {
        id: 'reports-patient',
        label: 'Patient Reports',
        icon: 'People',
        path: '/reports/patients',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT],
      },
      {
        id: 'reports-appointments',
        label: 'Appointment Reports',
        icon: 'Event',
        path: '/reports/appointments',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT],
      },
      {
        id: 'reports-laboratory',
        label: 'Laboratory Reports',
        icon: 'Biotech',
        path: '/reports/laboratory',
        permission: [
          UserRole.ADMIN,
          UserRole.ACCOUNTANT,
          UserRole.LAB_TECHNICIAN,
        ],
      },
      {
        id: 'reports-pharmacy',
        label: 'Pharmacy Reports',
        icon: 'LocalPharmacy',
        path: '/reports/pharmacy',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.PHARMACIST],
      },
      {
        id: 'reports-surgery',
        label: 'Surgery Reports',
        icon: 'LocalHospitalOutlined',
        path: '/reports/surgery',
        permission: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DOCTOR],
      },
      {
        id: 'reports-custom',
        label: 'Custom Reports',
        icon: 'Timeline',
        path: '/reports/custom',
        permission: [UserRole.ADMIN],
      },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    icon: 'ManageAccounts',
    path: '/users',
    permission: [UserRole.ADMIN],
    children: [
      {
        id: 'users-list',
        label: 'All Users',
        icon: 'People',
        path: '/users',
        permission: [UserRole.ADMIN],
      },
      {
        id: 'users-add',
        label: 'Add User',
        icon: 'Person',
        path: '/users/add',
        permission: [UserRole.ADMIN],
      },
      {
        id: 'users-roles',
        label: 'Roles & Permissions',
        icon: 'Security',
        path: '/users/roles',
        permission: [UserRole.ADMIN],
      },
      {
        id: 'users-activity',
        label: 'User Activity',
        icon: 'Timeline',
        path: '/users/activity',
        permission: [UserRole.ADMIN],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    path: '/settings',
    permission: [UserRole.ADMIN],
    children: [
      {
        id: 'settings-general',
        label: 'General Settings',
        icon: 'Settings',
        path: '/settings',
        permission: [UserRole.ADMIN],
      },
      {
        id: 'settings-billing',
        label: 'Billing Settings',
        icon: 'Receipt',
        path: '/settings/billing',
        permission: [UserRole.ADMIN],
      },
      {
        id: 'settings-notifications',
        label: 'Notifications',
        icon: 'Notifications',
        path: '/settings/notifications',
        permission: [UserRole.ADMIN],
      },
      {
        id: 'settings-system',
        label: 'System Settings',
        icon: 'BusinessCenter',
        path: '/settings/system',
        permission: [UserRole.ADMIN],
      },
    ],
  },
];

// Form Validation Rules
export const VALIDATION_RULES = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address',
    },
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters',
    },
  },
  phoneNumber: {
    required: 'Phone number is required',
    pattern: {
      value: /^\+?[\d\s-()]+$/,
      message: 'Invalid phone number format',
    },
  },
  required: 'This field is required',
};

// Date Formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  input: 'yyyy-MM-dd',
  time: 'HH:mm',
  datetime: 'MMM dd, yyyy HH:mm',
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};

// Currency Configuration
export const CURRENCY = {
  code: 'NGN',
  symbol: '₦',
  position: 'before' as 'before' | 'after',
};

// Pagination
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
};

// Status Colors
export const STATUS_COLORS = {
  success: 'text-success-600 bg-success-50',
  warning: 'text-warning-600 bg-warning-50',
  error: 'text-error-600 bg-error-50',
  info: 'text-primary-600 bg-primary-50',
  default: 'text-gray-600 bg-gray-50',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: "Access denied. You don't have permission for this resource.",
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Record created successfully.',
  UPDATED: 'Record updated successfully.',
  DELETED: 'Record deleted successfully.',
  SAVED: 'Changes saved successfully.',
  LOGIN: 'Login successful.',
  LOGOUT: 'Logout successful.',
  PASSWORD_CHANGED: 'Password changed successfully.',
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  MAX_FILES: 5,
};

// Search and Filter
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300,
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_RESULTS: 100,
};

// Notifications
export const NOTIFICATION_CONFIG = {
  AUTO_HIDE_DURATION: 6000,
  MAX_SNACKBARS: 3,
  POSITION: {
    vertical: 'top' as 'top' | 'bottom',
    horizontal: 'right' as 'left' | 'center' | 'right',
  },
};
