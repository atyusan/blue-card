import React from 'react';
import { UserPermissionsDashboard } from '@/components/permissions/UserPermissionsDashboard';

export const UserPermissionsPage: React.FC = () => {
  return (
    <div className='container mx-auto py-6 px-4'>
      <UserPermissionsDashboard />
    </div>
  );
};

