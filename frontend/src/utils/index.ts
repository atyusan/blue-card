// Date formatting utilities
export const formatDate = (date: string | Date): string => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (time: string): string => {
  if (!time) return '';

  try {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return time;
  }
};

// Currency formatting
export const formatCurrency = (amount: number | string): string => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount);
  }

  if (isNaN(amount)) return '₦0.00';

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Name utilities
export const getInitials = (name: string): string => {
  if (!name) return '';

  const names = name.trim().split(' ');
  const initials = names.map((n) => n.charAt(0).toUpperCase()).join('');

  return initials.slice(0, 2); // Return max 2 initials
};

export const formatFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

// Age calculation
export const calculateAge = (dateOfBirth: string | Date): number => {
  if (!dateOfBirth) return 0;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  if (isNaN(birthDate.getTime())) return 0;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format based on length
  if (digits.length === 11 && digits.startsWith('0')) {
    // Nigerian mobile: 08012345678 -> 0801 234 5678
    return digits.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (digits.length === 10) {
    // US format: 1234567890 -> (123) 456-7890
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  return phone; // Return original if no pattern matches
};

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';

  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return '';

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  if (!text) return '';

  return text
    .split(' ')
    .map((word) => capitalizeFirst(word))
    .join(' ');
};

// Status utilities
export const getStatusColor = (
  status: string
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' => {
  if (!status) return 'default';

  const statusLower = status.toLowerCase();

  // Common status mappings
  if (
    ['active', 'completed', 'paid', 'confirmed', 'approved'].includes(
      statusLower
    )
  ) {
    return 'success';
  }

  if (['pending', 'scheduled', 'processing'].includes(statusLower)) {
    return 'warning';
  }

  if (
    ['cancelled', 'rejected', 'failed', 'overdue', 'inactive'].includes(
      statusLower
    )
  ) {
    return 'error';
  }

  if (['draft', 'new'].includes(statusLower)) {
    return 'info';
  }

  return 'default';
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  // Basic phone validation - adjust based on your requirements
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Array utilities
export const groupBy = <T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(
  array: T[],
  keyFn: (item: T) => any,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aValue = keyFn(a);
    const bValue = keyFn(b);

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Local storage utilities
export const setLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getLocalStorage = <T>(key: string, defaultValue?: T): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue || null;

    // Try to parse as JSON, if it fails, return as string
    try {
      return JSON.parse(item);
    } catch {
      // If JSON parsing fails, return the raw string value
      return item as T;
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue || null;
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// File utilities
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// URL utilities
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return searchParams.toString();
};

// Error handling utilities
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;

  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;

  return 'An unexpected error occurred';
};

// Color utilities
export const hexToRgb = (
  hex: string
): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Class name utility (commonly used with Tailwind CSS)
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatCurrency,
  getInitials,
  formatFullName,
  calculateAge,
  formatPhoneNumber,
  truncateText,
  capitalizeFirst,
  capitalizeWords,
  getStatusColor,
  isValidEmail,
  isValidPhoneNumber,
  groupBy,
  sortBy,
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
  downloadFile,
  getFileExtension,
  formatFileSize,
  debounce,
  buildQueryString,
  getErrorMessage,
  hexToRgb,
  rgbToHex,
  cn,
};
