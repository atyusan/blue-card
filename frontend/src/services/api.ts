import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '../constants';
import { getLocalStorage, removeLocalStorage } from '../utils';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token to headers if available
    const token = getLocalStorage<string>(STORAGE_KEYS.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp
    if (config.headers) {
      config.headers['X-Request-Timestamp'] = new Date().toISOString();
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(
        `API Response [${response.config.method?.toUpperCase()}] ${
          response.config.url
        }:`,
        response.data
      );
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear stored auth data
      removeLocalStorage(STORAGE_KEYS.AUTH_TOKEN);
      removeLocalStorage(STORAGE_KEYS.USER_DATA);

      // Don't redirect immediately, let the calling code handle it
      // This allows React Query to properly handle the error
      console.warn('Authentication required. Please login to continue.');
    }

    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data);
      // You can show a toast notification here
    }

    // Handle 500+ server errors
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
      // You can show a toast notification here
    }

    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(
        `API Error [${originalRequest?.method?.toUpperCase()}] ${
          originalRequest?.url
        }:`,
        error.response?.data || error.message
      );
    }

    return Promise.reject(error);
  }
);

// API response wrapper
export const apiResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

// API error wrapper
export const apiError = (error: AxiosError): string => {
  if (
    error.response?.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data
  ) {
    return (error.response.data as any).message;
  }

  if (error.response?.data && typeof error.response.data === 'string') {
    return error.response.data;
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// HTTP methods
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return api.get(url, config).then(apiResponse);
  },

  post: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return api.post(url, data, config).then(apiResponse);
  },

  put: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return api.put(url, data, config).then(apiResponse);
  },

  patch: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return api.patch(url, data, config).then(apiResponse);
  },

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return api.delete(url, config).then(apiResponse);
  },
};

export default api;
