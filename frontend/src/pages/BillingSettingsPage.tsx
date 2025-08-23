import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Divider,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Save,
  Settings,
  Receipt,
  Payment,
  Notifications,
  Security,
  Add,
  Delete,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import Breadcrumb from '../components/common/Breadcrumb';
import {
  settingsService,
  type BillingSettings,
  type PaymentMethod,
} from '../services/settings.service';
import toast from 'react-hot-toast';

const BillingSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [settings, setSettings] = useState<BillingSettings>({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    taxNumber: '',
    invoiceNumberPrefix: 'INV',
    invoiceNumberPadding: 6,
    nextInvoiceNumber: 1,
    invoiceFooter: '',
    invoiceTerms: '',
    defaultPaymentMethods: ['CASH', 'CARD'],
    allowPartialPayments: true,
    automaticOverdueReminders: true,
    overdueReminderDays: [7, 14, 30],
    lateFeePercentage: 5,
    enableLateFees: false,
    defaultTaxRate: 7.5,
    enableTax: false,
    taxName: 'VAT',
    currency: 'NGN',
    currencySymbol: '₦',
    currencyPosition: 'before',
    emailNotifications: {
      invoiceCreated: true,
      paymentReceived: true,
      overdueReminder: true,
      paymentFailed: true,
    },
    enableOnlinePayments: false,
    paystackPublicKey: '',
    paystackSecretKey: '',
    enableInvoiceTemplates: true,
    autoGenerateReceipts: true,
  });

  const [activeTab, setActiveTab] = useState<string>('general');
  const [paymentMethodDialog, setPaymentMethodDialog] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [reminderDialog, setReminderDialog] = useState(false);
  const [newReminderDay, setNewReminderDay] = useState<number>(0);

  // Fetch billing settings
  const { data: settingsData } = useQuery({
    queryKey: ['billing-settings'],
    queryFn: () => settingsService.getBillingSettings(),
  });

  // Update settings when data loads
  React.useEffect(() => {
    if (settingsData?.billingSettings) {
      setSettings(settingsData.billingSettings);
    }
  }, [settingsData]);

  // Fetch payment methods
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => settingsService.getPaymentMethods(),
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (settingsData: BillingSettings) =>
      settingsService.updateBillingSettings(settingsData),
    onSuccess: () => {
      toast.success('Billing settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['billing-settings'] });
    },
    onError: (error) => {
      console.error('Save settings error:', error);
      toast.error('Failed to save billing settings');
    },
  });

  // Add payment method mutation
  const addPaymentMethodMutation = useMutation({
    mutationFn: (methodData: Omit<PaymentMethod, 'id'>) =>
      settingsService.createPaymentMethod(methodData),
    onSuccess: () => {
      toast.success('Payment method added successfully');
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (error) => {
      console.error('Add payment method error:', error);
      toast.error('Failed to add payment method');
    },
  });

  // Remove payment method mutation
  const removePaymentMethodMutation = useMutation({
    mutationFn: (methodId: string) =>
      settingsService.deletePaymentMethod(methodId),
    onSuccess: () => {
      toast.success('Payment method removed successfully');
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (error) => {
      console.error('Remove payment method error:', error);
      toast.error('Failed to remove payment method');
    },
  });

  // Event handlers
  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleBack = () => {
    navigate('/billing');
  };

  const handleSettingChange = (field: keyof BillingSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationChange = (
    field: keyof BillingSettings['emailNotifications'],
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [field]: value,
      },
    }));
  };

  const handleAddPaymentMethod = () => {
    if (!newPaymentMethod.trim()) {
      toast.error('Please enter a payment method name');
      return;
    }

    const newMethod = {
      name: newPaymentMethod.toUpperCase(),
      isActive: true,
      isDefault: false,
    };

    addPaymentMethodMutation.mutate(newMethod);
    setNewPaymentMethod('');
    setPaymentMethodDialog(false);
  };

  const handleRemovePaymentMethod = (methodId: string) => {
    removePaymentMethodMutation.mutate(methodId);
  };

  const handleAddReminderDay = () => {
    if (newReminderDay <= 0) {
      toast.error('Please enter a valid number of days');
      return;
    }

    if (settings.overdueReminderDays.includes(newReminderDay)) {
      toast.error('This reminder day already exists');
      return;
    }

    const newDays = [...settings.overdueReminderDays, newReminderDay].sort(
      (a, b) => a - b
    );
    handleSettingChange('overdueReminderDays', newDays);
    setNewReminderDay(0);
    setReminderDialog(false);
    toast.success('Reminder day added successfully');
  };

  const handleRemoveReminderDay = (day: number) => {
    const newDays = settings.overdueReminderDays.filter((d) => d !== day);
    handleSettingChange('overdueReminderDays', newDays);
    toast.success('Reminder day removed successfully');
  };

  // Tab sections
  const tabSections = [
    { id: 'general', label: 'General', icon: <Settings /> },
    { id: 'invoice', label: 'Invoice', icon: <Receipt /> },
    { id: 'payment', label: 'Payment', icon: <Payment /> },
    { id: 'notifications', label: 'Notifications', icon: <Notifications /> },
    { id: 'advanced', label: 'Advanced', icon: <Security /> },
  ];

  return (
    <Box>
      <PageHeader
        title='Billing Settings'
        subtitle='Configure billing and invoice settings'
        breadcrumbs={<Breadcrumb />}
        onBack={handleBack}
        showActions={false}
      />

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Settings Navigation */}
        <Card sx={{ width: 300, height: 'fit-content' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant='h6' gutterBottom>
              Settings Categories
            </Typography>
            <Stack spacing={1}>
              {tabSections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeTab === section.id ? 'contained' : 'text'}
                  startIcon={section.icon}
                  onClick={() => setActiveTab(section.id)}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {section.label}
                </Button>
              ))}
            </Stack>
          </Box>
        </Card>

        {/* Settings Content */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <Box sx={{ p: 3 }}>
              {/* General Settings */}
              {activeTab === 'general' && (
                <Box>
                  <Typography variant='h6' gutterBottom>
                    <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                    General Settings
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 3 }}
                  >
                    Configure basic company information and branding
                  </Typography>

                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label='Company Name'
                        value={settings.companyName}
                        onChange={(e) =>
                          handleSettingChange('companyName', e.target.value)
                        }
                        fullWidth
                        required
                      />
                      <TextField
                        label='Tax Number'
                        value={settings.taxNumber}
                        onChange={(e) =>
                          handleSettingChange('taxNumber', e.target.value)
                        }
                        fullWidth
                      />
                    </Box>
                    <TextField
                      label='Company Address'
                      value={settings.companyAddress}
                      onChange={(e) =>
                        handleSettingChange('companyAddress', e.target.value)
                      }
                      fullWidth
                      multiline
                      rows={3}
                      required
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label='Company Phone'
                        value={settings.companyPhone}
                        onChange={(e) =>
                          handleSettingChange('companyPhone', e.target.value)
                        }
                        fullWidth
                        required
                      />
                      <TextField
                        label='Company Email'
                        type='email'
                        value={settings.companyEmail}
                        onChange={(e) =>
                          handleSettingChange('companyEmail', e.target.value)
                        }
                        fullWidth
                        required
                      />
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant='subtitle1' gutterBottom>
                    Currency Settings
                  </Typography>
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl fullWidth>
                        <InputLabel>Currency</InputLabel>
                        <Select
                          value={settings.currency}
                          label='Currency'
                          onChange={(e) =>
                            handleSettingChange('currency', e.target.value)
                          }
                        >
                          <MenuItem value='NGN'>Nigerian Naira (NGN)</MenuItem>
                          <MenuItem value='USD'>US Dollar (USD)</MenuItem>
                          <MenuItem value='EUR'>Euro (EUR)</MenuItem>
                          <MenuItem value='GBP'>British Pound (GBP)</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label='Currency Symbol'
                        value={settings.currencySymbol}
                        onChange={(e) =>
                          handleSettingChange('currencySymbol', e.target.value)
                        }
                        fullWidth
                      />
                      <FormControl fullWidth>
                        <InputLabel>Symbol Position</InputLabel>
                        <Select
                          value={settings.currencyPosition}
                          label='Symbol Position'
                          onChange={(e) =>
                            handleSettingChange(
                              'currencyPosition',
                              e.target.value
                            )
                          }
                        >
                          <MenuItem value='before'>
                            Before Amount (₦100)
                          </MenuItem>
                          <MenuItem value='after'>After Amount (100₦)</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Invoice Settings */}
              {activeTab === 'invoice' && (
                <Box>
                  <Typography variant='h6' gutterBottom>
                    <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Invoice Settings
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 3 }}
                  >
                    Configure invoice numbering, templates, and default content
                  </Typography>

                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label='Invoice Number Prefix'
                        value={settings.invoiceNumberPrefix}
                        onChange={(e) =>
                          handleSettingChange(
                            'invoiceNumberPrefix',
                            e.target.value
                          )
                        }
                        fullWidth
                        helperText='e.g., INV, BILL, etc.'
                      />
                      <TextField
                        label='Number Padding'
                        type='number'
                        value={settings.invoiceNumberPadding}
                        onChange={(e) =>
                          handleSettingChange(
                            'invoiceNumberPadding',
                            Number(e.target.value)
                          )
                        }
                        fullWidth
                        inputProps={{ min: 3, max: 10 }}
                        helperText='Number of digits (e.g., 6 = 000001)'
                      />
                      <TextField
                        label='Next Invoice Number'
                        type='number'
                        value={settings.nextInvoiceNumber}
                        onChange={(e) =>
                          handleSettingChange(
                            'nextInvoiceNumber',
                            Number(e.target.value)
                          )
                        }
                        fullWidth
                        inputProps={{ min: 1 }}
                      />
                    </Box>
                    <TextField
                      label='Invoice Footer Text'
                      value={settings.invoiceFooter}
                      onChange={(e) =>
                        handleSettingChange('invoiceFooter', e.target.value)
                      }
                      fullWidth
                      multiline
                      rows={3}
                      helperText='Text that appears at the bottom of every invoice'
                    />
                    <TextField
                      label='Invoice Terms & Conditions'
                      value={settings.invoiceTerms}
                      onChange={(e) =>
                        handleSettingChange('invoiceTerms', e.target.value)
                      }
                      fullWidth
                      multiline
                      rows={4}
                      helperText='Default terms and conditions for invoices'
                    />
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant='subtitle1' gutterBottom>
                    Tax Settings
                  </Typography>
                  <Stack spacing={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enableTax}
                          onChange={(e) =>
                            handleSettingChange('enableTax', e.target.checked)
                          }
                        />
                      }
                      label='Enable Tax Calculation'
                    />
                    {settings.enableTax && (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label='Tax Name'
                          value={settings.taxName}
                          onChange={(e) =>
                            handleSettingChange('taxName', e.target.value)
                          }
                          fullWidth
                          helperText='e.g., VAT, GST, Sales Tax'
                        />
                        <TextField
                          label='Default Tax Rate (%)'
                          type='number'
                          value={settings.defaultTaxRate}
                          onChange={(e) =>
                            handleSettingChange(
                              'defaultTaxRate',
                              Number(e.target.value)
                            )
                          }
                          fullWidth
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                        />
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <Box>
                  <Typography variant='h6' gutterBottom>
                    <Payment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Payment Settings
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 3 }}
                  >
                    Configure payment methods, late fees, and reminder settings
                  </Typography>

                  <Stack spacing={3}>
                    <Box>
                      <Typography variant='subtitle1' gutterBottom>
                        Payment Methods
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Button
                          variant='outlined'
                          startIcon={<Add />}
                          onClick={() => setPaymentMethodDialog(true)}
                          size='small'
                        >
                          Add Payment Method
                        </Button>
                      </Box>
                      <List>
                        {paymentMethods.map((method) => (
                          <ListItem key={method.id} divider>
                            <ListItemText
                              primary={method.name}
                              secondary={
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  {method.isActive && (
                                    <Chip
                                      label='Active'
                                      size='small'
                                      color='success'
                                    />
                                  )}
                                  {method.isDefault && (
                                    <Chip
                                      label='Default'
                                      size='small'
                                      color='primary'
                                    />
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge='end'
                                onClick={() =>
                                  handleRemovePaymentMethod(method.id)
                                }
                                disabled={method.isDefault}
                              >
                                <Delete />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.allowPartialPayments}
                          onChange={(e) =>
                            handleSettingChange(
                              'allowPartialPayments',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label='Allow Partial Payments'
                    />
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant='subtitle1' gutterBottom>
                    Late Fees & Reminders
                  </Typography>
                  <Stack spacing={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enableLateFees}
                          onChange={(e) =>
                            handleSettingChange(
                              'enableLateFees',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label='Enable Late Fees'
                    />
                    {settings.enableLateFees && (
                      <TextField
                        label='Late Fee Percentage (%)'
                        type='number'
                        value={settings.lateFeePercentage}
                        onChange={(e) =>
                          handleSettingChange(
                            'lateFeePercentage',
                            Number(e.target.value)
                          )
                        }
                        sx={{ maxWidth: 200 }}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                      />
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.automaticOverdueReminders}
                          onChange={(e) =>
                            handleSettingChange(
                              'automaticOverdueReminders',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label='Automatic Overdue Reminders'
                    />
                    {settings.automaticOverdueReminders && (
                      <Box>
                        <Typography variant='body2' gutterBottom>
                          Reminder Days
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 2,
                          }}
                        >
                          <Button
                            variant='outlined'
                            startIcon={<Add />}
                            onClick={() => setReminderDialog(true)}
                            size='small'
                          >
                            Add Reminder Day
                          </Button>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {settings.overdueReminderDays.map((day) => (
                            <Chip
                              key={day}
                              label={`${day} days`}
                              onDelete={() => handleRemoveReminderDay(day)}
                              color='primary'
                              variant='outlined'
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <Box>
                  <Typography variant='h6' gutterBottom>
                    <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Notification Settings
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 3 }}
                  >
                    Configure email notifications for various billing events
                  </Typography>

                  <Stack spacing={3}>
                    <Box>
                      <Typography variant='subtitle1' gutterBottom>
                        Email Notifications
                      </Typography>
                      <Stack spacing={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={
                                settings.emailNotifications.invoiceCreated
                              }
                              onChange={(e) =>
                                handleNotificationChange(
                                  'invoiceCreated',
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label='Invoice Created'
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={
                                settings.emailNotifications.paymentReceived
                              }
                              onChange={(e) =>
                                handleNotificationChange(
                                  'paymentReceived',
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label='Payment Received'
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={
                                settings.emailNotifications.overdueReminder
                              }
                              onChange={(e) =>
                                handleNotificationChange(
                                  'overdueReminder',
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label='Overdue Reminder'
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={
                                settings.emailNotifications.paymentFailed
                              }
                              onChange={(e) =>
                                handleNotificationChange(
                                  'paymentFailed',
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label='Payment Failed'
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Advanced Settings */}
              {activeTab === 'advanced' && (
                <Box>
                  <Typography variant='h6' gutterBottom>
                    <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Advanced Settings
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 3 }}
                  >
                    Configure advanced features and integrations
                  </Typography>

                  <Stack spacing={3}>
                    <Alert severity='info'>
                      <Typography variant='body2'>
                        These settings require careful configuration. Changes
                        may affect system behavior.
                      </Typography>
                    </Alert>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enableOnlinePayments}
                          onChange={(e) =>
                            handleSettingChange(
                              'enableOnlinePayments',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label='Enable Online Payments (Paystack)'
                    />

                    {settings.enableOnlinePayments && (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          label='Paystack Public Key'
                          value={settings.paystackPublicKey}
                          onChange={(e) =>
                            handleSettingChange(
                              'paystackPublicKey',
                              e.target.value
                            )
                          }
                          fullWidth
                          type='password'
                        />
                        <TextField
                          label='Paystack Secret Key'
                          value={settings.paystackSecretKey}
                          onChange={(e) =>
                            handleSettingChange(
                              'paystackSecretKey',
                              e.target.value
                            )
                          }
                          fullWidth
                          type='password'
                        />
                      </Box>
                    )}

                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.enableInvoiceTemplates}
                          onChange={(e) =>
                            handleSettingChange(
                              'enableInvoiceTemplates',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label='Enable Invoice Templates'
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoGenerateReceipts}
                          onChange={(e) =>
                            handleSettingChange(
                              'autoGenerateReceipts',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label='Auto-generate Receipts'
                    />
                  </Stack>
                </Box>
              )}

              {/* Action Buttons */}
              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant='contained'
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending
                    ? 'Saving...'
                    : 'Save Settings'}
                </Button>
                <Button variant='outlined' onClick={handleBack}>
                  Back to Billing
                </Button>
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Add Payment Method Dialog */}
      <Dialog
        open={paymentMethodDialog}
        onClose={() => setPaymentMethodDialog(false)}
      >
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Payment Method Name'
            value={newPaymentMethod}
            onChange={(e) => setNewPaymentMethod(e.target.value)}
            fullWidth
            variant='outlined'
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentMethodDialog(false)}>Cancel</Button>
          <Button onClick={handleAddPaymentMethod} variant='contained'>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Reminder Day Dialog */}
      <Dialog open={reminderDialog} onClose={() => setReminderDialog(false)}>
        <DialogTitle>Add Reminder Day</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Days after due date'
            type='number'
            value={newReminderDay || ''}
            onChange={(e) => setNewReminderDay(Number(e.target.value))}
            fullWidth
            variant='outlined'
            sx={{ mt: 2 }}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReminderDialog(false)}>Cancel</Button>
          <Button onClick={handleAddReminderDay} variant='contained'>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingSettingsPage;
