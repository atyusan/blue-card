import { http } from './api';

export interface BillingSettings {
  // General Settings
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxNumber: string;

  // Invoice Settings
  invoiceNumberPrefix: string;
  invoiceNumberPadding: number;
  nextInvoiceNumber: number;
  invoiceFooter: string;
  invoiceTerms: string;

  // Payment Settings
  defaultPaymentMethods: string[];
  allowPartialPayments: boolean;
  automaticOverdueReminders: boolean;
  overdueReminderDays: number[];
  lateFeePercentage: number;
  enableLateFees: boolean;

  // Tax Settings
  defaultTaxRate: number;
  enableTax: boolean;
  taxName: string;

  // Currency Settings
  currency: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';

  // Notification Settings
  emailNotifications: {
    invoiceCreated: boolean;
    paymentReceived: boolean;
    overdueReminder: boolean;
    paymentFailed: boolean;
  };

  // Advanced Settings
  enableOnlinePayments: boolean;
  paystackPublicKey: string;
  paystackSecretKey: string;
  enableInvoiceTemplates: boolean;
  autoGenerateReceipts: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface SettingsResponse {
  billingSettings: BillingSettings;
  paymentMethods: PaymentMethod[];
  lastUpdated: string;
  updatedBy: string;
}

class SettingsService {
  // Get billing settings
  async getBillingSettings(): Promise<SettingsResponse> {
    const response = await http.get<SettingsResponse>('/settings/billing');
    return response;
  }

  // Update billing settings
  async updateBillingSettings(
    settings: Partial<BillingSettings>
  ): Promise<BillingSettings> {
    const response = await http.put<BillingSettings>(
      '/settings/billing',
      settings
    );
    return response;
  }

  // Get payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await http.get<PaymentMethod[]>(
      '/settings/payment-methods'
    );
    return response;
  }

  // Create payment method
  async createPaymentMethod(
    paymentMethod: Omit<PaymentMethod, 'id'>
  ): Promise<PaymentMethod> {
    const response = await http.post<PaymentMethod>(
      '/settings/payment-methods',
      paymentMethod
    );
    return response;
  }

  // Update payment method
  async updatePaymentMethod(
    id: string,
    paymentMethod: Partial<PaymentMethod>
  ): Promise<PaymentMethod> {
    const response = await http.put<PaymentMethod>(
      `/settings/payment-methods/${id}`,
      paymentMethod
    );
    return response;
  }

  // Delete payment method
  async deletePaymentMethod(id: string): Promise<void> {
    await http.delete(`/settings/payment-methods/${id}`);
  }

  // Test Paystack connection
  async testPaystackConnection(
    publicKey: string,
    secretKey: string
  ): Promise<{ isValid: boolean; message: string }> {
    const response = await http.post<{ isValid: boolean; message: string }>(
      '/settings/test-paystack',
      {
        publicKey,
        secretKey,
      }
    );
    return response;
  }

  // Get system settings (general)
  async getSystemSettings(): Promise<Record<string, unknown>> {
    const response = await http.get<Record<string, unknown>>(
      '/settings/system'
    );
    return response;
  }

  // Update system settings
  async updateSystemSettings(
    settings: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const response = await http.put<Record<string, unknown>>(
      '/settings/system',
      settings
    );
    return response;
  }

  // Export settings
  async exportSettings(): Promise<Blob> {
    const response = (await http.get('/settings/export', {
      responseType: 'blob',
    })) as unknown as Blob;
    return response;
  }

  // Import settings
  async importSettings(
    file: File
  ): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('settings', file);

    const response = await http.post<{ success: boolean; message: string }>(
      '/settings/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  }

  // Reset settings to defaults
  async resetToDefaults(): Promise<BillingSettings> {
    const response = await http.post<BillingSettings>(
      '/settings/billing/reset'
    );
    return response;
  }
}

export const settingsService = new SettingsService();
export default settingsService;
