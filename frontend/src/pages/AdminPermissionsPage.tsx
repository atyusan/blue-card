import React from 'react';
import { PermissionManagement } from '@/components/admin/PermissionManagement';

export const AdminPermissionsPage: React.FC = () => {
  return (
    <div className='container mx-auto py-6 px-4'>
      <PermissionManagement />
    </div>
  );
};

