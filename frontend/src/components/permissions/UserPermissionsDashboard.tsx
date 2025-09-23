import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Tabs,
  Tab,
  Skeleton,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Security,
  Person,
  People,
  Schedule,
  CheckCircle,
  Warning,
  Info,
  Visibility,
  Edit,
  Delete,
  Add,
  Refresh,
  TrendingUp,
  TrendingDown,
  AccessTime,
  Star,
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';

interface UserPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  source: 'role' | 'direct' | 'temporary';
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`permissions-tabpanel-${index}`}
      aria-labelledby={`permissions-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const UserPermissionsDashboard: React.FC = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions();

  // Mock data for demonstration
  useEffect(() => {
    const mockPermissions: UserPermission[] = [
      {
        id: '1',
        name: 'view_patients',
        description: 'View patient information',
        category: 'Patient Management',
        source: 'role',
        grantedAt: '2024-01-01',
        isActive: true,
      },
      {
        id: '2',
        name: 'edit_patients',
        description: 'Edit patient information',
        category: 'Patient Management',
        source: 'role',
        grantedAt: '2024-01-01',
        isActive: true,
      },
      {
        id: '3',
        name: 'view_appointments',
        description: 'View appointment schedules',
        category: 'Appointments',
        source: 'role',
        grantedAt: '2024-01-01',
        isActive: true,
      },
      {
        id: '4',
        name: 'manage_staff',
        description: 'Manage staff members',
        category: 'Staff Management',
        source: 'direct',
        grantedAt: '2024-01-15',
        isActive: true,
      },
      {
        id: '5',
        name: 'view_audit_logs',
        description: 'View system audit logs',
        category: 'System Administration',
        source: 'temporary',
        grantedAt: '2024-01-15',
        expiresAt: '2024-01-20',
        isActive: true,
      },
    ];

    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'Doctor',
        description: 'Medical staff with patient management permissions',
        permissions: ['view_patients', 'edit_patients', 'view_appointments'],
        isActive: true,
      },
      {
        id: '2',
        name: 'Nurse',
        description: 'Nursing staff with patient care permissions',
        permissions: ['view_patients', 'view_appointments'],
        isActive: true,
      },
      {
        id: '3',
        name: 'Administrator',
        description: 'System administrators with full access',
        permissions: ['admin'],
        isActive: true,
      },
    ];

    setTimeout(() => {
      setPermissions(mockPermissions);
      setRoles(mockRoles);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'role':
        return <People fontSize='small' />;
      case 'direct':
        return <Star fontSize='small' />;
      case 'temporary':
        return <AccessTime fontSize='small' />;
      default:
        return <Info fontSize='small' />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'role':
        return 'primary';
      case 'direct':
        return 'secondary';
      case 'temporary':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'role':
        return 'Role-based';
      case 'direct':
        return 'Direct';
      case 'temporary':
        return 'Temporary';
      default:
        return source;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Patient Management':
        return <Person />;
      case 'Appointments':
        return <Schedule />;
      case 'Staff Management':
        return <People />;
      case 'System Administration':
        return <Security />;
      default:
        return <Info />;
    }
  };

  const rolePermissions = permissions.filter((p) => p.source === 'role');
  const directPermissions = permissions.filter((p) => p.source === 'direct');
  const temporaryPermissions = permissions.filter(
    (p) => p.source === 'temporary'
  );
  const activePermissions = permissions.filter((p) => p.isActive);
  const expiredPermissions = permissions.filter((p) => !p.isActive);

  const totalPermissions = permissions.length;
  const activeCount = activePermissions.length;
  const expiredCount = expiredPermissions.length;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant='h4' gutterBottom>
          User Permissions Dashboard
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardContent>
                <Skeleton variant='text' width='60%' height={24} />
                <Skeleton variant='text' width='40%' height={20} />
                <Skeleton variant='rectangular' height={60} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        User Permissions Dashboard
      </Typography>
      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        Overview of your current permissions and access levels
      </Typography>

      {/* Permission Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Security sx={{ color: 'primary.main', fontSize: 40 }} />
              <Box>
                <Typography variant='h4' component='div' color='primary.main'>
                  {totalPermissions}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Total Permissions
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircle sx={{ color: 'success.main', fontSize: 40 }} />
              <Box>
                <Typography variant='h4' component='div' color='success.main'>
                  {activeCount}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Active Permissions
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <People sx={{ color: 'secondary.main', fontSize: 40 }} />
              <Box>
                <Typography variant='h4' component='div' color='secondary.main'>
                  {roles.length}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Assigned Roles
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccessTime sx={{ color: 'warning.main', fontSize: 40 }} />
              <Box>
                <Typography variant='h4' component='div' color='warning.main'>
                  {temporaryPermissions.length}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Temporary Permissions
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Permission Status Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Permission Status Overview
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant='body2'>Active Permissions</Typography>
            <Typography variant='body2' color='text.secondary'>
              {activeCount} / {totalPermissions}
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={(activeCount / totalPermissions) * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant='caption' color='text.secondary'>
              {activeCount} active
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {expiredCount} expired
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label='permissions dashboard tabs'
            >
              <Tab label='Overview' icon={<Info />} iconPosition='start' />
              <Tab
                label='All Permissions'
                icon={<Security />}
                iconPosition='start'
              />
              <Tab label='Roles' icon={<People />} iconPosition='start' />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)',
                },
                gap: 3,
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Permission Sources
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <People color='primary' />
                        <Typography variant='body2'>Role-based</Typography>
                      </Box>
                      <Chip
                        label={rolePermissions.length}
                        color='primary'
                        size='small'
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Star color='secondary' />
                        <Typography variant='body2'>Direct</Typography>
                      </Box>
                      <Chip
                        label={directPermissions.length}
                        color='secondary'
                        size='small'
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <AccessTime color='warning' />
                        <Typography variant='body2'>Temporary</Typography>
                      </Box>
                      <Chip
                        label={temporaryPermissions.length}
                        color='warning'
                        size='small'
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Recent Activity
                  </Typography>
                  <List dense>
                    {permissions.slice(0, 3).map((permission) => (
                      <ListItem key={permission.id} dense>
                        <ListItemIcon>
                          {getCategoryIcon(permission.category)}
                        </ListItemIcon>
                        <ListItemText
                          primary={permission.name}
                          secondary={`Granted ${new Date(
                            permission.grantedAt
                          ).toLocaleDateString()}`}
                        />
                        <Chip
                          icon={getSourceIcon(permission.source)}
                          label={getSourceLabel(permission.source)}
                          color={getSourceColor(permission.source) as any}
                          size='small'
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <TableContainer component={Paper} variant='outlined'>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Permission</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Granted</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <Typography variant='body2' fontWeight='medium'>
                          {permission.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{permission.description}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getCategoryIcon(permission.category)}
                          label={permission.category}
                          size='small'
                          variant='outlined'
                          color='primary'
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getSourceIcon(permission.source)}
                          label={getSourceLabel(permission.source)}
                          color={getSourceColor(permission.source) as any}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(permission.grantedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {permission.expiresAt ? (
                          new Date(permission.expiresAt).toLocaleDateString()
                        ) : (
                          <Typography variant='body2' color='text.secondary'>
                            Never
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={permission.isActive ? 'Active' : 'Expired'}
                          color={permission.isActive ? 'success' : 'error'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {hasPermission('view_permission_details') && (
                            <Tooltip title='View Details'>
                              <IconButton size='small'>
                                <Visibility fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
                gap: 3,
              }}
            >
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant='h6' component='h3' gutterBottom>
                          {role.name}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {role.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={role.isActive ? 'Active' : 'Inactive'}
                        color={role.isActive ? 'success' : 'error'}
                        size='small'
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Permissions ({role.permissions.length}):
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {role.permissions.map((permission) => (
                          <Chip
                            key={permission}
                            label={permission}
                            size='small'
                            variant='outlined'
                            color='primary'
                          />
                        ))}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='caption' color='text.secondary'>
                        Role ID: {role.id}
                      </Typography>
                      <Box>
                        {hasPermission('view_role_details') && (
                          <Tooltip title='View Role Details'>
                            <IconButton size='small'>
                              <Visibility fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Alerts */}
      {temporaryPermissions.length > 0 && (
        <Alert severity='warning' sx={{ mt: 3 }}>
          You have {temporaryPermissions.length} temporary permission(s) that
          will expire soon. Contact your administrator if you need extended
          access.
        </Alert>
      )}

      {expiredCount > 0 && (
        <Alert severity='info' sx={{ mt: 2 }}>
          You have {expiredCount} expired permission(s). Some features may not
          be accessible.
        </Alert>
      )}
    </Box>
  );
};
