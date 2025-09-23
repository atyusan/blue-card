import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Avatar,
  Divider,
  Alert,
  Skeleton,
  Stack,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  People,
  Security,
  Visibility,
  MoreVert,
  CheckCircle,
  Cancel,
  AdminPanelSettings,
  Group,
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
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>(
    'create'
  );

  useEffect(() => {
    if (canViewRoles()) {
      loadRoles();
    }
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      // Mock data for now
      const mockRoles: Role[] = [
        {
          id: '1',
          name: 'Administrator',
          code: 'ADMIN',
          description: 'Full system access with all permissions',
          permissions: ['admin'],
          isActive: true,
          staffCount: 3,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
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
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: '3',
          name: 'Nurse',
          code: 'NURSE',
          description: 'Nursing staff with patient care permissions',
          permissions: ['manage_patients', 'view_billing', 'manage_lab_tests'],
          isActive: true,
          staffCount: 25,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
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
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: '5',
          name: 'Lab Technician',
          code: 'LAB_TECH',
          description: 'Laboratory testing and results management',
          permissions: ['manage_lab_tests', 'view_patients'],
          isActive: true,
          staffCount: 12,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
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

  const handleCreateRole = () => {
    setSelectedRole(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    // Implement delete functionality
    console.log('Delete role:', role);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRole(null);
  };

  if (!canViewRoles()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error' sx={{ textAlign: 'center' }}>
          You don't have permission to view roles.
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant='h6' sx={{ textAlign: 'center', mb: 3 }}>
          Loading roles...
        </Typography>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant='text' height={40} />
                  <Skeleton variant='text' height={20} />
                  <Skeleton variant='text' height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant='h4'
            component='h1'
            sx={{ fontWeight: 'bold', mb: 1 }}
          >
            Role Management
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Manage system roles and their associated permissions
          </Typography>
        </Box>
        {canManageRoles() && (
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={handleCreateRole}
            sx={{ height: 40 }}
          >
            Add Role
          </Button>
        )}
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <Security />
                </Avatar>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Total Roles
                  </Typography>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    {roles.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Active Users
                  </Typography>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    {roles.reduce((sum, role) => sum + role.staffCount, 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Active Roles
                  </Typography>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    {roles.filter((role) => role.isActive).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                  <AdminPanelSettings />
                </Avatar>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Total Permissions
                  </Typography>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    {
                      Array.from(
                        new Set(roles.flatMap((role) => role.permissions))
                      ).length
                    }
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder='Search roles...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader
          title='All Roles'
          subheader={`${filteredRoles.length} roles found`}
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Staff Count</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
                      >
                        {role.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography
                          variant='subtitle2'
                          sx={{ fontWeight: 600 }}
                        >
                          {role.name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={role.code}
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      {role.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {role.permissions.slice(0, 3).map((permission) => (
                        <Chip
                          key={permission}
                          label={permission}
                          size='small'
                          color='default'
                          variant='outlined'
                        />
                      ))}
                      {role.permissions.length > 3 && (
                        <Chip
                          label={`+${role.permissions.length - 3} more`}
                          size='small'
                          color='default'
                          variant='outlined'
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Group fontSize='small' color='action' />
                      <Typography variant='body2'>{role.staffCount}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={role.isActive ? 'Active' : 'Inactive'}
                      color={role.isActive ? 'success' : 'default'}
                      size='small'
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Tooltip title='View Details'>
                        <IconButton
                          size='small'
                          onClick={() => handleViewRole(role)}
                        >
                          <Visibility fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      {canManageRoles() && (
                        <>
                          <Tooltip title='Edit Role'>
                            <IconButton
                              size='small'
                              onClick={() => handleEditRole(role)}
                            >
                              <Edit fontSize='small' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Delete Role'>
                            <IconButton
                              size='small'
                              onClick={() => handleDeleteRole(role)}
                              color='error'
                            >
                              <Delete fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Role Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Create New Role'}
          {dialogMode === 'edit' && 'Edit Role'}
          {dialogMode === 'view' && 'Role Details'}
        </DialogTitle>
        <DialogContent>
          {selectedRole && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box>
                <Typography variant='h6' gutterBottom>
                  {selectedRole.name}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {selectedRole.description}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant='subtitle1' gutterBottom>
                  Permissions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedRole.permissions.map((permission) => (
                    <Chip
                      key={permission}
                      label={permission}
                      color='primary'
                      variant='outlined'
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant='subtitle1' gutterBottom>
                  Staff Count
                </Typography>
                <Typography variant='body2'>
                  {selectedRole.staffCount} users assigned to this role
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button variant='contained'>
              {dialogMode === 'create' ? 'Create' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
