import React from 'react';
import { RoleList } from '@/components/roles/RoleList';
import { PageHeader } from '@/components/ui/PageHeader';
import { Security, People, VpnKey } from '@mui/icons-material';

const RolesPage: React.FC = () => {
  return (
    <div className='container mx-auto py-6 space-y-6'>
      <PageHeader
        title='Role & Permission Management'
        subtitle='Manage user roles, permissions, and access control across the system'
        icon={Shield}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Roles', href: '/admin/roles' },
        ]}
      />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
        <div className='bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-indigo-100'>Total Roles</p>
              <p className='text-3xl font-bold'>8</p>
            </div>
            <Shield className='h-12 w-12 text-indigo-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-emerald-100'>Active Roles</p>
              <p className='text-3xl font-bold'>8</p>
            </div>
            <Users className='h-12 w-12 text-emerald-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-rose-500 to-rose-600 rounded-lg p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-rose-100'>Total Permissions</p>
              <p className='text-3xl font-bold'>45</p>
            </div>
            <Key className='h-12 w-12 text-rose-200' />
          </div>
        </div>
      </div>

      <RoleList />
    </div>
  );
};

export default RolesPage;
