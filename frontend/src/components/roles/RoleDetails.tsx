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
import { Role } from '@/types/role';
import { format } from 'date-fns';
import { Security, People, CalendarToday } from '@mui/icons-material';

interface RoleDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
}

export const RoleDetails: React.FC<RoleDetailsProps> = ({
  isOpen,
  onClose,
  role,
}) => {
  if (!role) return null;

  const permissions = Array.isArray(role.permissions) ? role.permissions : [];

  // Group permissions by category for better display
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.split('_')[0];
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[800px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Security sx={{ fontSize: 20 }} />
            <span>Role Details</span>
            <Chip
              label={role.isActive ? 'Active' : 'Inactive'}
              variant={role.isActive ? 'filled' : 'outlined'}
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
                  <p className='text-lg font-semibold'>{role.code}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Name
                  </label>
                  <p className='text-lg font-semibold'>{role.name}</p>
                </div>
              </div>

              {role.description && (
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Description
                  </label>
                  <p className='text-base'>{role.description}</p>
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Created
                  </label>
                  <p className='text-sm'>
                    {format(new Date(role.createdAt), 'PPP')}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Last Updated
                  </label>
                  <p className='text-sm'>
                    {format(new Date(role.updatedAt), 'PPP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <Typography
                variant='h6'
                component='h3'
                className='text-lg flex items-center gap-2'
              >
                <People sx={{ fontSize: 20 }} />
                Role Statistics
              </Typography>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-3 gap-4'>
                <div className='text-center p-4 border rounded-lg'>
                  <div className='text-2xl font-bold text-primary'>
                    {role._count?.staffRoleAssignments || 0}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Assigned Staff
                  </div>
                </div>
                <div className='text-center p-4 border rounded-lg'>
                  <div className='text-2xl font-bold text-primary'>
                    {permissions.length}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Total Permissions
                  </div>
                </div>
                <div className='text-center p-4 border rounded-lg'>
                  <div className='text-2xl font-bold text-primary'>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <div className='text-sm text-muted-foreground'>Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <Typography
                variant='h6'
                component='h3'
                className='text-lg flex items-center gap-2'
              >
                <Security sx={{ fontSize: 20 }} />
                Permissions ({permissions.length})
              </Typography>
            </CardHeader>
            <CardContent>
              {permissions.length > 0 ? (
                <div className='space-y-4'>
                  {Object.entries(groupedPermissions).map(
                    ([category, perms]) => (
                      <div key={category} className='border rounded-lg p-4'>
                        <h4 className='font-medium mb-3 capitalize'>
                          {category} Permissions
                        </h4>
                        <div className='flex flex-wrap gap-2'>
                          {perms.map((permission) => (
                            <Chip
                              key={permission}
                              label={permission.replace(/_/g, ' ')}
                              variant='outlined'
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className='text-center py-8 text-muted-foreground'>
                  No permissions assigned to this role.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Staff Members */}
          {role.staffRoleAssignments &&
            role.staffRoleAssignments.length > 0 && (
              <Card>
                <CardHeader>
                  <Typography
                    variant='h6'
                    component='h3'
                    className='text-lg flex items-center gap-2'
                  >
                    <People sx={{ fontSize: 20 }} />
                    Assigned Staff Members ({role.staffRoleAssignments.length})
                  </Typography>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {role.staffRoleAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className='flex items-center justify-between p-3 border rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center'>
                            <span className='text-primary font-semibold'>
                              {assignment.staffMember.user.firstName?.[0]}
                              {assignment.staffMember.user.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className='font-medium'>
                              {assignment.staffMember.user.firstName}{' '}
                              {assignment.staffMember.user.lastName}
                            </div>
                            <div className='text-sm text-muted-foreground'>
                              {assignment.staffMember.employeeId} •{' '}
                              {assignment.staffMember.departmentRef?.name ||
                                'No department'}
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='flex items-center gap-2'>
                            <Chip
                              label={
                                assignment.isActive ? 'Active' : 'Inactive'
                              }
                              variant={
                                assignment.isActive ? 'filled' : 'outlined'
                              }
                            />
                            <div className='text-xs text-muted-foreground'>
                              <CalendarToday
                                sx={{
                                  fontSize: 12,
                                  display: 'inline',
                                  mr: 0.5,
                                }}
                              />
                              {format(
                                new Date(assignment.assignedAt),
                                'MMM dd, yyyy'
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Department Distribution */}
          {role.staffRoleAssignments &&
            role.staffRoleAssignments.length > 0 && (
              <Card>
                <CardHeader>
                  <Typography variant='h6' component='h3' className='text-lg'>
                    Department Distribution
                  </Typography>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {Object.entries(
                      role.staffRoleAssignments.reduce((acc, assignment) => {
                        const deptName =
                          assignment.staffMember.departmentRef?.name ||
                          'Unknown';
                        acc[deptName] = (acc[deptName] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([deptName, count]) => (
                      <div
                        key={deptName}
                        className='flex items-center justify-between p-3 border rounded-lg'
                      >
                        <span className='font-medium'>{deptName}</span>
                        <Chip
                          label={`${count} staff members`}
                          variant='outlined'
                        />
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
