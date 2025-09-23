import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@mui/material';
import { Chip } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';

export const PermissionTemplatesPage: React.FC = () => {
  const { canViewPermissionTemplates } = usePermissions();

  if (!canViewPermissionTemplates()) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>
            You don't have permission to view permission templates.
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
          <h1 className='text-2xl font-bold'>Permission Templates</h1>
          <p className='text-muted-foreground'>
            Manage permission templates and presets for consistent role
            assignments
          </p>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <Typography variant='h6' component='h2'>
            Permission Templates
          </Typography>
        </CardHeader>
        <CardContent>
          <div className='text-center text-muted-foreground py-8'>
            <p>Permission templates management interface coming soon...</p>
            <p className='text-sm mt-2'>
              This will include template creation, editing, and preset
              management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
