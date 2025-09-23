import React from 'react';
import { DepartmentList } from '@/components/departments/DepartmentList';
import { PageHeader } from '@/components/ui/PageHeader';
import { Business, People, Settings } from '@mui/icons-material';

const DepartmentsPage: React.FC = () => {
  return (
    <div className='container mx-auto py-6 space-y-6'>
      <PageHeader
        title='Department Management'
        subtitle='Manage hospital departments, staff assignments, and organizational structure'
        icon={Building2}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Departments', href: '/admin/departments' },
        ]}
      />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
        <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-blue-100'>Total Departments</p>
              <p className='text-3xl font-bold'>8</p>
            </div>
            <Building2 className='h-12 w-12 text-blue-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-100'>Active Departments</p>
              <p className='text-3xl font-bold'>8</p>
            </div>
            <Users className='h-12 w-12 text-green-200' />
          </div>
        </div>

        <div className='bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-purple-100'>Total Staff</p>
              <p className='text-3xl font-bold'>47</p>
            </div>
            <Settings className='h-12 w-12 text-purple-200' />
          </div>
        </div>
      </div>

      <DepartmentList />
    </div>
  );
};

export default DepartmentsPage;
