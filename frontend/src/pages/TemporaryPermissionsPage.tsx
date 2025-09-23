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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@/components/ui/select';
import {
  Add,
  Search,
  AccessTime,
  Person,
  Security,
  Warning,
} from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';

interface TemporaryPermission {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  permission: string;
  reason: string;
  grantedAt: string;
  expiresAt: string;
  isActive: boolean;
  grantedBy: {
    firstName: string;
    lastName: string;
  };
}

export const TemporaryPermissionsPage: React.FC = () => {
  const { canViewTemporaryPermissions, canManageTemporaryPermissions } =
    usePermissions();
  const [temporaryPermissions, setTemporaryPermissions] = useState<
    TemporaryPermission[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (canViewTemporaryPermissions()) {
      loadTemporaryPermissions();
    }
  }, []);

  const loadTemporaryPermissions = async () => {
    try {
      setIsLoading(true);
      // In a real app, you'd fetch this from your API
      const mockTemporaryPermissions: TemporaryPermission[] = [
        {
          id: '1',
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
          },
          permission: 'perform_surgery',
          reason: 'Emergency surgery coverage needed',
          grantedAt: '2024-01-15T10:00:00Z',
          expiresAt: '2024-01-20T18:00:00Z',
          isActive: true,
          grantedBy: { firstName: 'Dr. Smith', lastName: 'Johnson' },
        },
        {
          id: '2',
          user: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
          },
          permission: 'view_audit_logs',
          reason: 'Compliance review required',
          grantedAt: '2024-01-14T14:00:00Z',
          expiresAt: '2024-01-16T17:00:00Z',
          isActive: true,
          grantedBy: { firstName: 'Admin', lastName: 'User' },
        },
        {
          id: '3',
          user: {
            firstName: 'Mike',
            lastName: 'Johnson',
            email: 'mike.johnson@example.com',
          },
          permission: 'manage_cash_transactions',
          reason: 'Cashier backup during peak hours',
          grantedAt: '2024-01-13T09:00:00Z',
          expiresAt: '2024-01-14T17:00:00Z',
          isActive: false,
          grantedBy: { firstName: 'Manager', lastName: 'Wilson' },
        },
      ];
      setTemporaryPermissions(mockTemporaryPermissions);
    } catch (error) {
      console.error('Failed to load temporary permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemporaryPermissions = temporaryPermissions.filter(
    (permission) => {
      const matchesSearch =
        permission.user.firstName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        permission.user.lastName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        permission.permission.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'active' && permission.isActive) ||
        (filterStatus === 'expired' &&
          new Date(permission.expiresAt) < new Date());

      return matchesSearch && matchesFilter;
    }
  );

  const getExpirationStatus = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        status: 'expired',
        color: 'bg-red-100 text-red-800',
        text: 'Expired',
      };
    if (diffDays <= 1)
      return {
        status: 'expiring',
        color: 'bg-orange-100 text-orange-800',
        text: 'Expires Today',
      };
    if (diffDays <= 3)
      return {
        status: 'expiring-soon',
        color: 'bg-yellow-100 text-yellow-800',
        text: `Expires in ${diffDays} days`,
      };
    return {
      status: 'active',
      color: 'bg-green-100 text-green-800',
      text: `Expires in ${diffDays} days`,
    };
  };

  if (!canViewTemporaryPermissions()) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>
            You don't have permission to view temporary permissions.
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
          <h1 className='text-2xl font-bold'>Temporary Permissions</h1>
          <p className='text-muted-foreground'>
            Manage and monitor temporary permission grants across the system
          </p>
        </div>
        {canManageTemporaryPermissions() && (
          <Button>
            <Add sx={{ fontSize: 16, mr: 1 }} />
            Grant Permission
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
                  Total Temporary
                </p>
                <p className='text-2xl font-bold'>
                  {temporaryPermissions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <AccessTime sx={{ fontSize: 32, color: 'success.main' }} />
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Active
                </p>
                <p className='text-2xl font-bold'>
                  {
                    temporaryPermissions.filter(
                      (p) => p.isActive && new Date(p.expiresAt) > new Date()
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <Warning sx={{ fontSize: 32, color: 'warning.main' }} />
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Expiring Soon
                </p>
                <p className='text-2xl font-bold'>
                  {
                    temporaryPermissions.filter((p) => {
                      const expiresAt = new Date(p.expiresAt);
                      const now = new Date();
                      const diffDays = Math.ceil(
                        (expiresAt.getTime() - now.getTime()) /
                          (1000 * 60 * 60 * 24)
                      );
                      return p.isActive && diffDays <= 3 && diffDays > 0;
                    }).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <Person sx={{ fontSize: 32, color: 'purple.600' }} />
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Unique Users
                </p>
                <p className='text-2xl font-bold'>
                  {new Set(temporaryPermissions.map((p) => p.user.email)).size}
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
          <Tab value='permissions' label='All Permissions' />
        </Box>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Box className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Recent Permissions */}
              <Card>
                <CardHeader>
                  <Typography variant='h6' component='h3'>
                    Recent Temporary Permissions
                  </Typography>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {temporaryPermissions.slice(0, 5).map((permission) => {
                      const expirationStatus = getExpirationStatus(
                        permission.expiresAt
                      );
                      return (
                        <div
                          key={permission.id}
                          className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                        >
                          <div>
                            <p className='font-medium'>
                              {permission.user.firstName}{' '}
                              {permission.user.lastName}
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              {permission.permission.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <div className='text-right'>
                            <Chip
                              label={expirationStatus.text}
                              className={expirationStatus.color}
                            />
                            <p className='text-xs text-muted-foreground mt-1'>
                              Expires:{' '}
                              {format(new Date(permission.expiresAt), 'MMM dd')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Permission Distribution */}
              <Card>
                <CardHeader>
                  <Typography variant='h6' component='h3'>
                    Permission Distribution
                  </Typography>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {Array.from(
                      new Set(temporaryPermissions.map((p) => p.permission))
                    ).map((permission) => {
                      const count = temporaryPermissions.filter(
                        (p) => p.permission === permission
                      ).length;
                      return (
                        <div
                          key={permission}
                          className='flex items-center justify-between'
                        >
                          <span className='text-sm'>
                            {permission.replace(/_/g, ' ')}
                          </span>
                          <Chip label={count} variant='outlined' />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Box>
        )}

        {/* All Permissions Tab */}
        {activeTab === 'permissions' && (
          <Box className='space-y-4'>
            <Card>
              <CardHeader>
                <Typography variant='h6' component='h3'>
                  Temporary Permissions
                </Typography>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className='flex space-x-4 mb-4'>
                  <div className='flex-1'>
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
                        placeholder='Search by user or permission...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='pl-10'
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className='w-48'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='expired'>Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Granted</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemporaryPermissions.map((permission) => {
                      const expirationStatus = getExpirationStatus(
                        permission.expiresAt
                      );
                      return (
                        <TableRow key={permission.id}>
                          <TableCell>
                            <div>
                              <p className='font-medium'>
                                {permission.user.firstName}{' '}
                                {permission.user.lastName}
                              </p>
                              <p className='text-sm text-muted-foreground'>
                                {permission.user.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={permission.permission.replace(/_/g, ' ')}
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell className='max-w-xs'>
                            <p className='truncate text-sm'>
                              {permission.reason}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className='text-sm'>
                              <p>
                                {format(
                                  new Date(permission.grantedAt),
                                  'MMM dd, yyyy'
                                )}
                              </p>
                              <p className='text-muted-foreground'>
                                by {permission.grantedBy.firstName}{' '}
                                {permission.grantedBy.lastName}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='text-sm'>
                              <p>
                                {format(
                                  new Date(permission.expiresAt),
                                  'MMM dd, yyyy HH:mm'
                                )}
                              </p>
                              <Chip
                                label={expirationStatus.text}
                                className={expirationStatus.color}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                permission.isActive ? 'Active' : 'Inactive'
                              }
                              variant={
                                permission.isActive ? 'filled' : 'outlined'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className='flex space-x-2'>
                              {canManageTemporaryPermissions() && (
                                <>
                                  <Button size='sm' variant='outline'>
                                    Extend
                                  </Button>
                                  <Button size='sm' variant='outline'>
                                    Revoke
                                  </Button>
                                </>
                              )}
                              <Button size='sm' variant='outline'>
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
