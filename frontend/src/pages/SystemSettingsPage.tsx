import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@mui/material';
import { usePermissions } from '@/hooks/usePermissions';

export const SystemSettingsPage: React.FC = () => {
  const { canManageSystemSettings } = usePermissions();

  if (!canManageSystemSettings()) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>
            You don't have permission to manage system settings.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>System Settings</h1>
          <p className='text-muted-foreground'>
            Configure system-wide settings and security parameters
          </p>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <Typography variant='h6' component='h2'>
            System Settings
          </Typography>
        </CardHeader>
        <CardContent>
          <div className='text-center text-muted-foreground py-8'>
            <p>System settings management interface coming soon...</p>
            <p className='text-sm mt-2'>
              This will include security settings, audit configurations, and
              system parameters.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
