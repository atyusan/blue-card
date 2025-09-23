import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Chip } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@mui/material';
import { Separator } from '@/components/ui/separator';
import { Department } from '@/types/department';
import { format } from 'date-fns';

interface DepartmentDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
}

export const DepartmentDetails: React.FC<DepartmentDetailsProps> = ({
  isOpen,
  onClose,
  department,
}) => {
  if (!department) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[800px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span>Department Details</span>
            <Chip
              label={department.isActive ? 'Active' : 'Inactive'}
              variant={department.isActive ? 'filled' : 'outlined'}
            />
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <Typography variant='h6' component='h3' className='text-lg'>
                Basic Information
              </Typography>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Code
                  </label>
                  <p className='text-lg font-semibold'>{department.code}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Name
                  </label>
                  <p className='text-lg font-semibold'>{department.name}</p>
                </div>
              </div>

              {department.description && (
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Description
                  </label>
                  <p className='text-base'>{department.description}</p>
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Created
                  </label>
                  <p className='text-sm'>
                    {format(new Date(department.createdAt), 'PPP')}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Last Updated
                  </label>
                  <p className='text-sm'>
                    {format(new Date(department.updatedAt), 'PPP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <Typography variant='h6' component='h3' className='text-lg'>
                Department Statistics
              </Typography>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-3 gap-4'>
                <div className='text-center p-4 border rounded-lg'>
                  <div className='text-2xl font-bold text-primary'>
                    {department._count?.staffMembers || 0}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Staff Members
                  </div>
                </div>
                <div className='text-center p-4 border rounded-lg'>
                  <div className='text-2xl font-bold text-primary'>
                    {department._count?.services || 0}
                  </div>
                  <div className='text-sm text-muted-foreground'>Services</div>
                </div>
                <div className='text-center p-4 border rounded-lg'>
                  <div className='text-2xl font-bold text-primary'>
                    {department._count?.cashRequests || 0}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Cash Requests
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Members */}
          {department.staffMembers && department.staffMembers.length > 0 && (
            <Card>
              <CardHeader>
                <Typography variant='h6' component='h3' className='text-lg'>
                  Staff Members
                </Typography>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {department.staffMembers.map((staff) => (
                    <div
                      key={staff.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center'>
                          <span className='text-primary font-semibold'>
                            {staff.user.firstName?.[0]}
                            {staff.user.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className='font-medium'>
                            {staff.user.firstName} {staff.user.lastName}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {staff.employeeId} •{' '}
                            {staff.specialization || 'No specialization'}
                          </div>
                        </div>
                      </div>
                      <Chip
                        label={staff.isActive ? 'Active' : 'Inactive'}
                        variant={staff.isActive ? 'filled' : 'outlined'}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services */}
          {department.services && department.services.length > 0 && (
            <Card>
              <CardHeader>
                <Typography variant='h6' component='h3' className='text-lg'>
                  Services
                </Typography>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {department.services.map((service) => (
                    <div
                      key={service.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div>
                        <div className='font-medium'>{service.name}</div>
                        <div className='text-sm text-muted-foreground'>
                          {service.description || 'No description'}
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-semibold'>
                          ${service.currentPrice}
                        </div>
                        <Chip
                          label={service.isActive ? 'Active' : 'Inactive'}
                          variant={service.isActive ? 'filled' : 'outlined'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cash Requests */}
          {department.cashRequests && department.cashRequests.length > 0 && (
            <Card>
              <CardHeader>
                <Typography variant='h6' component='h3' className='text-lg'>
                  Recent Cash Requests
                </Typography>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {department.cashRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div>
                        <div className='font-medium'>
                          {request.requestNumber}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {request.purpose}
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-semibold'>${request.amount}</div>
                        <Chip
                          label={request.status}
                          variant={
                            request.status === 'APPROVED'
                              ? 'filled'
                              : request.status === 'PENDING'
                              ? 'outlined'
                              : request.status === 'REJECTED'
                              ? 'filled'
                              : 'outlined'
                          }
                          className={
                            request.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : ''
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
