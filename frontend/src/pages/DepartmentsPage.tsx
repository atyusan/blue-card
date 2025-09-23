import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@mui/material';

export const DepartmentsPage: React.FC = () => {
  const { canViewDepartments } = usePermissions();

  if (!canViewDepartments()) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>
            You don't have permission to view departments.
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
          <h1 className='text-2xl font-bold'>Departments</h1>
          <p className='text-muted-foreground'>
            Manage organizational departments and staff assignments
          </p>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <Typography variant='h6' component='h2'>
            Departments
          </Typography>
        </CardHeader>
        <CardContent>
          <div className='text-center text-muted-foreground py-8'>
            <p>Department management interface coming soon...</p>
            <p className='text-sm mt-2'>
              This will include department creation, editing, staff assignments,
              and organizational hierarchy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
