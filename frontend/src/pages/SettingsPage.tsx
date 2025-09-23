import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Skeleton,
  Divider,
  Tooltip,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  Save,
  Refresh,
  Settings,
  Security,
  Notifications,
  Receipt,
  Business,
  Edit,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';
import PageHeader from '../components/common/PageHeader';

interface SystemSetting {
  id: string;
  category: string;
  name: string;
  value: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  isEditable: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { hasPermission } = usePermissions();

  // Mock settings data
  useEffect(() => {
    const mockSettings: SystemSetting[] = [
      {
        id: '1',
        category: 'general',
        name: 'Hospital Name',
        value: 'Blue Card Hospital',
        description: 'The name of the hospital as displayed in the system',
        type: 'text',
        isEditable: true,
      },
      {
        id: '2',
        category: 'general',
        name: 'System Timezone',
        value: 'UTC+1',
        description: 'Default timezone for the system',
        type: 'select',
        options: ['UTC', 'UTC+1', 'UTC+2', 'UTC+3'],
        isEditable: true,
      },
      {
        id: '3',
        category: 'security',
        name: 'Password Policy',
        value: 'Strong',
        description: 'Password strength requirements for users',
        type: 'select',
        options: ['Weak', 'Medium', 'Strong', 'Very Strong'],
        isEditable: true,
      },
      {
        id: '4',
        category: 'security',
        name: 'Session Timeout',
        value: '30',
        description: 'Session timeout in minutes',
        type: 'number',
        isEditable: true,
      },
      {
        id: '5',
        category: 'notifications',
        name: 'Email Notifications',
        value: 'true',
        description: 'Enable email notifications',
        type: 'boolean',
        isEditable: true,
      },
      {
        id: '6',
        category: 'notifications',
        name: 'SMS Notifications',
        value: 'false',
        description: 'Enable SMS notifications',
        type: 'boolean',
        isEditable: true,
      },
      {
        id: '7',
        category: 'billing',
        name: 'Default Currency',
        value: 'USD',
        description: 'Default currency for billing',
        type: 'select',
        options: ['USD', 'EUR', 'GBP', 'NGN'],
        isEditable: true,
      },
      {
        id: '8',
        category: 'billing',
        name: 'Tax Rate',
        value: '7.5',
        description: 'Default tax rate percentage',
        type: 'number',
        isEditable: true,
      },
    ];

    setSettings(mockSettings);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSettingChange = (id: string, newValue: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, value: newValue } : setting
      )
    );
  };

  const handleSaveSettings = async () => {
    if (!hasPermission('manage_system_settings')) {
      setErrorMessage('You do not have permission to manage system settings');
      setShowError(true);
      return;
    }

    setSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowSuccess(true);
    } catch (error) {
      setErrorMessage('Failed to save settings. Please try again.');
      setShowError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshSettings = () => {
    setLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const renderSettingField = (setting: SystemSetting) => {
    if (!setting.isEditable) {
      return (
        <Typography variant='body2' color='text.secondary'>
          {setting.value}
        </Typography>
      );
    }

    switch (setting.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            size='small'
          />
        );
      case 'number':
        return (
          <TextField
            fullWidth
            type='number'
            value={setting.value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            size='small'
          />
        );
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={setting.value === 'true'}
                onChange={(e) =>
                  handleSettingChange(setting.id, e.target.checked.toString())
                }
              />
            }
            label=''
          />
        );
      case 'select':
        return (
          <FormControl fullWidth size='small'>
            <Select
              value={setting.value}
              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            >
              {setting.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      default:
        return (
          <Typography variant='body2' color='text.secondary'>
            {setting.value}
          </Typography>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general':
        return <Settings />;
      case 'security':
        return <Security />;
      case 'notifications':
        return <Notifications />;
      case 'billing':
        return <Receipt />;
      default:
        return <Business />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general':
        return 'General';
      case 'security':
        return 'Security';
      case 'notifications':
        return 'Notifications';
      case 'billing':
        return 'Billing';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const categories = ['general', 'security', 'notifications', 'billing'];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title='System Settings'
          subtitle='Configure system preferences and parameters'
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
            },
            gap: 3,
          }}
        >
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardContent>
                <Skeleton variant='text' width='60%' height={24} />
                <Skeleton variant='text' width='40%' height={20} />
                <Skeleton variant='rectangular' height={40} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title='System Settings'
        subtitle='Configure system preferences and parameters'
      />

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        {hasPermission('manage_system_settings') && (
          <Button
            variant='contained'
            startIcon={<Save />}
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
        <Button
          variant='outlined'
          startIcon={<Refresh />}
          onClick={handleRefreshSettings}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Settings Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label='settings tabs'
            >
              {categories.map((category, index) => (
                <Tab
                  key={category}
                  label={getCategoryLabel(category)}
                  icon={getCategoryIcon(category)}
                  iconPosition='start'
                />
              ))}
            </Tabs>
          </Box>

          {categories.map((category, index) => (
            <TabPanel key={category} value={activeTab} index={index}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, 1fr)',
                  },
                  gap: 3,
                }}
              >
                {settings
                  .filter((setting) => setting.category === category)
                  .map((setting) => (
                    <Card key={setting.id} variant='outlined'>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Box>
                            <Typography
                              variant='h6'
                              component='h3'
                              gutterBottom
                            >
                              {setting.name}
                            </Typography>
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{ mb: 2 }}
                            >
                              {setting.description}
                            </Typography>
                          </Box>
                          {setting.isEditable && (
                            <Tooltip title='Editable'>
                              <Edit fontSize='small' color='action' />
                            </Tooltip>
                          )}
                        </Box>

                        <Box sx={{ mt: 2 }}>{renderSettingField(setting)}</Box>

                        <Divider sx={{ my: 2 }} />

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant='caption' color='text.secondary'>
                            Setting ID: {setting.id}
                          </Typography>
                          <Chip
                            label={setting.type}
                            size='small'
                            variant='outlined'
                            color='primary'
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
              </Box>

              {settings.filter((setting) => setting.category === category)
                .length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant='h6' color='text.secondary' gutterBottom>
                    No settings found
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    No settings are configured for this category.
                  </Typography>
                </Box>
              )}
            </TabPanel>
          ))}
        </CardContent>
      </Card>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity='success'
          icon={<CheckCircle />}
          sx={{ width: '100%' }}
        >
          Settings saved successfully!
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity='error'
          icon={<Error />}
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
