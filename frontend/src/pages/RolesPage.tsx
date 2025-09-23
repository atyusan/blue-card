import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@mui/material';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
import { Chip } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';
import { Tabs, Tab, Box } from '@/components/ui/tabs';
import {
  Add,
  Search,
  Edit,
  Delete,
  People,
  Security,
} from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  staffCount: number;
  createdAt: string;
  updatedAt: string;
}

export const RolesPage: React.FC = () => {
  const { canManageRoles, canViewRoles } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (canViewRoles()) {
      loadRoles();
    }
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      // In a real app, you'd fetch this from your API
      const mockRoles: Role[] = [
        {
          id: '1',
          name: 'Administrator',
          code: 'ADMIN',
          description: 'Full system access with all permissions',
          permissions: ['admin'],
          isActive: true,
          staffCount: 2,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Doctor',
          code: 'DOCTOR',
          description: 'Medical staff with patient and clinical permissions',
          permissions: [
            'manage_patients',
            'view_billing',
            'manage_lab_tests',
            'manage_medications',
          ],
          isActive: true,
          staffCount: 15,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '3',
          name: 'Nurse',
          code: 'NURSE',
          description: 'Nursing staff with patient care permissions',
          permissions: ['manage_patients', 'view_billing', 'manage_lab_tests'],
          isActive: true,
          staffCount: 25,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '4',
          name: 'Cashier',
          code: 'CASHIER',
          description: 'Financial operations and billing management',
          permissions: [
            'view_billing',
            'edit_billing',
            'manage_cash_transactions',
          ],
          isActive: true,
          staffCount: 8,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '5',
          name: 'Lab Technician',
          code: 'LAB_TECH',
          description: 'Laboratory testing and results management',
          permissions: ['manage_lab_tests', 'view_patients'],
          isActive: true,
          staffCount: 12,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      setRoles(mockRoles);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionCategory = (permission: string) => {
    if (permission.includes('patient')) return 'Patient Management';
    if (permission.includes('billing')) return 'Billing & Finance';
    if (permission.includes('lab')) return 'Laboratory';
    if (permission.includes('medication')) return 'Pharmacy';
    if (permission.includes('surgery')) return 'Surgery';
    if (permission.includes('cash')) return 'Cash Management';
    if (permission.includes('admin') || permission.includes('system'))
      return 'System Administration';
    return 'General';
  };

  if (!canViewRoles()) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>
            You don't have permission to view roles.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='text-center py-8'>
          <div className='text-lg'>Loading roles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Role Management</h1>
          <p className='text-muted-foreground'>
            Manage system roles and their associated permissions
          </p>
        </div>
        {canManageRoles() && (
          <Button>
            <Add sx={{ fontSize: 16, mr: 1 }} />
            Add Role
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <Security sx={{ fontSize: 32, color: 'primary.main' }} />
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Roles
                </p>
                <p className='text-2xl font-bold'>{roles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <People sx={{ fontSize: 32, color: 'success.main' }} />
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Active Users
                </p>
                <p className='text-2xl font-bold'>
                  {roles.reduce((sum, role) => sum + role.staffCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <Security sx={{ fontSize: 32, color: 'purple.600' }} />
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Active Roles
                </p>
                <p className='text-2xl font-bold'>
                  {roles.filter((role) => role.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <Security sx={{ fontSize: 32, color: 'orange.600' }} />
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Permissions
                </p>
                <p className='text-2xl font-bold'>
                  {
                    Array.from(
                      new Set(roles.flatMap((role) => role.permissions))
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs
        value={activeTab}
        onChange={(event, newValue) => setActiveTab(newValue)}
        className='space-y-4'
      >
        <Box className='grid w-full grid-cols-2'>
          <Tab value='overview' label='Overview' />
          <Tab value='roles' label='All Roles' />
        </Box>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Box className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Role Summary */}
              <Card>
                <CardHeader>
                  <Typography variant='h6' component='h3'>
                    Role Summary
                  </Typography>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                      >
                        <div>
                          <p className='font-medium'>{role.name}</p>
                          <p className='text-sm text-muted-foreground'>
                            {role.description}
                          </p>
                        </div>
                        <div className='text-right'>
                          <Chip
                            label={`${role.staffCount} users`}
                            variant={role.isActive ? 'filled' : 'outlined'}
                          />
                          <p className='text-xs text-muted-foreground mt-1'>
                            {role.permissions.length} permissions
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Permission Categories */}
              <Card>
                <CardHeader>
                  <Typography variant='h6' component='h3'>
                    Permission Categories
                  </Typography>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {Array.from(
                      new Set(roles.flatMap((role) => role.permissions))
                    ).map((permission) => {
                      const category = getPermissionCategory(permission);
                      return (
                        <div
                          key={permission}
                          className='flex items-center justify-between'
                        >
                          <span className='text-sm'>
                            {permission.replace(/_/g, ' ')}
                          </span>
                          <Chip
                            label={category}
                            variant='outlined'
                            size='small'
                            className='text-xs'
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Box>
        )}

        {/* All Roles Tab */}
        {activeTab === 'roles' && (
          <Box className='space-y-4'>
            <Card>
              <CardHeader>
                <Typography variant='h6' component='h3'>
                  System Roles
                </Typography>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className='mb-4'>
                  <div className='relative'>
                    <Search
                      sx={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 16,
                        color: 'text.secondary',
                      }}
                    />
                    <TextField
                      placeholder='Search roles...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>

                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Role Name</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell>Users</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className='font-medium'>
                          {role.name}
                        </TableCell>
                        <TableCell>
                          <Chip label={role.code} variant='outlined' />
                        </TableCell>
                        <TableCell className='text-muted-foreground max-w-xs'>
                          <p className='truncate'>{role.description}</p>
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-wrap gap-1'>
                            {role.permissions.slice(0, 3).map((permission) => (
                              <Chip
                                key={permission}
                                label={permission.replace(/_/g, ' ')}
                                variant='outlined'
                                size='small'
                                className='text-xs'
                              />
                            ))}
                            {role.permissions.length > 3 && (
                              <Chip
                                label={`+${role.permissions.length - 3} more`}
                                variant='outlined'
                                size='small'
                                className='text-xs'
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip label={role.staffCount} variant='outlined' />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={role.isActive ? 'Active' : 'Inactive'}
                            variant={role.isActive ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <div className='flex space-x-2'>
                            {canManageRoles() && (
                              <>
                                <Button size='small' variant='outlined'>
                                  <Edit sx={{ fontSize: 16 }} />
                                </Button>
                                <Button size='small' variant='outlined'>
                                  <Delete sx={{ fontSize: 16 }} />
                                </Button>
                              </>
                            )}
                            <Button size='small' variant='outlined'>
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Box>
        )}
      </Tabs>
    </div>
  );
};
